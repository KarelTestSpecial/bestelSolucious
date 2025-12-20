`README.md`

# Bestel & Voorraad Tracker

Welkom bij de Bestel & Voorraad Tracker! Deze applicatie is ontworpen om u te helpen bij het eenvoudig beheren van bestellingen, leveringen, verbruik en voorraad van voedingsartikelen.

## Inhoudsopgave
1.  [Installatie](#installatie)
2.  [Hoe de Applicatie te Starten](#hoe-de-applicatie-te-starten)
3.  [Uitleg van de Schermen](#uitleg-van-de-schermen)
4.  [Belangrijkste Taken](#belangrijkste-taken)
    *   [Een Nieuwe Bestelling Plaatsen](#een-nieuwe-bestelling-plaatsen)
    *   [Batch Import (Excel/Lijsten)](#batch-import-excellijsten)
    *   [Een Levering Bevestigen](#een-levering-bevestigen)

---

## Installatie

Deze applicatie is ontworpen om lokaal op uw Chromebook te draaien.

**Vereisten:** `node.js` en `pnpm` (geïnstalleerd in de Linux-container).

Voer deze commando's eenmalig uit in de terminal:

1.  **Installeer pakketten:**
    ```bash
    pnpm install
    ```
2.  **Database opzetten:**
    ```bash
    pnpm exec prisma db push
    ```
3.  **Client genereren:**
    ```bash
    pnpm exec prisma generate
    ```

## Hoe de Applicatie te Starten

U heeft twee opties:

**Optie A: Via het automatische script (Aanbevolen)**
Dubbelklik op het icoon `Bestel Tracker` in uw applicatielijst, of voer uit in de terminal:
```bash
./bestel.sh
```

**Optie B: Handmatig (voor debuggen)**
Gebruik twee terminals:
1.  Terminal 1 (Backend): `node server/index.js`
2.  Terminal 2 (Frontend): `pnpm dev`

## Uitleg van de Schermen

### Dashboard
Uw hoofdscherm. Geeft een overzicht van bestellingen en leveringen per week. Hier regelt u ook de dagelijkse invoer.

### Voorraad
Toont een berekende lijst van alle producten die momenteel op voorraad zouden moeten zijn, gebaseerd op leveringen minus geregistreerd verbruik.

### Historiek
Een doorzoekbaar archief van alle bestellingen en leveringen uit het verleden.

### Beheer
Hier beheert u de data:
*   **Batch Import:** Snel lijsten plakken uit Excel.
*   **Statistieken:** Totaaltellers van de database.
*   **Backup/Restore:** Download uw data als JSON-bestand om veilig te stellen, of herstel een oude backup.
*   **Reset:** Wis de volledige database (voorzichtig!).

## Belangrijkste Taken

### Een Nieuwe Bestelling Plaatsen
1.  Ga naar het **Dashboard**.
2.  Klik op **"+ Nieuwe Bestelling"**.
3.  Vul de gegevens in (Naam, Prijs, Aantal, Datum).
4.  Klik op **"Bestelling Toevoegen"**.

### Batch Import (Excel/Lijsten)
Heeft u een boodschappenlijstje in Excel of Kladblok?
1.  Ga naar **Beheer**.
2.  Kies de leverdatum (Week wordt automatisch berekend, houdt rekening met jaarwisseling).
3.  Kopieer uw data. Formaat: `Naam ; Aantal ; [Prijs]`.
    *   *Voorbeeld:* `Melk; 6; 0,95`
4.  Plak de tekst in het vak en klik op **"Importeer Bestellingen"**.

### Een Levering Bevestigen
Wanneer de boodschappen binnenkomen:
1.  Ga naar het **Dashboard**.
2.  Klik op **"Levering Bevestigen"**.
3.  Het systeem toont alle openstaande bestellingen.
4.  Controleer de datum en klik op **"Bevestig Alle Artikelen"**.
5.  De items verplaatsen zich van 'Besteld' naar 'Geleverd' en 'Actief Verbruik'.

