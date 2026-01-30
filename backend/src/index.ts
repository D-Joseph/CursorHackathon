import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import searchRoutes from './routes/searchRoutes';
import { ApiResponse } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Orbit API is running',
    timestamp: new Date().toISOString(),
  } as ApiResponse<{ status: string; timestamp: string }>);
});

// API Routes
app.use('/api/search', searchRoutes);

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Orbit API - Relationship Co-pilot Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      searchGifts: 'POST /api/search/gifts',
      webSearch: 'POST /api/search/web',
    },
    documentation: {
      searchGifts: {
        description: 'Search for gift ideas with context awareness',
        body: {
          query: 'string (required) - The gift search query',
          context: {
            personInterests: 'string[] - Interests of the person',
            pastGifts: 'string[] - Gifts given previously',
            occasion: 'string - The occasion (birthday, anniversary, etc.)',
            budget: 'number - Maximum budget for gifts',
          },
          filters: {
            category: 'string - Gift category',
            maxPrice: 'number - Maximum price',
            minRating: 'number - Minimum rating',
          },
          limit: 'number - Maximum number of results (default: 10)',
        },
      },
      webSearch: {
        description: 'Perform a general web search',
        body: {
          query: 'string (required) - The search query',
          limit: 'number - Maximum number of results (default: 10)',
        },
      },
    },
  } as ApiResponse<any>);
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  } as ApiResponse<null>);
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  } as ApiResponse<null>);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Orbit Backend Server Started Successfully!               ║
║                                                               ║
║   Local:    http://localhost:${PORT}                            ║
║   API Docs: http://localhost:${PORT}/api                        ║
║   Health:   http://localhost:${PORT}/health                     ║
║                                                               ║
║   Endpoints:                                                  ║
║   • POST /api/search/gifts - Gift search with context         ║
║   • POST /api/search/web  - General web search                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
