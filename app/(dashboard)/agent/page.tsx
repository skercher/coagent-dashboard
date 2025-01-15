'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "components/ui/dialog"

export default function AgentSettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge base</h1>
          <p className="text-muted-foreground">
            Provide the LLM with domain-specific information to help it answer questions more accurately.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Links</CardTitle>
          <CardDescription>Current knowledge base sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example items */}
          {[
            'https://forecast.weather.gov/MapClick.php?CityName=Grand+Junction',
            'https://750main.altspacework.com/calendar',
            'https://750main.altspacework.com/account/memberships/change',
          ].map((url, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
              <span className="text-sm truncate">{url}</span>
              <Button variant="ghost" size="sm">Delete</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Add knowledge base item</DialogTitle>
                <DialogDescription>Add a new URL to the knowledge base</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Item type</label>
              <div className="flex gap-2 mt-1">
                <Button variant="outline">File</Button>
                <Button>URL</Button>
                <Button variant="outline">Text</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input placeholder="https://example.com" />
              <p className="text-sm text-muted-foreground">
                Specify a URL where the knowledge base is hosted (For example, a documentation website).
                The URL will be scraped and its text content will be passed to the LLM alongside the prompt.
              </p>
            </div>
            <Button className="w-full">Add to knowledge base</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 