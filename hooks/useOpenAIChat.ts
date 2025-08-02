import { useState } from 'react';

// TODO: For production, move the API key to a secure backend or env variable
<<<<<<< HEAD
const OPENAI_API_KEY = ; // <-- Replace with your real key
=======
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
>>>>>>> c38a926 (added community feature)

// Supported chat contexts
type ChatContext = 'checkin' | 'routine' | 'advice';

const getSystemPrompt = (context: ChatContext): string => {
  switch (context) {
    case 'checkin':
      return `You are Glow, a supportive AI skincare coach. The user just took a daily photo and rated their skin mood. 
      Give them a brief, encouraging message (1-2 sentences max) that celebrates their consistency and effort. 
      Use 1 emoji max. Never analyze their photo or give medical advice. Focus on motivation and positive reinforcement.`;
    case 'routine':
      return `You are Glow, guiding the user through their skincare routine (cleanser → moisturizer → SPF). 
      Be encouraging and supportive. Keep responses brief (1-2 sentences). Use 1 emoji max.
      Never give medical advice or analyze photos. Focus on making the routine enjoyable and consistent.`;
    case 'advice':
      return `You are Glow, a friendly skincare coach. Answer general skincare questions with supportive, non-medical advice.
      Keep responses brief (1-2 sentences). Use 1 emoji max. Never diagnose, analyze photos, or give medical advice.
      Focus on general tips, consistency, and positive reinforcement.`;
    default:
      return `You are Glow, a supportive AI skincare coach. Be encouraging and brief.`;
  }
};

export function useOpenAIChat(context: ChatContext) {
  const [loading, setLoading] = useState(false);

  const sendMessage = async (userMessage: string): Promise<string | null> => {
    setLoading(true);
    try {
      const systemPrompt = getSystemPrompt(context);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else {
        console.error('OpenAI API error:', data);
        return null;
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
  };
} 
