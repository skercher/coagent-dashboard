'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Play } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Message {
  role: string;
  message: string;
  time_in_call_secs: number;
  tool_calls: any | null;
  tool_results: any | null;
  feedback: any | null;
  conversation_turn_metrics: any | null;
}

interface ConversationDetails {
  agent_id: string;
  agent: string;
  conversation_id: string;
  status: string;
  transcript: Message[];
  metadata: {
    start_time_unix_secs: number;
    call_duration_secs: number;
    cost: number;
    feedback: {
      overall_score: number | null;
      likes: number;
      dislikes: number;
    };
  };
  analysis: {
    call_successful: string;
    transcript_summary: string;
  };
}

interface Conversation {
  id: string;
  date: string;
  agent: string;
  messages: number;
  duration: string;
  status: string;
  success: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // ... rest of your component code
} 