import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// ---- CORS (restrict in production via ALLOWED_ORIGINS="https://example.com,https://app.example.com")
const allowed = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

if (allowed.length === 1 && allowed[0] === "*") {
  app.use(cors());
} else {
  app.use(
    cors({
      origin: function (origin, cb) {
        if (!origin) return cb(null, true); // allow server-to-server / curl
        const ok = allowed.includes(origin);
        cb(ok ? null : new Error("Not allowed by CORS"), ok);
      },
    })
  );
}

// ---- Env
const {
  OPENAI_API_KEY,
  OPENAI_MODEL = "gpt-4o-mini",
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  YOUTUBE_API_KEY,
  PORT = 3000,
} = process.env;

// ---- Helpers
function httpJson(res, obj, status = 200) {
  if (obj && obj.error && status === 200) status = 500;
  return res.status(status).json(obj);
}

// ---- OpenAI: create JSON suggestions for playlist titles/tags per platform
app.post("/ai/music-plan", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return httpJson(res, { error: "OPENAI_API_KEY missing" }, 500);
    const { description } = req.body || {};
    if (!description) return httpJson(res, { error: "Missing description" }, 400);

    const body = {
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `Du bist ein erfahrener Party-Musik-Kurator.
Gib AUSSCHLIESSLICH valides JSON zurück:
{
  "spotify": [
    {"title":"", "note":"", "tags":["",""]}
  ],
  "youtube": [
    {"title":"", "note":"", "tags":["",""]}
  ]
}
Regeln:
- Je Plattform 5–8 Vorschläge.
- title: prägnanter, suchbarer Playlist-Titel (keine Emojis).
- note: 1 kurze Zeile, warum es passt (Stimmung/Tempo/Decade/Genre).
- tags: 2–5 kurze Tags (z.B. 90s, EDM, deutsch, energy, chill).
- Keine URLs/Emojis/Markdown. Nur JSON.`,
        },
        { role: "user", content: `Beschreibung: ${description}` },
      ],
      temperature: 0.7,
      max_tokens: 700,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok || data.error) return httpJson(res, data, r.status || 500);

    let parsed = null;
    try {
      parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch (_) {
      return httpJson(res, { error: "Invalid JSON from model" }, 500);
    }
    return httpJson(res, parsed);
  } catch (e) {
    return httpJson(res, { error: String(e) }, 500);
  }
});

// ---- Spotify: Client Credentials token (cached in-memory)
let _spotifyToken = null;
let _spotifyExp = 0;
async function getSpotifyAppToken() {
  const now = Date.now();
  if (_spotifyToken && now < _spotifyExp - 60_000) return _spotifyToken; // reuse if >60s valid
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET)
    throw new Error("Spotify credentials missing");
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: "grant_type=client_credentials",
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.error_description || "Spotify token error");
  _spotifyToken = json.access_token;
  _spotifyExp = Date.now() + (json.expires_in || 3600) * 1000;
  return _spotifyToken;
}

// ---- Spotify: search playlists (public), market=DE to bias results
app.get("/spotify/search", async (req, res) => {
  try {
    const q = (req.query.q || "").toString();
    if (!q) return httpJson(res, { error: "Missing q" }, 400);
    const token = await getSpotifyAppToken();
    const url = `https://api.spotify.com/v1/search?type=playlist&limit=8&market=DE&q=${encodeURIComponent(
      q
    )}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) return httpJson(res, data, r.status || 500);
    const items =
      data.playlists?.items?.map((p) => ({
        title: p.name,
        url: p.external_urls?.spotify,
        owner: p.owner?.display_name,
        tracks: p.tracks?.total,
        image: p.images?.[0]?.url,
      })) || [];
    return httpJson(res, { results: items });
  } catch (e) {
    return httpJson(res, { error: String(e) }, 500);
  }
});

// ---- YouTube: search playlists
app.get("/youtube/search", async (req, res) => {
  try {
    if (!YOUTUBE_API_KEY) return httpJson(res, { error: "YOUTUBE_API_KEY missing" }, 500);
    const q = (req.query.q || "").toString();
    if (!q) return httpJson(res, { error: "Missing q" }, 400);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=8&key=${encodeURIComponent(
      YOUTUBE_API_KEY
    )}&q=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return httpJson(res, data, r.status || 500);
    const items =
      data.items?.map((i) => ({
        title: i.snippet?.title,
        url: `https://www.youtube.com/playlist?list=${i.id?.playlistId}`,
        channel: i.snippet?.channelTitle,
        image: i.snippet?.thumbnails?.medium?.url,
      })) || [];
    return httpJson(res, { results: items });
  } catch (e) {
    return httpJson(res, { error: String(e) }, 500);
  }
});

app.get("/health", (_req, res) => res.type("text").send("ok"));
app.get("/", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
