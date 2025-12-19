#!/bin/bash

# Handmatig de paden toevoegen voor Node en PNPM
export PATH="$HOME/.config/nvm/versions/node/v22.20.0/bin:$HOME/.local/share/pnpm:$PATH"

# Projectmap
PROJECT_DIR="/home/kareltestspecial/a/bestelSolucious/bestel"
LOGFILE="$PROJECT_DIR/startup_debug.log"

echo "SCRIPT GESTART OP $(date)" >> "$LOGFILE"
echo "--- Start log $(date) ---" > "$LOGFILE"
cd "$PROJECT_DIR" || exit 1

echo "Bezig met opstarten van de servers..."
echo "Stap 1: Map gecontroleerd" >> "$LOGFILE"

# Achtergrondtaak om de browser te openen
(
  echo "Wachten op servers..." >> "$LOGFILE"
  sleep 6
  echo "Poging om browser te openen op http://localhost:5173..." >> "$LOGFILE"
  
  # Op ChromeOS is garcon-url-handler de meest betrouwbare methode
  if command -v garcon-url-handler >/dev/null 2>&1; then
    echo "Gebruik garcon-url-handler..." >> "$LOGFILE"
    if garcon-url-handler http://localhost:5173 >> "$LOGFILE" 2>&1; then
       echo "Browser succesvol geopend via garcon" >> "$LOGFILE"
       exit 0
    fi
  fi

  # Fallback naar xdg-open
  echo "Gebruik xdg-open fallback..." >> "$LOGFILE"
  export DISPLAY=:0
  xdg-open http://localhost:5173 >> "$LOGFILE" 2>&1
) &

echo "Stap 2: Servers starten..." >> "$LOGFILE"
# Voer pnpm uit en zorg dat de output direct naar het scherm gaat
# We gebruiken --raw om te zorgen dat concurrently de output niet teveel buffert
pnpm run dev:all --raw 2>&1 | tee -a "$LOGFILE"

echo "Servers gestopt." >> "$LOGFILE"
read -p "Druk op Enter om te sluiten..."
