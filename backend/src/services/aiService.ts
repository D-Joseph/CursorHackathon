import { PromptRequest, ParsedPrompt, LLMGiftSuggestion } from '../types';

/**
 * AI Service for processing natural language prompts
 * Currently returns mock responses for testing
 */
export class AIService {
  /**
   * Parse a natural language prompt into structured data
   */
  async parsePrompt(request: PromptRequest): Promise<ParsedPrompt> {
    console.log('AI Service - Processing prompt:', request.prompt);

    // Return mock structured response
    return {
      intent: 'mixed',
      timelineEvents: [
        {
          type: 'birthday',
          description: 'Birthday from prompt',
          isRecurring: true,
        },
      ],
      giftSuggestions: [
        {
          preferences: ['tech', 'gaming'],
          searchKeywords: ['tech gift ideas', 'gaming accessories'],
        },
      ],
      proactiveSuggestions: [
        {
          type: 'reachout',
          reason: 'Prompt suggests checking in',
          suggestedAction: 'Send a friendly message',
          priority: 'medium',
        },
      ],
      rawText: request.prompt,
    };
  }

  /**
   * Generate gift suggestions based on friend profile
   */
  async generateGiftSuggestions(
    friendId: string,
    context: { interests: string[]; occasion?: string; budget?: number }
  ): Promise<LLMGiftSuggestion[]> {
    console.log('AI Service - Generating gift suggestions for:', friendId);

    // Return mock suggestions
    return [
      {
        giftName: 'Personalized Gift Box',
        giftDescription: 'A curated selection of items based on interests',
        estimatedPrice: context.budget ? `$${context.budget}` : '$30-50',
        whyItsPerfect: 'Tailored to the recipient preferences',
        matchingPreferences: context.interests,
        searchKeywords: context.interests.map(i => `${i} gift ideas`),
      },
    ];
  }

  /**
   * Generate a reachout message
   */
  async generateReachoutSuggestion(friendId: string, lastContact: Date): Promise<string> {
    console.log('AI Service - Generating reachout for:', friendId);

    return `Hey! Just wanted to check in and see how you're doing. Hope everything's well!`;
  }
}

export const aiService = new AIService();
