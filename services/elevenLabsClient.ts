import dotenv from 'dotenv';
dotenv.config();

const isServer = typeof window === 'undefined';

// Use the original environment variable names
const ELEVEN_API_KEY = process.env.NEXT_PUBLIC_ELEVEN_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

if (!ELEVEN_API_KEY || !ELEVENLABS_AGENT_ID) {
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Missing ElevenLabs environment variables');
  }
  if (isServer) {
    // Return dummy values during SSG
    // @ts-ignore - This is intentional for SSG
    global.elevenLabs = {
      apiKey: '',
      agentId: '',
    };
  }
} else {
  if (isServer) {
    // @ts-ignore - This is intentional for SSG
    global.elevenLabs = {
      apiKey: ELEVEN_API_KEY,
      agentId: ELEVENLABS_AGENT_ID,
    };
  }
}

// Export the values, preferring runtime environment variables on the client
export const elevenLabs = isServer
  ? // @ts-ignore - This is intentional for SSG
    global.elevenLabs
  : {
      apiKey: ELEVEN_API_KEY,
      agentId: ELEVENLABS_AGENT_ID,
    };

interface PaginationParams {
  cursor?: string;
  page_size?: number;
}

export async function getConversations(page = 1, limit = 10, cursor?: string) {
  try {
    const params: PaginationParams = {
      page_size: limit
    };
    
    if (cursor) {
      params.cursor = cursor;
    }

    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?${queryString}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabs.apiKey as string,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

export async function getConversationById(conversationId: string) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabs.apiKey as string,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

export async function getAvailableAgents() {
  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/agents',
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabs.apiKey as string,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
}

export async function getConversationAudio(conversationId: string) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabs.apiKey as string,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch conversation audio');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching conversation audio:', error);
    throw error;
  }
} 