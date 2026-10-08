# CareerX

## Overview
CareerX is an AI-powered Career Path Simulator that analyzes a student's current profile (year of study, skills, and interests) and reveals three realistic, personalized career trajectories mapping how they evolve from student to professional.

## Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS v4, Framer Motion (via standard CSS/SVGs for performance)
- **Backend**: Next.js Route Handlers, Anthropic Claude 3.5 Sonnet, Zod for schema validation
- **Design Language**: Stitch Editorial Light Theme (Inter font, premium layout, horizontal dash grids)

## Project Structure
- `app/`: Next.js App Router (frontend pages and API routes)
- `components/`: UI and page components (when split out)
- `lib/`: Business logic, AI integration, schema validation, and fallback mechanisms
- `scripts/`: Development and testing scripts (e.g. persona testing)
- `Source Documentation/`: Project specifications and Stitch design system references

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   Add your `ANTHROPIC_API_KEY` to `.env.local` to enable live AI generations, or keep `USE_MOCK=true` to test quickly.

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Build

To create an optimized production build:
```bash
npm run build
```

## Lint

To verify code quality and types:
```bash
npm run lint
```

## Main Routes
- `/`: The main application entry (Landing -> Profile Form -> Loading -> Results -> Detail Grid)
- `/api/simulate`: Core backend API to process user profiles and generate three career paths

## Architecture
The frontend captures user inputs (Year of Study, Skills, Interests) and sends them to the `/api/simulate` endpoint.
The backend integrates with Anthropic Claude to intelligently predict career fits. Zod guarantees the structured JSON matches the exact `CareerPath` contract. If the AI call fails or times out, the backend gracefully delegates to a robust local fallback mock so the user experience is never broken.
