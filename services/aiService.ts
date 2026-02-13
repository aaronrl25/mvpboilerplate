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

export interface JobFitAdvice {
  fitScore: number;
  missingSkills: string[];
  resumeImprovements: string[];
  interviewTips: string[];
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

  getJobFitAdvice: async (resumeText: string, jobDescription: string): Promise<JobFitAdvice> => {
    if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY') {
      // Return mock data for development if API key is not set
      return {
        fitScore: 85,
        missingSkills: ['React Native Navigation', 'Redux Saga'],
        resumeImprovements: ['Highlight your experience with mobile-first design.', 'Quantify your achievements in previous roles.'],
        interviewTips: ['Be ready to discuss your architectural decisions.', 'Practice explaining complex technical concepts in simple terms.'],
      };
    }

    const systemPrompt = `You are an expert career coach. Analyze the user's resume and a job description. 
    Provide a JSON response with:
    - fitScore: a number from 0-100.
    - missingSkills: an array of strings.
    - resumeImprovements: an array of strings.
    - interviewTips: an array of strings.
    Only return the JSON.`;

    const userPrompt = `Resume: ${resumeText}\n\nJob Description: ${jobDescription}`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo-0125',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error: any) {
      console.error('Error calling OpenAI API for job fit:', error.response?.data || error.message);
      throw new Error('Failed to get career advice');
    }
  },
};
