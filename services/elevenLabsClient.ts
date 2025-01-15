import dotenv from 'dotenv';
dotenv.config();

const ELEVEN_API_KEY = process.env.NEXT_PUBLIC_ELEVEN_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

if (!ELEVEN_API_KEY || !ELEVENLABS_AGENT_ID) {
  throw new Error('Missing ElevenLabs environment variables');
}

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
          'xi-api-key': ELEVEN_API_KEY as string,
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
          'xi-api-key': ELEVEN_API_KEY as string,
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
          'xi-api-key': ELEVEN_API_KEY as string,
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