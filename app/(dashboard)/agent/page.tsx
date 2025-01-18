'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Link, FileText, File } from "lucide-react";
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
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null);
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add');
  const [textContent, setTextContent] = useState('');

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

  function validateFile(file: File): string | null {
    const maxSize = 21 * 1024 * 1024; // 21MB in bytes
    const supportedTypes = ['.pdf', '.txt', '.docx', '.html', '.epub'];
    
    if (file.size > maxSize) {
      return 'File size exceeds 21MB limit';
    }
    
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!extension || !supportedTypes.includes(extension)) {
      return 'Unsupported file type. Please use: pdf, txt, docx, html, or epub';
    }
    
    return null;
  }

  async function handleAddItem() {
    if (!selectedAgent || !ELEVEN_API_KEY) return;

    setIsSubmitting(true);
    try {
      let documentId;

      if (itemType === 'url') {
        if (!isValidUrl(inputValue)) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }

        const formData = new FormData();
        formData.append('url', inputValue.trim());
        
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}/add-to-knowledge-base`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVEN_API_KEY,
            },
            body: formData,
          }
        );
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail?.message || 'Failed to upload URL');
        documentId = data.id;
        
      } else if (itemType === 'file' && inputValue instanceof File) {
        const formData = new FormData();
        formData.append('file', inputValue);
        
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}/add-to-knowledge-base`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVEN_API_KEY,
            },
            body: formData,
          }
        );
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail?.message || 'Failed to upload file');
        documentId = data.id;
        
      } else if (itemType === 'text') {
        if (!inputValue || !textContent) {
          throw new Error('Please provide both text name and content');
        }

        const formData = new FormData();
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        formData.append('file', textBlob, `${inputValue}.txt`);
        
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}/add-to-knowledge-base`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVEN_API_KEY,
            },
            body: formData,
          }
        );
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail?.message || 'Failed to upload text');
        documentId = data.id;
      }

      if (!documentId) throw new Error('Failed to create document');

      // Step 2: Update agent configuration
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

      const newItem = {
        id: documentId,
        type: 'file', // Always use 'file' type for both file and text uploads
        name: itemType === 'text' ? `${inputValue}.txt` : 
              itemType === 'file' ? (inputValue as File).name : 
              inputValue.trim()
      };

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
                    newItem
                  ]
                }
              }
            }
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.detail?.message || 'Failed to update agent');
      }

      await fetchAgentDetails();
      setIsSheetOpen(false);
      setInputValue('');
    } catch (error) {
      console.error('Error adding item:', error);
      alert(error instanceof Error ? error.message : 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleItemClick(item: KnowledgeBaseItem) {
    setEditingItem(item);
    
    try {
      if (item.type === 'url') {
        setItemType('url');
        setInputValue(item.name);
      } else {
        // Fetch item details to determine if it's text or file
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}/knowledge-base/${item.id}`,
          {
            headers: {
              'xi-api-key': ELEVEN_API_KEY!,
            },
          }
        );
        
        const data = await response.json();
        console.log('Item details:', data);

        if (data.extracted_inner_html?.includes('<p>')) {
          // If it contains HTML paragraphs, it's likely a text item
          setItemType('text');
          // Extract text content from HTML
          const textContent = data.extracted_inner_html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .trim();
          setTextContent(textContent);
          setInputValue(item.name.replace(/\.txt$/, ''));
        } else {
          setItemType('file');
          setInputValue(item.name);
          setTextContent('');
        }
      }

      setSheetMode('edit');
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Error fetching item details:', error);
      alert('Failed to load item details');
    }
  }

  async function handleUpdateItem() {
    if (!selectedAgent || !editingItem || !inputValue || !ELEVEN_API_KEY) return;

    setIsSubmitting(true);
    try {
      // Get current agent configuration
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

      // Update the item in the knowledge base
      const updatedKnowledgeBase = currentKnowledgeBase.map(item => 
        item.id === editingItem.id 
          ? { ...item, name: inputValue.trim() }
          : item
      );

      // Update agent configuration
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
        throw new Error(errorData.detail?.message || 'Failed to update item');
      }

      await fetchAgentDetails();
      setIsSheetOpen(false);
      setEditingItem(null);
      setInputValue('');
      setSheetMode('add');
    } catch (error) {
      console.error('Error updating item:', error);
      alert(error instanceof Error ? error.message : 'Failed to update item');
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
              <div 
                key={item.id} 
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center gap-2">
                  {item.type === 'url' ? (
                    <Link className="h-4 w-4 text-muted-foreground" />
                  ) : item.name.endsWith('.txt') ? (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate max-w-[600px]">{item.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Sheet 
        open={isSheetOpen} 
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setEditingItem(null);
            setInputValue('');
            setSheetMode('add');
          }
        }}
      >
        <SheetContent className="w-[800px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>{sheetMode === 'add' ? 'Add' : 'Edit'} knowledge base item</SheetTitle>
            <SheetDescription>
              {sheetMode === 'add' ? 'Add a new item' : 'Update existing item'} in the knowledge base
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 py-6">
            <div>
              <label className="text-sm font-medium">Item type</label>
              <div className="flex gap-2 mt-1">
                <Button 
                  variant={itemType === 'file' ? 'default' : 'outline'}
                  onClick={() => setItemType('file')}
                  size="icon"
                >
                  <File className="h-4 w-4" />
                </Button>
                <Button 
                  variant={itemType === 'url' ? 'default' : 'outline'}
                  onClick={() => setItemType('url')}
                  size="icon"
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button 
                  variant={itemType === 'text' ? 'default' : 'outline'}
                  onClick={() => setItemType('text')}
                  size="icon"
                >
                  <FileText className="h-4 w-4" />
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
                  <div className="space-y-2">
                    <Input 
                      type="file" 
                      accept=".pdf,.txt,.docx,.html,.epub"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const error = validateFile(file);
                          if (error) {
                            alert(error);
                            e.target.value = ''; // Clear the input
                            return;
                          }
                          setInputValue(file);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum size: 21 MB. Supported types: pdf, txt, docx, html, epub.
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {itemType === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Text Name</label>
                  <Input 
                    placeholder="Enter a name for your text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Text Content</label>
                  <textarea
                    className="w-full min-h-[200px] p-2 border rounded-md"
                    placeholder="Enter your text content here"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={sheetMode === 'add' ? handleAddItem : handleUpdateItem}
              disabled={isSubmitting || !inputValue}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {sheetMode === 'add' ? 'Adding...' : 'Updating...'}
                </>
              ) : (
                sheetMode === 'add' ? 'Add to knowledge base' : 'Update item'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 