import { NextResponse } from 'next/server';

const ELEVEN_API_KEY = process.env.NEXT_PUBLIC_ELEVEN_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${params.id}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVEN_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    console.log('Conversation details:', data);
    
    return NextResponse.json({
      ...data,
      agent: data.conversation_initiation_client_data?.conversation_config_override?.agent?.name || 'AI Agent'
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation details' }, { status: 500 });
  }
} 