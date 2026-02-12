import axios from 'axios';

// Replace with your actual OpenAI API Key
// In a production app, you should fetch this from your backend or use a secure environment variable
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export const aiService = {
  sendMessage: async (messages: { role: string; content: string }[]): Promise<string> => {
    if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
      return "Hello! I'm your Career Assistant. I can help you with job search tips, resume advice, and interview preparation. (Note: OpenAI API Key not configured)";
    }

    const systemMessage = {
      role: 'system',
      content: 'You are a professional career coach and job search assistant. Your goal is to provide helpful, encouraging, and practical advice on job searching, resume building, interview preparation, and career growth. Keep your answers concise and professional.'
    };

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [systemMessage, ...messages],
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to get response from AI');
    }
  },
};
