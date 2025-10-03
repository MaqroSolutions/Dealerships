"use client";

import React from 'react';
import { ReplyTimingSettings } from '@/components/reply-timing-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function AdminSettingsPage() {
  // In a real app, you'd get this from auth context or props
  const dealershipId = "your-dealership-id"; // This should come from auth context

  const handleSettingsSave = (settings: any) => {
    console.log('Settings saved:', settings);
    // You could show a toast notification here
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dealership Settings</h1>
        <p className="text-muted-foreground">
          Configure your dealership's AI behavior and preferences.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This is a demo implementation. In production, you would:
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Get dealership ID from authentication context</li>
            <li>• Add proper error handling and loading states</li>
            <li>• Implement real API endpoints for settings</li>
            <li>• Add validation and user feedback</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <ReplyTimingSettings 
          dealershipId={dealershipId}
          onSave={handleSettingsSave}
        />
        
        {/* Placeholder for other settings */}
        <Card>
          <CardHeader>
            <CardTitle>Other Settings</CardTitle>
            <CardDescription>
              Additional dealership configuration options will be added here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              More settings components will be added in future updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
