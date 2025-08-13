import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper function for OpenAI requests
async function askOpenAI(messages, max_tokens = 800) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens
    })
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error?.message || "API Fehler");
  return data.choices?.[0]?.message?.content;
}

// ------------------- Planner #1 -------------------
app.post("/api/partyplaner1", async (req, res) => {
  try {
    const { description } = req.body;
    const includeFood = description.toLowerCase().includes("mit passendem essen");

    const messages = [
      {
        role: "system",
        content: `Du bist ein kreativer deutscher Party-Planer. 
Plane jede Art von Party, ohne Motto, ohne Einladungstext, ohne Budgetplan.
Fokus: Getränke (alkoholisch im Vordergrund), kleine Snacks.
Nur wenn "mit passendem Essen" erwähnt wird, auch Gerichte einplanen.`
      },
      { role: "user", content: `Plane folgende Party: ${description}. Essen: ${includeFood ? "Mit Essen" : "Nur Snacks"}` }
    ];

    const plan = await askOpenAI(messages, 700);
    res.json({ result: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Planner #2 -------------------
app.post("/api/partyplaner2", async (req, res) => {
  try {
    const messages = [
      {
        role: "system",
        content: `Du bist ein Trinkspiel-Generator.
Gib 4 Trinkspiele aus: 2 bekannte Klassiker, 2 neue kreative Eigenkreationen.
Beschreibe kurz die Regeln. Sprache: Deutsch.`
      }
    ];
    const result = await askOpenAI(messages, 500);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Planner #3 -------------------
// Hier könnten Spotify/YouTube APIs angebunden sein, ausgelagert im bestehenden Backend.

// ------------------- Planner #4 -------------------
app.post("/api/partyplaner4", async (req, res) => {
  try {
    const { description, withDeco, withInvite, withBudget } = req.body;
    const includeFood = description.toLowerCase().includes("mit passendem essen");

    const messages = [
      {
        role: "system",
        content: `Du bist ein kreativer, flexibler deutscher Partyplaner.
Du kannst jede Art von Party planen – mit oder ohne Motto.
Output-Gliederung:
1. Kurze Zusammenfassung
2. Getränke (alkoholisch & alkoholfrei, Mengen)
3. Essen/Snacks: Falls "mit passendem Essen" → 2–3 Gerichte, sonst nur Snacks
4. ${withDeco ? "Deko-Ideen" : ""}
5. ${withInvite ? "Einladungstext" : ""}
6. ${withBudget ? "Budget-Schätzung" : ""}
Kein Emoji, klare Abschnitte, lockere Sprache.
Ende: Hinweis, dass es nur Vorschläge sind.`
      },
      {
        role: "user",
        content: `Beschreibung: ${description}
Snacks/Essen: ${includeFood ? "Mit passendem Essen" : "Nur Snacks"}
Deko-Ideen: ${withDeco ? "Ja" : "Nein"}
Einladungstext: ${withInvite ? "Ja" : "Nein"}
Budget: ${withBudget ? "Ja" : "Nein"}`
      }
    ];

    const plan = await askOpenAI(messages, 1200);
    res.json({ result: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
