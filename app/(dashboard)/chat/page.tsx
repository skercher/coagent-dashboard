'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getConversations, getConversationById, getAvailableAgents, getConversationAudio } from '../../../services/elevenLabsClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

// ... rest of your imports and interfaces ...

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ConversationDetails | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // ... rest of your state ...

  return (
    <div>
      {/* ... rest of your component ... */}
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent 
          className="fixed inset-0 sm:w-[600px] lg:w-[800px] p-0 sm:p-6 flex flex-col"
          side="right"
        >
          <SheetHeader className="p-4 sm:p-0 space-y-2 border-b sm:border-0">
            <div className="flex justify-between items-center">
              <SheetTitle>Chat Details</SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSheetOpen(false)}
                className="sm:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedChat && (
              <p className="text-sm text-muted-foreground font-mono break-all">
                {selectedChat.conversation_id}
              </p>
            )}
          </SheetHeader>
          <div className="overflow-y-auto flex-1 px-4 sm:px-0">
            {/* ... rest of your content ... */}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 