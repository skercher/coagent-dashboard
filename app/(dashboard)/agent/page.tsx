'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function AgentSettingsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge base</h1>
          <p className="text-muted-foreground">
            Provide the LLM with domain-specific information to help it answer questions more accurately.
          </p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="gap-2">
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[800px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Add knowledge base item</SheetTitle>
            <SheetDescription>Add a new URL to the knowledge base</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 py-6">
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
        </SheetContent>
      </Sheet>
    </div>
  );
} 