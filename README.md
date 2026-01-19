# Bestel Tracker Chrome Extensie

Dit project is een Chrome-extensie voor het beheren van bestellingen en voorraad, volledig draaiend in je browser.

## Installatie en Gebruik

1.  **Installeer de afhankelijkheden**:
    ```bash
    pnpm install
    ```

2.  **Bouw de extensie**:
    ```bash
    pnpm run build
    ```
    Dit commando compileert de React-applicatie en plaatst de benodigde bestanden in de `dist`-map.

3.  **Laad de extensie in Chrome**:
    *   Open Google Chrome en navigeer naar `chrome://extensions`.
    *   Schakel de **Developer mode** (ontwikkelaarsmodus) in met de schakelaar rechtsboven.
    *   Klik op de knop **Load unpacked** (uitgepakte extensie laden).
    *   Selecteer de `dist`-map in de hoofdmap van dit project.

De extensie is nu klaar voor gebruik. Klik op het icoon in de werkbalk om de applicatie in een nieuw tabblad te openen. Alle data wordt lokaal opgeslagen in je browser.
