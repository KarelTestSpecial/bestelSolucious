#!/bin/bash

# --- 1. HARDE PADEN (Dit lost de lege terminal op) ---
export PATH="/home/kareltestspecial/.config/nvm/versions/node/v22.20.0/bin:/home/kareltestspecial/.local/share/pnpm:$PATH"
export DISPLAY=:0
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u)/bus"

PROJECT_DIR="/home/kareltestspecial/a/bestelSolucious/bestel"
cd "$PROJECT_DIR" || exit 1

# --- 2. SCHOONMAAK (RAM vrijmaken) ---
echo "Bezig met opschonen van oude processen..."
fuser -k 5173/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 1

# --- 3. BROWSER START IN DE ACHTERGROND ---
(
    echo "Wachten tot de server start..."
    # We wachten tot poort 5173 echt open staat via /dev/tcp
    until printf "" 2>/dev/null >/dev/tcp/localhost/5173; do 
        sleep 1
    done
    echo "Server gevonden! Browser wordt nu geopend..."
    garcon-url-handler http://localhost:5173
) &

# --- 4. SERVERS STARTEN (ZICHTBAAR) ---
echo "Servers worden nu gestart via PNPM..."
echo "Als je dit ziet, werkt het script!"
echo "------------------------------------------------"

# We gebruiken het VOLLEDIGE PAD naar pnpm
/home/kareltestspecial/.local/share/pnpm/pnpm dev:all --raw

# Voorkom dat het venster sluit bij een fout
echo "------------------------------------------------"
echo "Servers zijn gestopt of konden niet starten."
read -p "Druk op Enter om dit venster te sluiten..."