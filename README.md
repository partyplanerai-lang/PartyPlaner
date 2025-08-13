# 🎉 Partyplaner Backend

Dieses Backend stellt 4 verschiedene Planer-APIs zur Verfügung, um Partys und Events mit KI-Unterstützung zu planen.
Es basiert auf **Node.js** + **Express** und nutzt die **OpenAI API**.

## 🚀 Features

- **Planer #1**: Party-Drink-Planer (Fokus auf alkoholische Getränke + Snacks, optional Essen)
- **Planer #2**: Trinkspiel-Generator (2 Klassiker + 2 neue kreative Spiele)
- **Planer #3**: Musik-Planer (Spotify/YouTube-Integration möglich)
- **Planer #4**: Voller Partyplaner (inkl. optionaler Deko, Einladungstext und Budgetplan)

## 📦 Installation

1. Repository klonen oder Dateien herunterladen
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. `.env` Datei erstellen mit folgendem Inhalt:
   ```env
   OPENAI_API_KEY=dein_openai_api_key
   ```

## ▶️ Starten

```bash
npm start
```

Server startet standardmäßig auf Port `3000`.

## 🔗 API Endpoints

### 1. Party-Drink-Planer
POST `/api/partyplaner1`
```json
{
  "description": "Grillparty mit 10 Leuten, wilde Party – mit passendem Essen"
}
```

### 2. Trinkspiel-Generator
POST `/api/partyplaner2`
```json
{}
```

### 3. Musik-Planer
*(in bestehendem Backend um Spotify/YouTube erweitern)*

### 4. Voller Partyplaner
POST `/api/partyplaner4`
```json
{
  "description": "Sommerfest mit 20 Leuten, ruhig – mit passendem Essen",
  "withDeco": true,
  "withInvite": true,
  "withBudget": false
}
```

## 📜 Lizenz
MIT License
