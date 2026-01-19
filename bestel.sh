#!/bin/bash

# --- 1. CONFIGURATIE ---
export PATH="/home/kareltestspecial/.config/nvm/versions/node/v24.13.0/bin:$PATH"
PROJECT_DIR="/home/kareltestspecial/kdc/bestelSolucious/bestel"
cd "$PROJECT_DIR" || exit 1

# --- 2. FUNCTIE OM ALLES TE DODEN (RAM PROTECTIE) ---
cleanup() {
    echo ""
    echo "🛑 Afsluiten..."
    # Kill alle child processen van dit script (dus vite en node)
    pkill -P $$ 
    
    # Voor de zekerheid specifieke poorten vrijgeven
    fuser -k 5173/tcp 2>/dev/null
    fuser -k 3000/tcp 2>/dev/null
    
    echo "✅ RAM vrijgemaakt. Venster sluit in 2 seconden."
    sleep 2
}

# Voer cleanup uit als het script wordt onderbroken (CTRL+C) of het venster sluit (EXIT/TERM)
trap cleanup SIGINT SIGTERM EXIT

# --- 3. START PROCEDURE ---
echo "🧹 Oude processen opschonen..."
fuser -k 5173/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null

echo "🚀 Servers starten..."

# Start de browser in de achtergrond, wachtend op de poort
(
    until printf "" 2>/dev/null >/dev/tcp/localhost/5173; do 
        sleep 0.5
    done
    echo "🔗 Verbinding gevonden! Browser openen..."
    garcon-url-handler http://localhost:5173
) &

# Start de applicatie (Dit houdt het script levend)
pnpm dev:all --raw

# Het script komt hier pas als pnpm stopt.
# De 'trap' functie hierboven handelt de rest af.
