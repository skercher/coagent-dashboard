import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgentSettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Configure your AI agent's basic settings and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent Name</label>
                <Input placeholder="Customer Support AI" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Prompt</label>
                <Input placeholder="You are a helpful customer service agent..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <Input type="number" placeholder="0.7" min="0" max="2" step="0.1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Response Length</label>
                <Input type="number" placeholder="2000" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Response Templates</CardTitle>
              <CardDescription>
                Configure pre-defined responses and conversation flows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Greeting Message</label>
                <Input placeholder="Hello! How can I assist you today?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fallback Response</label>
                <Input placeholder="I'm sorry, I didn't quite understand that." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Closing Message</label>
                <Input placeholder="Thank you for chatting with us!" />
              </div>
              <Button>Save Templates</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>External Integrations</CardTitle>
              <CardDescription>
                Connect your agent with external services and APIs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Endpoint</label>
                <Input placeholder="https://api.example.com/v1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input type="password" placeholder="Enter your API key" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <Input placeholder="https://your-webhook-url.com" />
              </div>
              <Button>Save Integration Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 