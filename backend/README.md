# Orbit Backend

Backend for Orbit - your relationship This co-pilot. API provides web search capabilities for finding gift ideas and personalized outreach suggestions.

## Features

- 🎁 **Gift Search**: Context-aware gift idea search
- 🔍 **Web Search**: General web search capabilities
- 📝 **Type Safety**: Full TypeScript support
- 🛡️ **Error Handling**: Robust error handling and validation

## Getting Started

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

# (Optional) Add your Google API key for production search
# Edit .env and set:
# GOOGLE_API_KEY=your_api_key
# GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Or use the watch script
npm run watch
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### Health Check

```http
GET /health
```

Returns the API status.

#### Gift Search

```http
POST /api/search/gifts
```

Search for gift ideas with context awareness.

**Request Body:**

```json
{
  "query": "tech gadgets",
  "context": {
    "personInterests": ["technology", "gaming", "music"],
    "pastGifts": ["headphones", "smartwatch"],
    "occasion": "birthday",
    "budget": 100
  },
  "filters": {
    "category": "Tech & Gadgets",
    "maxPrice": 100
  },
  "limit": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "query": "tech gadgets for someone interested in technology, gaming, music",
    "totalResults": 5,
    "results": [
      {
        "id": "gift-1234567890-0",
        "personId": "technology,gaming,music",
        "name": "Best Tech Gadgets Gift Ideas - Curated Collection",
        "description": "Discover amazing tech gadgets gift ideas...",
        "url": "https://example.com/gifts",
        "category": "Tech & Gadgets",
        "relevanceScore": 0.95,
        "source": "web-search",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "suggestedRefinements": [
      "Add a budget to filter results",
      "Specify the occasion for better suggestions"
    ]
  }
}
```

#### Web Search

```http
POST /api/search/web
```

Perform a general web search.

**Request Body:**

```json
{
  "query": "unique birthday gift ideas",
  "limit": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "query": "unique birthday gift ideas",
    "totalResults": 5,
    "results": [
      {
        "title": "Best Birthday Gift Ideas",
        "url": "https://example.com/birthday-gifts",
        "snippet": "Amazing birthday gift ideas...",
        "relevanceScore": 0.95
      }
    ]
  }
}
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts           # Express server entry point
│   ├── routes/
│   │   └── searchRoutes.ts # API route handlers
│   ├── services/
│   │   └── searchService.ts # Web search service
│   └── types/
│       └── index.ts        # TypeScript type definitions
├── package.json
└── tsconfig.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 3000) | No |
| GOOGLE_API_KEY | Google Custom Search API key | No* |
| GOOGLE_SEARCH_ENGINE_ID | Google Custom Search Engine ID | No* |
| NODE_ENV | Environment (development/production) | No |

*Required for production-quality search. Without these, the API uses mock data.

## Team

- **Daniel** - Database and API interfaces
- **Taylor** - AI integration
- **Brandon** - Web search tool
- **Karthik** - UI development

## License

MIT
