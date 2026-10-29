# STUDYMATE OF MOUNGIRI

Frontend for Moungiri Coaching Classes (11th / 12th — JEE, NEET, MHT-CET, CUET).

The React app lives in `frontend/` and talks to an existing Flask API at `http://localhost:5000` through the Vite `/api` proxy.

## Run on Windows (VS Code)

1. Start the Flask backend on `http://localhost:5000`.
2. Open this folder in VS Code / Cursor.
3. In a terminal:

```bat
cd frontend
npm install
npm run dev
```

4. Open the URL Vite prints (usually `http://localhost:5173`).
5. Sign in on `/` with a username, password, and role issued by your administrator. There is no self-registration.

Theme (light/dark) is the only value stored in `localStorage`. Auth uses HttpOnly cookies from the server.
