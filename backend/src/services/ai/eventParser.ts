import { aiService, ChatMessage } from './aiService';

export const eventParser = {
  async parseEvent(prompt: string): Promise<any> {
    const systemPrompt = `You are an AI assistant that extracts event details from natural language text.
Extract the following details and return ONLY a valid JSON object with the exact following keys. 
If a value is not mentioned or cannot be deduced, use null for that field.

Keys to include in JSON:
- "title": (string) A catchy title for the event. If missing, try to generate one based on the description.
- "description": (string) A concise description of the event. Elaborate slightly if the prompt is very short.
- "category": (string) Choose one of: "Technology", "Business", "Music", "Food", "Sports", "Community", "Education", "Arts", "Yard Sale", "Other". Default to "Other" if unclear.
- "event_date": (string) The date in YYYY-MM-DD format. If ambiguous (e.g. "tomorrow"), use your best guess or null.
- "start_time": (string) The start time (e.g., "10:00 AM" or "18:00"). Use null if missing.
- "end_time": (string) The end time (e.g., "01:00 PM"). Use null if missing.
- "location": (string) The full venue or location name (e.g. "PSG College of Technology, Coimbatore").
- "capacity": (number) Estimated capacity or max attendees. Default to null if not mentioned.

CRITICAL: Return ONLY raw JSON, with no markdown formatting (no \`\`\`json) and no other text.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    try {
      const responseText = await aiService.generateCompletion(messages, 0.3);
      // Strip potential markdown wrappers just in case
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (error) {
      console.error('Failed to parse event via AI:', error);
      throw error;
    }
  }
};
