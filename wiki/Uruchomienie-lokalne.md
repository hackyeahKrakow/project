# Uruchomienie lokalne

## Backend (Python 3.11+, uv)
Z katalogu głównego repo:
```bash
cp apps/backend/.env.example apps/backend/.env
uv run fastapi dev apps/backend/app/main.py
```
API: http://localhost:8000, Swagger: http://localhost:8000/docs.

## Seed danych
Po zadaniu B3: uruchom `seed.py` (można wielokrotnie, bez duplikatów). Dane z `data/events.json` i `data/categories.json`.

## Frontend (Vite + React + TypeScript)
```bash
cd apps/frontend
cp .env.example .env
npm install
npm run dev
```
Aplikacja: http://localhost:5173. Puste `VITE_API_URL` = frontend używa `src/mock/events.json`.

## Typowe problemy
- CORS: backend dopuszcza tylko `http://localhost:5173`.
- Nominatim: maks. 1 zapytanie na sekundę, ustaw `NOMINATIM_USER_AGENT` w `.env`.
- Baza psuje się po zmianie modeli: usuń `app.db` i uruchom seed ponownie.
