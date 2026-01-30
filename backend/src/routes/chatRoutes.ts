import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createAgent, Agent } from '../agent';

const router = Router();

// Store active chat agents by personId for conversation continuity
const chatAgents = new Map<string, Agent>();

/**
 * Schema for chat request
 */
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  personName: z.string().min(1, 'Person name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  currentInterests: z.array(z.string()).default([]),
  currentDislikes: z.array(z.string()).default([]),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).default([]),
  personId: z.string().optional(),
});

/**
 * Build the system prompt for the gift-giving assistant
 */
function buildSystemPrompt(personName: string, relationship: string, currentInterests: string[], currentDislikes: string[]): string {
  return `You are a helpful gift-giving assistant. You're having a conversation to learn about ${personName}, who is the user's ${relationship}.

Your goal is to:
1. Learn about their interests, hobbies, and preferences
2. Understand what they DON'T like or already have
3. Extract useful information for gift suggestions

Current known interests: ${currentInterests.length > 0 ? currentInterests.join(", ") : "None yet"}
Current known dislikes: ${currentDislikes.length > 0 ? currentDislikes.join(", ") : "None yet"}

After each response, analyze the conversation and extract:
- Any new interests or hobbies mentioned
- Any dislikes or things to avoid

Be friendly, conversational, and ask follow-up questions to learn more. Keep responses concise (2-3 sentences max).

IMPORTANT: At the end of your response, add a JSON block in this exact format:
<extracted>{"interests": ["list", "of", "interests"], "dislikes": ["list", "of", "dislikes"]}</extracted>

Only include NEW items not already in the current lists. If no new items, use empty arrays.`;
}

/**
 * Parse extracted interests and dislikes from the agent response
 */
function parseExtractedData(response: string): { cleanResponse: string; interests: string[]; dislikes: string[] } {
  let interests: string[] = [];
  let dislikes: string[] = [];
  let cleanResponse = response;

  const extractedMatch = response.match(/<extracted>(.*?)<\/extracted>/s);
  if (extractedMatch) {
    try {
      const extracted = JSON.parse(extractedMatch[1]);
      interests = extracted.interests || [];
      dislikes = extracted.dislikes || [];
      cleanResponse = response.replace(/<extracted>.*?<\/extracted>/s, "").trim();
    } catch {
      // Parsing failed, continue with empty arrays
    }
  }

  return { cleanResponse, interests, dislikes };
}

/**
 * POST /api/chat - Chat with the gift-giving assistant about a person
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = ChatRequestSchema.parse(req.body);
    const { message, personName, relationship, currentInterests, currentDislikes, chatHistory, personId } = body;

    // Build system prompt with current context
    const systemPrompt = buildSystemPrompt(personName, relationship, currentInterests, currentDislikes);

    // Get or create agent for this person (using personId or personName as key)
    const agentKey = personId || personName;
    let agent = chatAgents.get(agentKey);

    if (!agent) {
      agent = createAgent({
        systemMessage: systemPrompt,
        temperature: 0.7,
        maxTokens: 500,
      });
      chatAgents.set(agentKey, agent);
    } else {
      // Update system message with latest interests/dislikes
      agent.updateOptions({ systemMessage: systemPrompt });
    }

    // If we have chat history but agent doesn't, we need to rebuild context
    // For now, we'll rely on the frontend sending recent history in each request
    // The agent maintains its own history across requests

    const response = await agent.send(message);

    // Parse the response to extract interests and dislikes
    const { cleanResponse, interests, dislikes } = parseExtractedData(response);

    res.json({
      response: cleanResponse,
      interests,
      dislikes,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * DELETE /api/chat/:personId - Clear chat history for a person
 */
router.delete('/:personId', (req: Request, res: Response) => {
  const { personId } = req.params;

  if (chatAgents.has(personId)) {
    chatAgents.get(personId)?.clearHistory();
    chatAgents.delete(personId);
    res.json({
      success: true,
      message: `Chat history for ${personId} cleared`,
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Chat session not found',
    });
  }
});

export default router;
