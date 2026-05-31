# TideLedger - Blue Carbon MRV Platform

TideLedger is a Blue Carbon MRV platform with an Express backend, a Vite + React frontend, and Supabase for authentication and data storage.

## Tech Stack

- Backend: Node.js, Express
- Frontend: React, Vite
- Database and auth: Supabase
- API client: Axios
- Maps: Leaflet, React Leaflet

## Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project

## Project Setup

1. Install dependencies from the repository root:

   npm install
   npm run install:all

2. Configure the backend environment:

   Copy [backend/.env.example](backend/.env.example) to [backend/.env](backend/.env) and set:
   - PORT=5000
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

3. Configure the frontend environment:

   Copy [frontend/.env.example](frontend/.env.example) to [frontend/.env](frontend/.env) and set:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_API_URL

4. Apply the database schema:

   Import [database/schema.sql](database/schema.sql) into the Supabase SQL editor.

## Running the Project

Start both backend and frontend from the repository root:

npm run dev

This starts:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

Health check:
- http://localhost:5000/health

## Available Scripts

Root:
- npm run install:all
- npm run dev:backend
- npm run dev:frontend
- npm run dev

Backend:
- npm run dev
- npm start

Frontend:
- npm run dev
- npm run build
- npm run preview

## Important Notes

- The frontend talks to the backend API through [frontend/src/services/api.js](frontend/src/services/api.js), which defaults to http://localhost:5000/api.
- The backend verifies Supabase JWTs and exposes project, verification, and dashboard routes.
- The app expects Supabase Auth and the tables defined in [database/schema.sql](database/schema.sql).
- The frontend uses Vite env variables, so values must be prefixed with VITE_.
- The backend defaults to port 5000 unless PORT is overridden.

## Main Routes

- /login
- /register
- /dashboard
- /projects/my
- /projects/create
- /admin/dashboard
