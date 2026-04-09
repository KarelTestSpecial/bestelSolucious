---
design_depth: standard
task_complexity: medium
---
# Design: Bestel-Tracker Cleanup (better-sqlite3)

## 1. Probleemstelling
De huidige `node_modules` (224MB) is te zwaar voor een eenvoudige app op een Chromebook. Prisma (~86MB), Lucide-React (~33MB) en Concurrently/RxJS (~15MB) zijn de grootste ruimte-verbruikers.

## 2. Eisen
- **Functioneel**: De applicatie moet exact hetzelfde blijven doen (bestellingen en leveringen bijhouden).
- **Niet-functioneel**: De `node_modules` moet onder de 100MB uitkomen.
- **Beperkingen**: Geen gebruik van zware binaries (geen Prisma engines meer).

## 3. Aanpak (Geselecteerde Aanpak)
1.  **Iconen (Emojis/Unicode)**: We vervangen `lucide-react` volledig door Emojis. Dit verwijdert 33MB en maakt de UI visueel licht.
2.  **Procesmanager (Bash '&')**: We vervangen `concurrently` door de native shell operator in `package.json`. Dit verwijdert 15MB.
3.  **Database (better-sqlite3)**: We vervangen Prisma door `better-sqlite3`. Dit verwijdert de zware engines (~86MB). Dit vergt het herschrijven van de database-queries in `server/index.js` en de cleanup-scripts.

### Beslissingsmatrix (Standard Depth)
| Criterium | Gewicht | Prisma (Huidig) | better-sqlite3 (Keuze) | Emojis (Keuze) |
|-----------|---------|-----------------|------------------------|----------------|
| Schijfruimte | 50% | 1: Erg zwaar (86MB) | 5: Licht (~10MB totaal) | 5: Geen overhead |
| Ontwikkelgemak | 30% | 5: Uitstekend (Type-safe) | 3: SQL handmatig | 5: Geen dependency |
| Performance | 20% | 4: Goed | 5: Zeer snel (Native SQLite) | 5: Direct |
| **Weighted Total** | | **3.2** | **4.4** | **5.0** |

## 4. Architectuur
- **Frontend**: React (Vite) blijft behouden, maar zonder Lucide.
- **Backend**: Express server blijft behouden, maar de `PrismaClient` wordt vervangen door een `Database` instance van `better-sqlite3`.
- **Database**: De `prisma/dev.db` blijft de bron, maar we benaderen deze direct.

## 5. Agent Team
- `refactor`: Voor de database-laag en het vervangen van de iconen in de componenten.
- `coder`: Voor het aanpassen van de configuratie en scripts.

## 6. Risicobeoordeling
- **Database Migratie (Hoog)**: Het risico op foutieve SQL-queries tijdens het herschrijven. We moeten de data-integriteit bewaken.
- **Build-fouten (Middelhoog)**: Het verwijderen van Prisma vereist aanpassingen in het build-proces (`vite.config.js` etc.).

## 7. Succescriteria
- `node_modules` is onder de 100MB.
- `pnpm dev:all` (of de nieuwe variant) start de app correct.
- Bestellingen en leveringen worden correct opgeslagen en getoond.
