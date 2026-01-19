# Bestel Tracker

Dit project is een webapplicatie voor het beheren van bestellingen en voorraad.

## De Webapplicatie Starten

### Manier 1: Het Automatische Script (Snelst)

Als je de snelkoppeling hebt ingesteld, klik je gewoon op het icoon in je launcher.
Of typ in de terminal:

```bash
./bestel.sh
```

### Manier 2: Handmatig (Voor onderhoud/updates)

Als je updates hebt gedaan (zoals `pnpm install`), gebruik dan deze volgorde:

1.  **Installeer updates** (indien nodig):
    ```bash
    pnpm install
    pnpm exec prisma generate
    ```
2.  **Start de Backend** (Terminal 1):
    ```bash
    node server/index.js
    ```
3.  **Start de Frontend** (Terminal 2):
    ```bash
    pnpm dev
    ```
4.  **Open je browser** op: `http://localhost:5173`

## De Chrome Extensie Bouwen en Laden

Om de applicatie als een Chrome-extensie te gebruiken, volg je deze stappen:

1.  **Bouw de extensie**:
    ```bash
    pnpm run build
    ```
    Dit commando compileert de React-applicatie en plaatst de benodigde bestanden in de `dist`-map.

2.  **Laad de extensie in Chrome**:
    *   Open Google Chrome en navigeer naar `chrome://extensions`.
    *   Schakel de **Developer mode** (ontwikkelaarsmodus) in met de schakelaar rechtsboven.
    *   Klik op de knop **Load unpacked** (uitgepakte extensie laden).
    *   Selecteer de `dist`-map in de hoofdmap van dit project.

De extensie zou nu moeten verschijnen in je lijst met extensies en klaar zijn voor gebruik.
