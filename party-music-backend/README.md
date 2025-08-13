# Party Music Backend (OpenAI + Spotify + YouTube)

Kleines Node.js-Backend für deinen Musik‑Planer. Es kapselt die API‑Keys serverseitig und liefert deiner Tilda‑Webapp echte Playlist‑Vorschläge.

## Endpunkte

- `POST /ai/music-plan` → erzeugt per OpenAI JSON mit Playlist‑Titeln/Notizen/Tags je Plattform
- `GET /spotify/search?q=...` → sucht echte Spotify‑Playlists (Client Credentials Flow)
- `GET /youtube/search?q=...` → sucht echte YouTube‑Playlists (YouTube Data API v3)
- `GET /health` → Healthcheck

## Deployment (Render)

1. Dieses Repo zu GitHub pushen (ohne `.env`!).
2. In Render **Web Service** → **Public Git Repository** → Repo auswählen.
3. Build Command: *(leer lassen – Render installiert automatisch)* oder `npm install`
4. Start Command: `npm start`
5. In **Environment** diese Variablen setzen (Secrets):
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional, Standard: `gpt-4o-mini`)
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `YOUTUBE_API_KEY`
   - `ALLOWED_ORIGINS` (optional, z. B. `https://deinedomain.tld,https://deinprojekt.tilda.ws`)
6. Deployen → Basis‑URL merken (z. B. `https://your-service.onrender.com`).

## Lokaler Start

```bash
npm install
cp .env.example .env  # .env mit deinen Keys füllen
npm start
```

## Tilda-Frontend anbinden

Im Musik‑Planer‑HTML:

```js
const API_BASE = "https://your-service.onrender.com";

// GPT → erzeugt JSON-Vorschläge
const gptPlan = await fetch(`${API_BASE}/ai/music-plan`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ description })
}).then(r=>r.json());

// Spotify/YouTube → echte Playlists suchen
const sp = await fetch(`${API_BASE}/spotify/search?q=${encodeURIComponent(query)}`).then(r=>r.json());
const yt = await fetch(`${API_BASE}/youtube/search?q=${encodeURIComponent(query)}`).then(r=>r.json());
```

## Sicherheit

- **Keine Secrets** im Frontend einbetten.
- CORS via `ALLOWED_ORIGINS` auf deine Domain(s) beschränken.
- Bei geleakten Keys: umgehend rotieren.
