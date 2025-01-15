'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, PlayCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useState } from "react";

// Mock data - replace with real data from your API
const chatLogs = [
  {
    id: 1,
    date: 'Today, 1:01 PM',
    agent: 'K3AnsweringAgent',
    messages: 1,
    duration: '0:10',
    status: 'Success',
    cost: 179,
    transcript: "Sample transcript text here..."
  },
  {
    id: 2,
    date: 'Today, 8:56 AM',
    agent: 'CoWorkAgent',
    messages: 27,
    duration: '4:58',
    status: 'Success',
    cost: 458,
    transcript: "Another sample transcript..."
  },
  // Add more chat logs as needed
];

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Conversation History</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Chat Transcripts</CardTitle>
              <CardDescription>View all chat transcripts here.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatLogs.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedChat(chat);
                  setIsSheetOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{chat.date}</p>
                    <p className="text-sm text-muted-foreground">{chat.agent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{chat.messages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{chat.duration}</span>
                  </div>
                  <span className="text-sm font-medium">{chat.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[800px] sm:w-[600px]">
          <SheetHeader className="space-y-1">
            <SheetTitle>Chat Details</SheetTitle>
            <SheetDescription>
              Conversation from {selectedChat?.date}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">Call Recording</h3>
                <p className="text-sm text-muted-foreground">Duration: {selectedChat?.duration}</p>
              </div>
              <Button 
                size="lg"
                className="gap-2"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <PlayCircle className="h-5 w-5" />
                {isPlaying ? 'Pause' : 'Play Recording'}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Overview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <span className="text-muted-foreground">Agent</span>
                  <p className="font-medium">{selectedChat?.agent}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{selectedChat?.date}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground">Duration</span>
                  <p className="font-medium">{selectedChat?.duration}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground">Cost (credits)</span>
                  <p className="font-medium">{selectedChat?.cost}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Transcript</h3>
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedChat?.transcript}
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 