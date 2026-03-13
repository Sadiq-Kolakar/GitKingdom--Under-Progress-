# Realm of Code
An ancient world built from GitHub data — visualize your code legacy as an interactive fantasy kingdom.

## Overview
Realm of Code transforms public GitHub analytics (commits, repositories, languages) into playable cartographic territories. Users authenticate via GitHub OAuth, claiming raw fog-covered regions which generate procedurally based on their real-world developer stats.

![Placeholder Screenshot](https://via.placeholder.com/1200x600.png?text=Realm+of+Code+Map+Overview)

## Tech Stack
* **Frontend:** React, Vite, Zustand, GSAP (Animations), Canvas 2D API, HTML2Canvas, React Router
* **Backend:** Node.js, Express, MongoDB/Mongoose, JSON Web Tokens (JWT)
* **Integrations:** GitHub REST & GraphQL APIs

## Local Setup Instructions
Make sure you have Node (v18+) and MongoDB installed locally.

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd realm-of-code
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env and supply your Github OAuth Application keys and a MONGODB_URI
   npm start # runs on port 5000
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   npm run dev # runs on port 5173
   ```

## Seeding the Realm
You can pre-populate the 'Heartland' biome with fellow classmates and famous developers.

1. Add target GitHub usernames to the array inside `seed/classmates.js`
2. Ensure MongoDB is running.
3. Run the generator script from the project root:
   ```bash
   node seed/run.js
   ```

## Deployment
This project is configured for cloud deployment across two separated infrastructures.

**Frontend (Vercel):**
Connect the root directory / framework preset Vite to Vercel. Ensure the `vercel.json` rewrite rule remains for React Router. Set `VITE_API_URL` to your live Render backend string.

**Backend (Render):**
Create a new Web Service hooked to the `render.yaml` configuration. Inject the Production GitHub OAuth credentials, a live MongoDB Atlas URI, and your frontend Vercel URL as `CLIENT_URL` preventing CORS violations.

## Credits
Built by **Sadiq Kolakar** | SIT Tumakuru | Batch 2024–2028  
Reviewed by ChatGPT, Gemini, Grok, Claude.
