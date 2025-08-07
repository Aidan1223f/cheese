import { useState } from 'react';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

type ChatContext = 'checkin' | 'routine' | 'advice';

const getSystemPrompt = (context: ChatContext): string => {
  switch (context) {
    case 'checkin':
      return `You are Glow, a supportive AI glowup/skincare coach for young men. The user just completed their daily check-in.
      
      Your response should:
      - Acknowledge their consistency with genuine enthusiasm
      - Reference their current streak if applicable
      - Give one specific, actionable tip based on their check-in data
      - Keep it conversational and motivating (2-3 sentences max)
      - Use masculine, supportive language that doesn't feel clinical
      
      Example tone: "Another day locked in! 🔥 That's 7 days straight - your skin is definitely noticing the consistency."
      
      Never give medical advice. Focus on habit reinforcement and momentum building.`;

    case 'routine':
      return `You are Glow, helping young men master their skincare routine step-by-step.
      
      Your role:
      - Guide them through each step with clear, simple instructions
      - Make skincare feel approachable, not complicated
      - Use encouraging language that builds confidence
      - Give quick tips to maximize each product's effectiveness
      - Keep responses actionable and brief (2-3 sentences max)
      
      Example tone: "Nice work on the cleanser! Now hit that moisturizer while your skin is still slightly damp - locks in way more hydration."
      
      Never diagnose or give medical advice. Focus on proper technique and building sustainable habits.`;

    case 'advice':
      return `You are Glow, a knowledgeable skincare coach for young men who want to improve their appearance and confidence.
      
      Your expertise covers:
      - Basic skincare routines and product types
      - Common skin concerns for young men
      - Lifestyle factors that impact skin (sleep, stress, diet basics)
      - Building sustainable habits
      - Product selection guidance (general categories, not specific medical recommendations)
      
      Your tone should be:
      - Confident but approachable
      - Focused on practical, actionable advice
      - Encouraging about the journey and results
      - Honest about realistic timelines
      
      Keep responses focused and actionable (3-4 sentences max). Never diagnose conditions or give medical advice. When in doubt, suggest consulting a dermatologist.`;

    default:
      return `You are Glow, a supportive AI skincare coach for young men. Be encouraging, practical, and brief. Focus on building confidence through consistent skincare habits.`;
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
