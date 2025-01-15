import { NextResponse } from 'next/server';

const ELEVEN_API_KEY = process.env.NEXT_PUBLIC_ELEVEN_API_KEY;

export async function GET() {
  try {
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversations',
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVEN_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    // console.log('ElevenLabs API Response:', data); // Debug log
    
    // Ensure we return a consistent structure
    return NextResponse.json({
      conversations: data.conversations || []
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ conversations: [] }, { status: 500 });
  }
} 