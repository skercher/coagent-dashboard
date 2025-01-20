'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Link, FileText, File } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/components/ui/use-toast";
import { getAgentSettings, upsertAgentSettings } from '@/services/agentSettingsService';

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

function isFile(value: any): value is File {
  return value instanceof globalThis.File;
}

export default function AgentSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBaseItem[]>([]);
  const [itemType, setItemType] = useState<'file' | 'url' | 'text'>('url');
  const [inputValue, setInputValue] = useState<string | File>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null);
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add');
  const [textContent, setTextContent] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
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

  useEffect(() => {
    async function fetchSettings() {
      if (!selectedAgent) return;
      
      try {
        const settings = await getAgentSettings(selectedAgent);
        if (settings) {
          setFirstMessage(settings.first_message || '');
          setSystemPrompt(settings.system_prompt || '');
          setWebsiteUrl(settings.website_url || '');
        } else {
          // Reset form if no settings found
          setFirstMessage('');
          setSystemPrompt('');
          setWebsiteUrl('');
        }
      } catch (error) {
        console.error('Error fetching agent settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load agent settings",
          duration: 3000
        });
      }
    }
    
    fetchSettings();
  }, [selectedAgent, toast]);

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
      const updatedKnowledgeBase = currentKnowledgeBase.filter((item: KnowledgeBaseItem) => item.id !== itemId);

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

  function isValidUrl(value: string | File): boolean {
    if (typeof value !== 'string') return false;
    
    try {
      const url = new URL(value);
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
        if (typeof inputValue !== 'string' || !isValidUrl(inputValue)) {
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
        
      } else if (itemType === 'file' && isFile(inputValue)) {
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
        name: itemType === 'text' ? 
              // Use the input value directly without adding .txt
              inputValue.toString() :
              itemType === 'file' && isFile(inputValue) ? inputValue.name : 
              typeof inputValue === 'string' ? inputValue.trim() :
              inputValue.name
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
        // Check file extension first
        const fileExtensions = ['.pdf', '.docx', '.html', '.epub'];
        const isFileType = fileExtensions.some(ext => item.name.toLowerCase().endsWith(ext));
        
        if (isFileType) {
          // If it's a known file type, go straight to file tab
          setItemType('file');
          setInputValue(item.name);
          setTextContent('');
        } else {
          // For other files, check content
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

          // Check if it's a text item by looking at the content
          if (data.extracted_inner_html) {
            // If it has extracted HTML content, it's likely a text item
            setItemType('text');
            const textContent = data.extracted_inner_html
              .replace(/<[^>]*>/g, '')
              .trim();
            setTextContent(textContent);
            setInputValue(item.name.replace(/\.txt$/, ''));
          } else {
            // It's a regular file
            setItemType('file');
            setInputValue(item.name);
            setTextContent('');
          }
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
    if (!selectedAgent || !editingItem || !ELEVEN_API_KEY) return;

    setIsSubmitting(true);
    try {
      let documentId = editingItem.id;

      // Handle different item types
      if (itemType === 'file') {
        if (isFile(inputValue)) {
          // Upload new file
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
        }
      } else if (itemType === 'text') {
        // Handle text update
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

      // Update the knowledge base
      const updatedKnowledgeBase = currentKnowledgeBase.map((item: KnowledgeBaseItem) => 
        item.id === editingItem.id 
          ? {
              id: documentId,
              type: itemType === 'text' ? 'file' : itemType,
              name: itemType === 'text' ? 
                    // Use the input value directly without adding .txt
                    inputValue.toString() :
                    itemType === 'file' && isFile(inputValue) ? inputValue.name :
                    typeof inputValue === 'string' ? inputValue.trim() :
                    inputValue.name
            }
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
      setTextContent('');
      setSheetMode('add');
    } catch (error) {
      console.error('Error updating item:', error);
      alert(error instanceof Error ? error.message : 'Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveSettings() {
    if (!selectedAgent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an agent first",
        duration: 3000
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save to our database
      await upsertAgentSettings({
        agent_id: selectedAgent,
        first_message: firstMessage,
        system_prompt: systemPrompt,
        website_url: websiteUrl
      });

      // Update Eleven Labs agent configuration
      const updateResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${selectedAgent}`,
        {
          method: 'PATCH',
          headers: {
            'xi-api-key': ELEVEN_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_config: {
              agent: {
                prompt: {
                  prompt: systemPrompt,
                },
                first_message: firstMessage,
              }
            }
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.detail?.message || 'Failed to update agent configuration');
      }

      toast({
        variant: "success",
        title: "Success",
        description: "Agent settings saved successfully",
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving agent settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save agent settings",
        duration: 3000
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agent Settings</h1>
        <Select 
          value={selectedAgent} 
          onValueChange={setSelectedAgent}
        >
          <SelectTrigger className="w-[250px]">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
            <CardDescription>Configure your AI agent's behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">First Message</label>
              <Input
                placeholder="Enter the first message your agent will say..."
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">System Prompt</label>
              <Textarea
                placeholder="Enter the system prompt..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="mt-1 min-h-[120px] resize-y"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Website URL</label>
              <Input
                placeholder="Enter your website URL..."
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                size="sm"
                onClick={handleSaveSettings}
                disabled={isSaving || !selectedAgent}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Manage knowledge base items</CardDescription>
            </div>
            <Button 
              size="sm"
              onClick={() => {
                setItemType('file');
                setInputValue('');
                setTextContent('');
                setSheetMode('add');
                setIsSheetOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
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
              <div className="space-y-2">
                {knowledgeItems.map((item) => (
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
                      <span className="text-sm truncate max-w-[300px]">{item.name}</span>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet 
        open={isSheetOpen} 
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setEditingItem(null);
            setInputValue('');
            setTextContent('');
            setItemType('file');
            setSheetMode('add');
          }
        }}
      >
        <SheetContent 
          className="fixed right-0 w-full h-[100dvh] sm:w-[450px] p-0 sm:p-6 overflow-y-auto border-l"
          side="right"
        >          
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
                  variant={itemType === 'file' ? 'default' : 'ghost'}
                  onClick={() => setItemType('file')}
                  size="icon"
                  className="rounded-lg hover:bg-gray-100 border-0 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <File className="h-4 w-4" />
                </Button>
                <Button 
                  variant={itemType === 'url' ? 'default' : 'ghost'}
                  onClick={() => setItemType('url')}
                  size="icon"
                  className="rounded-lg hover:bg-gray-100 border-0 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Button 
                  variant={itemType === 'text' ? 'default' : 'ghost'}
                  onClick={() => setItemType('text')}
                  size="icon"
                  className="rounded-lg hover:bg-gray-100 border-0 outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    value={typeof inputValue === 'string' ? inputValue : ''}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </>
              )}
              
              {itemType === 'file' && (
                <>
                  <label className="text-sm font-medium">File</label>
                  <div className="space-y-4">
                    {sheetMode === 'edit' && (
                      <div className="text-sm text-muted-foreground">
                        Current file: {editingItem?.name}
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    >
                      <File className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {sheetMode === 'edit' ? 'Upload new file' : 'Click or drag files to upload'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum size: 21 MB
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported types: pdf, txt, docx, html, epub
                      </p>
                    </div>

                    <Input 
                      type="file" 
                      className="hidden"
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

                    {isFile(inputValue) && (
                      <div className="flex items-center gap-2 p-2 border rounded">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">{inputValue.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="ml-auto"
                          onClick={() => {
                            setInputValue(sheetMode === 'edit' ? editingItem?.name || '' : '');
                            const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
                            if (fileInput) fileInput.value = '';
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
                    value={typeof inputValue === 'string' ? inputValue : ''}
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
