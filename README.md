# Bestel & Voorraad Tracker

Welkom bij de Bestel & Voorraad Tracker! Deze applicatie is ontworpen om u te helpen bij het eenvoudig beheren van bestellingen, leveringen, verbruik en voorraad van voedingsartikelen. Het is een lichtgewicht, lokaal draaiende webapplicatie die perfect is voor gebruik op systemen met beperkte middelen, zoals een Chromebook.

## Inhoudsopgave
1.  [Installatie](#installatie)
2.  [Hoe de Applicatie te Starten](#hoe-de-applicatie-te-starten)
3.  [Uitleg van de Schermen](#uitleg-van-de-schermen)
    *   [Dashboard](#dashboard)
    *   [Voorraad](#voorraad)
    *   [Historiek](#historiek)
    *   [Beheer](#beheer)
4.  [Belangrijkste Taken](#belangrijkste-taken)
    *   [Een Nieuwe Bestelling Plaatsen](#een-nieuwe-bestelling-plaatsen)
    *   [Een Levering Bevestigen](#een-levering-bevestigen)

---

## Installatie

Deze applicatie is ontworpen om lokaal op uw computer te draaien. Volg deze stappen om alles correct in te stellen. **U hoeft dit maar één keer te doen.**

**Vereisten:** U heeft `node.js` en `pnpm` nodig. Als u een Chromebook met een Linux-container gebruikt, zijn deze waarschijnlijk al geïnstalleerd.

Open een terminal en voer de volgende commando's uit in de map waar u de code heeft opgeslagen:

1.  **Installeer alle benodigde pakketten:**
    ```bash
    pnpm install
    ```
2.  **Installeer extra server-pakketten:**
    ```bash
    pnpm add express cors
    ```
3.  **Maak de lokale database aan en synchroniseer:** Dit commando zet de database op basis van het schema.
    ```bash
    pnpm exec prisma db push
    ```
4.  **Genereer de Prisma-client:** Dit zorgt ervoor dat de server met de database kan praten.
    ```bash
    pnpm exec prisma generate
    ```

Dat is alles! De applicatie is nu klaar voor gebruik.

## Hoe de Applicatie te Starten

Elke keer dat u de applicatie wilt gebruiken, volgt u deze stappen. U heeft **twee terminals** nodig die u tegelijk open laat.

1.  **Start de backend server (Terminal 1):**
    Open een terminal in de projectmap en voer uit:
    ```bash
    node server/index.js
    ```
    Laat deze terminal open. U zult zien staan: `Server draait op http://localhost:3000`.

2.  **Start de frontend (Terminal 2):**
    Open een *tweede* terminal in dezelfde projectmap en voer uit:
    ```bash
    pnpm dev
    ```
    Deze terminal zal u een link geven, meestal `http://localhost:5173`. Open deze link in uw webbrowser om de applicatie te gebruiken.

## Uitleg van de Schermen

De applicatie heeft vier hoofdschermen, toegankelijk via de knoppen bovenaan.

### Dashboard
Dit is uw hoofdscherm. Het geeft een overzicht van uw recente bestellingen en leveringen. Van hieruit kunt u de meest voorkomende taken starten.

### Voorraad
Dit scherm toont u een overzicht van alle producten die u momenteel op voorraad heeft.

### Historiek
Hier kunt u een volledig overzicht van al uw vroegere leveringen terugvinden.

### Beheer
Op dit scherm kunt u uw data beheren (bijv. back-ups maken/importeren). *Deze functionaliteit is momenteel nog in ontwikkeling.*

## Belangrijkste Taken

### Een Nieuwe Bestelling Plaatsen
1.  Ga naar het **Dashboard**.
2.  Klik op de knop **"+ Nieuwe Bestelling"**.
3.  Een formulier verschijnt. Vul de productnaam, de prijs per eenheid, het aantal en de week waarvoor u bestelt in.
4.  Klik op **"Bestelling Toevoegen"**. De data wordt opgeslagen en het overzicht wordt vernieuwd.

### Een Levering Bevestigen
1.  Ga naar het **Dashboard**.
2.  Klik op de knop **"Levering Bevestigen"**.
3.  Selecteer de bestelling die is geleverd uit de dropdown-lijst.
4.  De gegevens worden automatisch ingevuld. Pas deze aan indien nodig.
5.  Klik op **"Bevestig Levering & Start Verbruik"**. De levering wordt geregistreerd.
