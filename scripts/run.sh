#!/bin/bash
# Start script voor Bestel-Tracker

# Functie om processen te stoppen bij afsluiten
cleanup() {
    # Schakel de trap uit om recursie te voorkomen
    trap - SIGINT SIGTERM
    echo -e "\n\033[1;33mBezig met afsluiten van processen...\033[0m"
    # Stop de hele procesgroep
    kill 0 2>/dev/null
    exit 0
}

# Luister naar Ctrl+C
trap cleanup SIGINT SIGTERM

echo -e "\033[1;32mBestel-Tracker wordt opgestart...\033[0m"

# Start de backend
node server/index.js &
SERVER_PID=$!

# Start de frontend (Vite)
pnpm vite --no-open &
VITE_PID=$!

echo -e "\033[1;34mFrontend: http://localhost:5173\033[0m"
echo -e "\033[1;34mBackend:  http://localhost:3000\033[0m"
echo -e "\033[1;32mDruk op Ctrl+C om te stoppen.\033[0m"

# Wacht op de processen
wait
