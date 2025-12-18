===========================
Starten maar! (Samenvatting)
============================

Als alles op zijn plek staat, voer je deze stappen uit in je terminal (zoals in je README beschreven staat):

Installeer dependencies:

pnpm install

Maak de database:

pnpm exec prisma db push

Genereer de client:

pnpm exec prisma generate

Start de backend (Terminal 1):

node server/index.js

Start de frontend (Terminal 2):

pnpm dev


Je kunt nu naar http://localhost:5173 gaan.
