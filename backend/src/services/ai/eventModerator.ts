import { aiService, ChatMessage } from './aiService';

export const eventModerator = {
  async moderateEvent(prompt: string, extractedData: any): Promise<{ is_spam: boolean, risk_score: number, reasons: string[] }> {
    const systemPrompt = `You are an AI moderator for a local event bulletin board.
Analyze the following event description and details for spam, fake events, or malicious content.
Return ONLY a valid JSON object with the following keys:
- "is_spam": (boolean) true if the event is highly likely to be spam or fake, false otherwise.
- "risk_score": (number) a float between 0.0 (safe) and 1.0 (definitely spam).
- "reasons": (array of strings) a list of reasons if the event is flagged, empty array otherwise.

Spam indicators:
- Suspicious promotional language for irrelevant products.
- Impossible event details (e.g. time travel, fake locations).
- Misleading claims or malicious URLs.
- Obvious test data like "Lorem ipsum" or "Test event".

CRITICAL: Return ONLY raw JSON.`;

    const userContent = `Original Prompt: ${prompt}\n\nExtracted Data: ${JSON.stringify(extractedData)}`;
    
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    try {
      const responseText = await aiService.generateCompletion(messages, 0.1);
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (error) {
      console.error('Failed to moderate event via AI:', error);
      // Fallback: if AI fails, assume safe but low risk so it doesn't block users unnecessarily.
      return { is_spam: false, risk_score: 0.1, reasons: ["AI moderation failed, defaulting to safe."] };
    }
  }
};
