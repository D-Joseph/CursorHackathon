# Orbit - Your Relationship Co-Pilot

Never forget to reach out. Orbit helps you stay connected with the people you care about by tracking birthdays, finding gift ideas, drafting personalized messages, and sending reminders before it's too late.

## Features

- **Guilt Relief** - "I'm bad at keeping in touch" is universal
- **Low Effort, High Reward** - 2 min setup, months of value
- **Gets Better Over Time** - Memory makes it smarter
- **Tangible Output** - Not just advice, actual gift links + draft messages

## Team

- **Daniel** - Database and API interfaces
- **Taylor** - AI integration
- **Brandon** - Web search tool
- **Karthik** - UI development

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Running the Backend

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3000`

### Verifying It's Working

1. **Check health endpoint**
   ```bash
   curl http://localhost:3000/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "message": "Orbit API is running",
     "timestamp": "2024-01-15T10:30:00.000Z"
   }
   ```

2. **Test gift search endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/search/gifts \
     -H "Content-Type: application/json" \
     -d '{"query": "tech gadgets", "context": {"personInterests": ["gaming", "music"]}}'
   ```

3. **View API documentation**
   Open `http://localhost:3000/api` in your browser

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | API documentation |
| POST | `/api/search/gifts` | Gift search with context |
| POST | `/api/search/web` | General web search |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 3000) | No |
| GOOGLE_API_KEY | Google Custom Search API key | No* |
| GOOGLE_SEARCH_ENGINE_ID | Google Custom Search Engine ID | No* |
| NODE_ENV | Environment (development/production) | No |

*Required for production-quality search. Without these, the API uses mock data.

## Project Structure

```
CursorHackathon/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express server entry point
│   │   ├── routes/
│   │   │   └── searchRoutes.ts # API route handlers
│   │   └── services/
│   │       └── searchService.ts # Web search service
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
└── README.md
```
