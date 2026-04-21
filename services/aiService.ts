export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

// This is a placeholder. In a real app, this would call a real AI service.
export const aiService = {
  getCompletion: async (messages: ChatMessage[]): Promise<ChatMessage> => {
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

    let responseContent = "I'm sorry, I can only talk about movies. Ask me for a recommendation!";

    if (lastUserMessage.includes('recommend')) {
        responseContent = "I recommend checking out 'The Matrix'!";
    } else if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
        responseContent = "Hello there! How can I help you with movie recommendations today?";
    }

    return {
      id: Math.random().toString(),
      role: 'assistant',
      content: responseContent,
      createdAt: new Date(),
    };
  },
};