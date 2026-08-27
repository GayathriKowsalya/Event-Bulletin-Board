
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const aiService = {
  async generateCompletion(messages: ChatMessage[], temperature: number = 0.7, max_tokens: number = 1000): Promise<string> {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    const baseUrl = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const model = process.env.NVIDIA_NIM_MODEL || 'meta/llama3-70b-instruct';

    if (!apiKey) {
      console.warn('NVIDIA_NIM_API_KEY is not set. Returning graceful error.');
      throw new Error('AI capabilities are currently unavailable.');
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          top_p: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('NVIDIA NIM API Error:', response.status, errorText);
        throw new Error(`AI API Error: ${response.status}`);
      }

      const data: any = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating AI completion:', error);
      throw error;
    }
  }
};
