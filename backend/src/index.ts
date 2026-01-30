import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import searchRoutes from './routes/searchRoutes';
import friendRoutes from './routes/friendRoutes';
import giftRoutes from './routes/giftRoutes';
import userRoutes from './routes/userRoutes';
import { ApiResponse } from './types';
import { initializeDatabase, seedDatabase } from './database/schema';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();
seedDatabase();

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
app.use('/api/friends', friendRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/users', userRoutes);

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
      friends: {
        list: 'GET /api/friends?userId={id}',
        get: 'GET /api/friends/{id}',
        create: 'POST /api/friends',
        update: 'PUT /api/friends/{id}',
        delete: 'DELETE /api/friends/{id}',
        addPreference: 'POST /api/friends/{id}/preferences',
        addNote: 'POST /api/friends/{id}/notes',
        addDate: 'POST /api/friends/{id}/dates',
        deleteNote: 'DELETE /api/friends/{friendId}/notes/{noteId}',
        deleteDate: 'DELETE /api/friends/{friendId}/dates/{dateId}',
      },
      gifts: {
        list: 'GET /api/gifts?userId={id}',
        listByFriend: 'GET /api/gifts/friend/{friendId}',
        get: 'GET /api/gifts/{id}',
        create: 'POST /api/gifts',
        update: 'PUT /api/gifts/{id}',
        delete: 'DELETE /api/gifts/{id}',
        saveFromSearch: 'POST /api/gifts/from-search',
        createSearchResult: 'POST /api/gifts/search-results',
        getSearchResults: 'GET /api/gifts/search-results/{searchId}',
        addFeedback: 'POST /api/gifts/search-results/{id}/feedback',
      },
      users: {
        list: 'GET /api/users',
        get: 'GET /api/users/{id}',
        getByEmail: 'GET /api/users/email/{email}',
        create: 'POST /api/users',
        update: 'PUT /api/users/{id}',
        delete: 'DELETE /api/users/{id}',
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
