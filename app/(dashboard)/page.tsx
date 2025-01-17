'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getConversations, getConversationById, getAvailableAgents, getConversationAudio } from '../../services/elevenLabsClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

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
  caller_name: string;
  caller_number: string;
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
  caller_number: string;
  caller_name: string;
}

const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber || phoneNumber === 'Unknown') return 'Unknown';
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[2]}) ${match[3]}-${match[4]}`;
  }
  return phoneNumber;
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ConversationDetails | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [uniqueAgents, setUniqueAgents] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Add a container ref for scroll position
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadConversations(page + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations(pageNum = 1) {
    try {
      setIsLoading(true);
      
      if (containerRef.current) {
        prevScrollHeight.current = containerRef.current.scrollHeight;
      }

      const data = await getConversations(pageNum, 15, pageNum === 1 ? undefined : cursor);
      const newConversations = data?.conversations || [];
      
      // Fetch caller details from Supabase
      const conversationIds = newConversations.map((conv: any) => conv.conversation_id);
      const { data: callerDetails } = await supabase
        .from('conversations')
        .select('conversation_id, caller_number, caller_name')
        .in('conversation_id', conversationIds);

      // Create a map of caller details
      const callerMap = (callerDetails || []).reduce((acc: any, curr: any) => {
        acc[curr.conversation_id] = {
          caller_number: curr.caller_number,
          caller_name: curr.caller_name
        };
        return acc;
      }, {});
      
      const formattedConversations = newConversations.map((conv: any) => {
        const callerInfo = callerMap[conv.conversation_id] || {};
        return {
          id: conv.conversation_id || '',
          date: conv.start_time_unix_secs 
            ? new Date(conv.start_time_unix_secs * 1000).toLocaleString() 
            : 'Unknown date',
          agent: conv.agent_name || 'AI Agent',
          messages: conv.message_count || 0,
          duration: conv.call_duration_secs 
            ? `${Math.floor(conv.call_duration_secs / 60)}:${(conv.call_duration_secs % 60).toString().padStart(2, '0')}` 
            : '0:00',
          status: conv.status || 'Unknown',
          success: conv.call_successful || 'unknown',
          caller_number: callerInfo.caller_number || 'Unknown',
          caller_name: callerInfo.caller_name || 'Unknown'
        };
      });

      if (pageNum === 1) {
        setConversations(formattedConversations);
      } else {
        setConversations(prev => [...prev, ...formattedConversations]);
      }

      // Always update cursor after loading
      setCursor(data.next_cursor);
      
      // Only continue if we got a full page and have a next cursor
      setHasMore(newConversations.length === 15 && !!data.next_cursor);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
      setInitialLoading(false);
    }
  }

  // Add effect to maintain scroll position
  useEffect(() => {
    if (containerRef.current && prevScrollHeight.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeight.current;
      if (scrollDiff > 0) {
        containerRef.current.scrollTop += scrollDiff;
      }
    }
  }, [conversations]);

  // Add new effect to fetch agents on mount
  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await getAvailableAgents();
        const agentNames = data.agents.map((agent: any) => agent.name);
        setUniqueAgents(agentNames);
      } catch (err) {
        console.error('Error loading agents:', err);
      }
    }
    loadAgents();
  }, []);

  // Filter conversations based on selected agent
  const filteredConversations = conversations.filter(chat => 
    selectedAgent === "all" || chat.agent === selectedAgent
  );

  const handleChatSelect = async (chatId: string, agentName: string) => {
    try {
      const response = await fetch(`/api/conversations/${chatId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      // Get caller details from Supabase
      const { data: callerDetails } = await supabase
        .from('conversations')
        .select('caller_number, caller_name')
        .eq('conversation_id', chatId)
        .single();
      
      setSelectedChat({
        ...data,
        agent: agentName,
        caller_name: callerDetails?.caller_name || 'Unknown',
        caller_number: callerDetails?.caller_number || 'Unknown'
      });
      setIsSheetOpen(true);
    } catch (err) {
      console.error('Error loading conversation details:', err);
      setError('Failed to load conversation details');
    }
  };

  const handlePlayAudio = async (chatId: string) => {
    try {
      const audioUrl = await getConversationAudio(chatId);
      setAudioUrl(audioUrl);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load conversation audio');
    }
  };

  // Add this to clean up audio URL when sheet closes
  useEffect(() => {
    if (!isSheetOpen && audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [isSheetOpen, audioUrl]);

  if (initialLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full p-2 sm:p-4">
      <Card className="flex-1 border-0 sm:border w-full">
        <CardHeader className="px-2 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Chat Transcripts</CardTitle>
              <CardDescription>View all chat transcripts here.</CardDescription>
            </div>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map(agent => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 px-2 sm:px-6">
          <div 
            ref={containerRef} 
            className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-14rem)] overflow-y-auto w-full"
          >
            <div className="space-y-2 sm:space-y-4 w-full">
              {error && (
                <div className="text-red-500 p-4 text-center">
                  {error}
                </div>
              )}
              
              {filteredConversations.length === 0 && !error ? (
                <div className="text-center py-4 text-muted-foreground">
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((chat, index) => (
                  <div
                    key={`${chat.id}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer gap-2 sm:gap-4 w-full"
                    onClick={() => handleChatSelect(chat.id, chat.agent)}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-sm sm:text-base">{chat.date}</p>
                      <p className="text-sm text-muted-foreground">{chat.agent}</p>
                      <div className="flex items-center gap-2 text-sm">
                        {chat.caller_name !== 'Unknown' && (
                          <>
                            <span className="font-medium">{chat.caller_name}</span>
                            <span className="text-muted-foreground">•</span>
                          </>
                        )}
                        <span className="font-medium font-mono">
                          {formatPhoneNumber(chat.caller_number)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{chat.messages} messages</span>
                      <span>•</span>
                      <span>{chat.duration}</span>
                    </div>
                  </div>
                ))
              )}
              
              {/* Loading indicator */}
              <div 
                ref={observerTarget} 
                className="py-2 sm:py-4 text-center h-16 sm:h-20 flex items-center justify-center"
              >
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent 
          className="fixed right-0 w-full sm:w-[450px] p-0 sm:p-6 overflow-y-auto border-l"
          side="right"
        >
          <SheetHeader className="p-4 sm:p-0 border-b sm:border-0">
            <div className="flex items-center justify-between">
              <SheetTitle>Chat Details</SheetTitle>
              {/* <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSheetOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button> */}
            </div>
            {selectedChat && (
              <p className="text-sm text-muted-foreground font-mono break-all">
                {selectedChat.conversation_id}
              </p>
            )}
          </SheetHeader>
          <div className="overflow-y-auto flex-1 p-4 sm:p-0">
            {selectedChat && selectedChat.transcript && (
              <div className="flex flex-col gap-6 py-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-xl font-semibold text-primary">
                      {selectedChat.agent}
                    </p>

                    {selectedChat.caller_name !== 'Unknown' && (
                      <div>
                        <p className="text-sm text-muted-foreground">Caller</p>
                        <p className="font-medium">
                          {selectedChat.caller_name}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium font-mono">
                        {formatPhoneNumber(selectedChat.caller_number)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(selectedChat.metadata.start_time_unix_secs * 1000)
                          .toLocaleString(undefined, { 
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          })}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Call Duration</p>
                      <p className="font-medium">
                        {Math.floor(selectedChat.metadata.call_duration_secs / 60)}:
                        {(selectedChat.metadata.call_duration_secs % 60)
                          .toString()
                          .padStart(2, '0')}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Cost (credits)</p>
                      <p className="font-medium">{selectedChat.metadata.cost}</p>
                    </div>
                  </div>

                  {/* Audio Player with Play Button */}
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlayAudio(selectedChat.conversation_id)}
                      className="h-10 w-10 shrink-0"
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                    {audioUrl && (
                      <audio 
                        controls 
                        autoPlay
                        className="w-full" 
                        src={audioUrl}
                        onEnded={() => {
                          URL.revokeObjectURL(audioUrl);
                          setAudioUrl(null);
                        }}
                      />
                    )}
                  </div>

                  {selectedChat.analysis.transcript_summary && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-2">Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedChat.analysis.transcript_summary}
                      </p>
                    </div>
                  )}

                  <h3 className="font-medium pt-4">Conversation</h3>
                  <div className="space-y-4">
                    {selectedChat.transcript.map((message, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg ${
                          message.role === 'agent' 
                            ? 'bg-primary/10 ml-4' 
                            : 'bg-muted mr-4'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.role === 'agent' ? 'AI' : 'User'}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {message.time_in_call_secs}s
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 