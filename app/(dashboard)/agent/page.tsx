'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface Agent {
  agent_id: string;
  name: string;
  access_level: string;
}

interface AgentDetails {
  agent_id: string;
  name: string;
  conversation_config: {
    agent: {
      prompt: {
        knowledge_base: Array<{
          type: string;
          name: string;
          id: string;
        }>;
      };
    };
  };
}

interface KnowledgeBaseItem {
  type: string;
  name: string;
  id: string;
}

export default function AgentSettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBaseItem[]>([]);
  const [itemType, setItemType] = useState<'file' | 'url' | 'text'>('url');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ELEVEN_API_KEY = process.env.NEXT_PUBLIC_ELEVEN_API_KEY;

  async function fetchAgentDetails() {
    if (!selectedAgent) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}`,
        {
          headers: {
            'xi-api-key': ELEVEN_API_KEY!
          }
        }
      );
      const data: AgentDetails = await response.json();
      console.log('Agent details:', data);
      setKnowledgeItems(data.conversation_config.agent.prompt.knowledge_base || []);
    } catch (error) {
      console.error('Error fetching agent details:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch agents list
  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
          headers: {
            'xi-api-key': ELEVEN_API_KEY!
          }
        });
        const data = await response.json();
        setAgents(data.agents);
        if (data.agents.length > 0) {
          setSelectedAgent(data.agents[0].agent_id);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    }
    fetchAgents();
  }, []);

  // Call fetchAgentDetails when selection changes
  useEffect(() => {
    if (selectedAgent) {
      fetchAgentDetails();
    }
  }, [selectedAgent]);

  async function handleDeleteItem(itemId: string) {
    if (!selectedAgent || !ELEVEN_API_KEY) return;

    try {
      // First get current agent configuration
      const agentResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}`,
        {
          headers: {
            'xi-api-key': ELEVEN_API_KEY,
          }
        }
      );
      const agentData = await agentResponse.json();
      
      // Filter out the item to be deleted
      const currentKnowledgeBase = agentData.conversation_config.agent.prompt.knowledge_base || [];
      const updatedKnowledgeBase = currentKnowledgeBase.filter(item => item.id !== itemId);

      // Update agent with filtered knowledge base
      const updateResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}`,
        {
          method: 'PATCH',
          headers: {
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_config: {
              agent: {
                prompt: {
                  knowledge_base: updatedKnowledgeBase
                }
              }
            }
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Delete error:', errorData);
        throw new Error(errorData.detail?.message || 'Failed to delete item');
      }

      console.log('Item deleted successfully');
      await fetchAgentDetails();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete item');
    }
  }

  function isValidUrl(urlString: string) {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function handleAddItem() {
    if (!selectedAgent || !inputValue || !ELEVEN_API_KEY) return;

    setIsSubmitting(true);
    try {
      if (itemType === 'url') {
        if (!isValidUrl(inputValue)) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }

        // Step 1: Create knowledge base document
        const formData = new FormData();
        formData.append('url', inputValue.trim());

        console.log('Step 1: Creating document with URL:', inputValue.trim());
        const uploadResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}/add-to-knowledge-base`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVEN_API_KEY,
            },
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();
        console.log('Upload response:', uploadData);

        if (!uploadResponse.ok) {
          console.error('Upload error:', uploadData);
          throw new Error(uploadData.detail?.message || 'Failed to upload document');
        }

        const documentId = uploadData.id;
        console.log('Document created:', documentId);

        // Get current agent configuration first
        const agentResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}`,
          {
            headers: {
              'xi-api-key': ELEVEN_API_KEY,
            }
          }
        );
        const agentData = await agentResponse.json();
        const currentKnowledgeBase = agentData.conversation_config.agent.prompt.knowledge_base || [];

        // Step 2: Update agent configuration with combined knowledge base
        console.log('Step 2: Updating agent configuration...');
        const updateResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}`,
          {
            method: 'PATCH',
            headers: {
              'xi-api-key': ELEVEN_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation_config: {
                agent: {
                  prompt: {
                    knowledge_base: [
                      ...currentKnowledgeBase,
                      {
                        id: documentId,
                        type: 'url',
                        name: inputValue.trim()
                      }
                    ]
                  }
                }
              }
            })
          }
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('Agent update error:', errorData);
          throw new Error(errorData.detail?.message || 'Failed to update agent');
        }

        console.log('Agent updated successfully');
        await fetchAgentDetails();
        setIsSheetOpen(false);
        setInputValue('');
      } else if (itemType === 'file' && inputValue instanceof File) {
        // Handle file upload similarly
        const formData = new FormData();
        formData.append('file', inputValue);
        // ... rest of file upload logic
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert(error instanceof Error ? error.message : 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge base</h1>
          <p className="text-muted-foreground">
            Manage knowledge base items for your agents
          </p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      <div className="flex justify-end mb-4">
        <Select 
          value={selectedAgent} 
          onValueChange={setSelectedAgent}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem 
                key={agent.agent_id} 
                value={agent.agent_id}
              >
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Items</CardTitle>
          <CardDescription>Current knowledge base sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : knowledgeItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items in knowledge base
            </div>
          ) : (
            knowledgeItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {item.type}
                  </span>
                  <span className="text-sm truncate max-w-[600px]">{item.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[800px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Add knowledge base item</SheetTitle>
            <SheetDescription>Add a new item to the knowledge base</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 py-6">
            <div>
              <label className="text-sm font-medium">Item type</label>
              <div className="flex gap-2 mt-1">
                <Button 
                  variant={itemType === 'file' ? 'default' : 'outline'}
                  onClick={() => setItemType('file')}
                >
                  File
                </Button>
                <Button 
                  variant={itemType === 'url' ? 'default' : 'outline'}
                  onClick={() => setItemType('url')}
                >
                  URL
                </Button>
                <Button 
                  variant={itemType === 'text' ? 'default' : 'outline'}
                  onClick={() => setItemType('text')}
                >
                  Text
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {itemType === 'url' && (
                <>
                  <label className="text-sm font-medium">URL</label>
                  <Input 
                    placeholder="https://example.com" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </>
              )}
              
              {itemType === 'file' && (
                <>
                  <label className="text-sm font-medium">File</label>
                  <Input 
                    type="file" 
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setInputValue(file);
                    }}
                  />
                </>
              )}
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddItem}
              disabled={isSubmitting || !inputValue}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to knowledge base'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 