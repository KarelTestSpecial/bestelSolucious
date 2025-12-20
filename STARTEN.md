`STARTEN.md`

===========================
Starten maar! (Samenvatting)
============================

Je hebt twee manieren om de app te starten op je Chromebook.

MANIER 1: Het Automatische Script (Snelst)
------------------------------------------
Als je de snelkoppeling hebt ingesteld, klik je gewoon op het icoon in je launcher.
Of typ in de terminal:

./bestel.sh


MANIER 2: Handmatig (Voor onderhoud/updates)
--------------------------------------------
Als je updates hebt gedaan (zoals `pnpm install`), gebruik dan deze volgorde:

1. Installeer updates (indien nodig):
   pnpm install
   pnpm exec prisma generate

2. Start de Backend (Terminal 1):
   node server/index.js

3. Start de Frontend (Terminal 2):
   pnpm dev

4. Open je browser op:
   http://localhost:5173
