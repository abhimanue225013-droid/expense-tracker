# Personal Expense Tracker

A MERN expense tracker with a React/Vite dashboard, Express REST API, and MongoDB Atlas storage.

## Requirements

- Node.js 20.19+ or 22.12+
- A MongoDB Atlas connection string (or a local MongoDB server)

## Setup

1. In `backend`, install dependencies and create your environment file:

   ```powershell
   cd backend
   npm install
   Copy-Item .env.example .env
   ```

2. Open `backend/.env` and replace `MONGO_URI` with your MongoDB connection string. Keep this file private; it is excluded from Git.

3. In a terminal, start the API:

   ```powershell
   cd backend
   npm run dev
   ```

   The API waits for MongoDB to connect before listening on port 5000.

4. In a second terminal, start the dashboard:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite, usually `http://localhost:5173`.

The Vite development server forwards `/api` requests to the backend. For a separately hosted API, set `VITE_API_URL` to its expense endpoint before building the frontend.

## API

- `GET /api/expenses` returns expenses ordered by date, newest first.
- `POST /api/expenses` creates an expense.
- `PUT /api/expenses/:id` updates an expense.
- `DELETE /api/expenses/:id` deletes an expense.
