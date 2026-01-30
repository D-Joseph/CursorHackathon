import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Agent, createAgent, hasApiKey, validateConfig, config } from '../agent';

const router = Router();

// Store active agents by session ID
const agents = new Map<string, Agent>();

/**
 * Schema for chat request
 */
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  systemMessage: z.string().optional(),
  sessionId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

/**
 * Schema for stream request
 */
const StreamRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  systemMessage: z.string().optional(),
  sessionId: z.string().optional(),
});

/**
 * GET /api/agent/health - Check agent configuration
 */
router.get('/health', (_req: Request, res: Response) => {
  const configValidation = validateConfig();
  const apiKeyConfigured = hasApiKey();

  res.json({
    success: true,
    data: {
      configured: apiKeyConfigured,
      configValid: configValidation.valid,
      configErrors: configValidation.errors,
      model: config.model,
      baseUrl: config.baseUrl,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    },
  });
});

/**
 * POST /api/agent/chat - Send a message to the agent
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const body = ChatRequestSchema.parse(req.body);

    // Get or create agent for session
    const sessionId = body.sessionId || 'default';
    let agent = agents.get(sessionId);

    if (!agent) {
      agent = createAgent({
        systemMessage: body.systemMessage,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      });
      agents.set(sessionId, agent);
    }

    const response = await agent.send(body.message);

    res.json({
      success: true,
      data: {
        response,
        sessionId,
      },
    });
  } catch (error) {
    console.error('Agent chat error:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/agent/stream - Send a message and stream the response
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const body = StreamRequestSchema.parse(req.body);

    // Get or create agent for session
    const sessionId = body.sessionId || 'default';
    let agent = agents.get(sessionId);

    if (!agent) {
      agent = createAgent({
        systemMessage: body.systemMessage,
      });
      agents.set(sessionId, agent);
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    let fullResponse = '';

    await agent.sendStreamWithCallbacks(
      body.message,
      (chunk) => {
        const delta = chunk.choices[0]?.delta?.content;
        if (typeof delta === 'string' && delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
        }
      },
      (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      }
    );

    // Send final message
    res.write(`data: ${JSON.stringify({ type: 'done', response: fullResponse })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Agent stream error:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/agent/session/:sessionId - Clear a session
 */
router.delete('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (agents.has(sessionId)) {
    agents.get(sessionId)?.clearHistory();
    agents.delete(sessionId);
    res.json({
      success: true,
      message: `Session ${sessionId} cleared`,
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Session not found',
    });
  }
});

/**
 * GET /api/agent/sessions - List all active sessions
 */
router.get('/sessions', (_req: Request, res: Response) => {
  const sessions = Array.from(agents.entries()).map(([id, agent]) => ({
    id,
    historyLength: agent.getHistoryLength(),
    toolsCount: agent.getTools().length,
  }));

  res.json({
    success: true,
    data: sessions,
  });
});

export default router;
