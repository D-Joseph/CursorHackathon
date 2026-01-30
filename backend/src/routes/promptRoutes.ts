import { Router, Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { PromptRequestSchema, ApiResponse } from '../types';

const router = Router();

/**
 * POST /api/prompt/process
 * Process a natural language prompt
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const result = PromptRequestSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: result.error.errors,
      });
    }

    const parsed = await aiService.parsePrompt(result.data);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process prompt',
    });
  }
});

/**
 * POST /api/prompt/gift-suggestions
 * Generate gift suggestions
 */
router.post('/gift-suggestions', async (req: Request, res: Response) => {
  try {
    const { friendId, interests, occasion, budget } = req.body;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        error: 'friendId is required',
      });
    }

    const suggestions = await aiService.generateGiftSuggestions(friendId, {
      interests: interests || [],
      occasion,
      budget,
    });

    res.json({
      success: true,
      data: { friendId, suggestions },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
    });
  }
});

/**
 * POST /api/prompt/reachout
 * Generate a reachout message
 */
router.post('/reachout', async (req: Request, res: Response) => {
  try {
    const { friendId, lastContact } = req.body;

    if (!friendId || !lastContact) {
      return res.status(400).json({
        success: false,
        error: 'friendId and lastContact are required',
      });
    }

    const message = await aiService.generateReachoutSuggestion(
      friendId,
      new Date(lastContact)
    );

    res.json({
      success: true,
      data: { friendId, message },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate reachout',
    });
  }
});

export default router;
