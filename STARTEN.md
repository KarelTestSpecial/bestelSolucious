`STARTEN.md`

================================
De Extensie Starten
================================

Dit project is een Chrome-extensie die de applicatie in een nieuw tabblad opent.

## Installatie en Gebruik

1.  **Installeer de afhankelijkheden**:
    Als je dit de eerste keer doet, installeer dan de nodige packages.
    ```bash
    pnpm install
    ```

2.  **Bouw de extensie**:
    Voer dit commando uit om de bestanden voor de extensie te genereren.
    ```bash
    pnpm run build
    ```
    De uitvoer komt in de `dist`-map te staan.

3.  **Laad in Chrome**:
    *   Open Chrome en ga naar `chrome://extensions`.
    *   Zet "Developer mode" aan.
    *   Klik op "Load unpacked" en selecteer de `dist`-map.

Nu kun je de extensie gebruiken door op het icoon in je browser te klikken. De applicatie wordt geopend in een nieuw tabblad.
