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
    *   [Een Ad-hoc Levering of Gift Registreren](#een-ad-hoc-levering-of-gift-registreren)

---

## Installatie

Deze applicatie is ontworpen om lokaal op uw computer te draaien. Volg deze stappen om alles correct in te stellen. U hoeft dit maar één keer te doen.

**Vereisten:** U heeft `node.js` en `pnpm` nodig. Als u een Chromebook met een Linux-container gebruikt, zijn deze waarschijnlijk al geïnstalleerd.

Open een terminal en voer de volgende commando's uit in de map waar u de code heeft opgeslagen:

1.  **Installeer alle benodigde pakketten:**
    ```bash
    pnpm install
    ```
2.  **Maak de lokale database aan:** Dit commando zet de database op en maakt de nodige tabellen aan.
    ```bash
    pnpm exec prisma migrate dev --name init
    ```

Dat is alles! De applicatie is nu klaar voor gebruik.

## Hoe de Applicatie te Starten

Elke keer dat u de applicatie wilt gebruiken, volgt u deze stappen:

1.  **Start de backend server:** Open een terminal in de projectmap en voer uit:
    ```bash
    node server/index.js
    ```
    Laat deze terminal open; dit is uw server.

2.  **Start de frontend (de gebruikersinterface):** Open een *tweede* terminal in dezelfde projectmap en voer uit:
    ```bash
    pnpm dev
    ```
    Deze terminal zal u een link geven, meestal `http://localhost:5173`. Open deze link in uw webbrowser om de applicatie te gebruiken.

## Uitleg van de Schermen

De applicatie heeft vier hoofdschermen, toegankelijk via de knoppen bovenaan.

### Dashboard
Dit is uw hoofdscherm. Het geeft een overzicht van uw recente bestellingen en leveringen. Van hieruit kunt u de meest voorkomende taken starten, zoals het plaatsen van een nieuwe bestelling.

### Voorraad
Dit scherm toont u een overzicht van alle producten die u momenteel op voorraad heeft. Het berekent de voorraad op basis van wat er is geleverd min wat er is verbruikt.

### Historiek
Hier kunt u een volledig overzicht van al uw vroegere leveringen terugvinden. Dit is handig om te zien wat u in het verleden heeft ontvangen, inclusief ad-hoc leveringen.

### Beheer
Op dit scherm kunt u uw data beheren. U kunt een volledige back-up van uw gegevens exporteren naar een `JSON`-bestand, of een eerdere back-up importeren.

## Belangrijkste Taken

### Een Nieuwe Bestelling Plaatsen
1.  Ga naar het **Dashboard**.
2.  Klik op de knop **"+ Nieuwe Bestelling"**.
3.  Een formulier verschijnt. Vul de productnaam, de prijs per eenheid, het aantal en de week waarvoor u bestelt in.
4.  Klik op **"Bestelling Toevoegen"**. De bestelling verschijnt nu in het overzicht.

### Een Levering Bevestigen
Wanneer een bestelling is geleverd, moet u dit in het systeem bevestigen.

1.  Ga naar het **Dashboard**.
2.  Klik op de knop **"Levering Bevestigen"**.
3.  Selecteer de bestelling die is geleverd uit de dropdown-lijst.
4.  De gegevens van de bestelling worden automatisch ingevuld. U kunt deze aanpassen als de levering afwijkt (bijv. een andere prijs of een ander aantal).
5.  Geef aan hoeveel weken u verwacht dat dit product meegaat. Dit helpt het systeem om de kosten per week te projecteren.
6.  Klik op **"Bevestig Levering & Start Verbruik"**. De bestelling wordt nu gemarkeerd als geleverd en de items worden aan uw voorraad toegevoegd.

### Een Ad-hoc Levering of Gift Registreren
Als u een product ontvangt dat u niet heeft besteld (bijvoorbeeld een gift of iets uit een andere voorraad), kunt u dit ook registreren.

*Momenteel wordt een ad-hoc levering op dezelfde manier geregistreerd als een normale levering, maar u selecteert geen bestelling. Deze functionaliteit zal in de toekomst verder worden uitgebreid.*
