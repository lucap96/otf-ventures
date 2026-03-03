# OTF Ventures

## Project Info

This repository contains the OTF Ventures web application.

## Getting Started

Prerequisites:

- Node.js
- npm

Run locally:

```sh
npm install
npm run dev
```

Create a local env file:

```sh
cp .env.example .env
```

Use a Supabase publishable/anon key for `VITE_SUPABASE_KEY` (do not use a service-role key in frontend env vars).

## Available Scripts

- `npm run dev` - start local dev server
- `npm run build` - build for production
- `npm run preview` - preview production build
- `npm run lint` - run lint checks
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode

## Tech Stack

- Vite
- TypeScript
- React
- Tailwind CSS
- shadcn-ui

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Set environment variables in Vercel Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY` (publishable/anon key)
4. Deploy.

This project includes `vercel.json` with:
- Vite build output directory (`dist`)
- SPA fallback routing to `index.html` for React Router paths
