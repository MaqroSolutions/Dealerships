"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, Zap, Building } from 'lucide-react';

// Types
interface ReplyTimingSettings {
  reply_timing_mode: 'instant' | 'custom_delay' | 'business_hours';
  reply_delay_seconds: number;
  business_hours_start: string;
  business_hours_end: string;
  business_hours_delay_seconds: number;
}

interface ReplyTimingSettingsProps {
  dealershipId: string;
  onSave?: (settings: ReplyTimingSettings) => void;
}

// Constants
const REPLY_TIMING_MODES = [
  { value: 'instant', label: 'Instant Reply', description: 'Send responses immediately' },
  { value: 'custom_delay', label: 'Custom Delay', description: 'Wait a specific time before responding' },
  { value: 'business_hours', label: 'Business Hours Profile', description: 'Different delays for business vs after hours' }
] as const;

const DEFAULT_SETTINGS: ReplyTimingSettings = {
  reply_timing_mode: 'instant',
  reply_delay_seconds: 30,
  business_hours_start: '09:00',
  business_hours_end: '17:00',
  business_hours_delay_seconds: 60
};

export function ReplyTimingSettings({ dealershipId, onSave }: ReplyTimingSettingsProps) {
  // State management
  const [settings, setSettings] = useState<ReplyTimingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [dealershipId]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchSettings();
      const replySettings = extractReplySettings(data);
      setSettings(replySettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [dealershipId]);

  const fetchSettings = async () => {
    const response = await fetch(`/api/settings/dealership?dealership_id=${dealershipId}`);
    if (!response.ok) {
      throw new Error('Failed to load settings');
    }
    return await response.json();
  };

  const extractReplySettings = (data: any): ReplyTimingSettings => ({
    reply_timing_mode: data.reply_timing_mode || 'instant',
    reply_delay_seconds: data.reply_delay_seconds || 30,
    business_hours_start: data.business_hours_start || '09:00',
    business_hours_end: data.business_hours_end || '17:00',
    business_hours_delay_seconds: data.business_hours_delay_seconds || 60
  });

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await saveSettings(settings);
      setSuccess(true);
      onSave?.(settings);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [settings, onSave]);

  const saveSettings = async (settings: ReplyTimingSettings) => {
    const settingUpdates = createSettingUpdates(settings);
    
    for (const update of settingUpdates) {
      await updateSetting(update);
    }
  };

  const createSettingUpdates = (settings: ReplyTimingSettings) => [
    { key: 'reply_timing_mode', value: settings.reply_timing_mode },
    { key: 'reply_delay_seconds', value: settings.reply_delay_seconds },
    { key: 'business_hours_start', value: settings.business_hours_start },
    { key: 'business_hours_end', value: settings.business_hours_end },
    { key: 'business_hours_delay_seconds', value: settings.business_hours_delay_seconds }
  ];

  const updateSetting = async (update: { key: string; value: any }) => {
    const response = await fetch('/api/settings/dealership', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setting_key: update.key,
        setting_value: update.value
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ${update.key}`);
    }
  };

  // Event handlers
  const handleModeChange = useCallback((mode: string) => {
    setSettings(prev => ({ 
      ...prev, 
      reply_timing_mode: mode as ReplyTimingSettings['reply_timing_mode'] 
    }));
  }, []);

  const handleDelayChange = useCallback((field: keyof ReplyTimingSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 300) {
      setSettings(prev => ({ ...prev, [field]: numValue }));
    }
  }, []);

  const handleTimeChange = useCallback((field: 'business_hours_start' | 'business_hours_end', value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Reply Timing Settings
        </CardTitle>
        <CardDescription>
          Configure how quickly the AI responds to customer messages. This helps make conversations feel more natural.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>Reply timing settings saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* Reply Mode Selection */}
        <ReplyModeSelector 
          value={settings.reply_timing_mode} 
          onChange={handleModeChange} 
        />

        {/* Custom Delay Settings */}
        {settings.reply_timing_mode === 'custom_delay' && (
          <CustomDelaySettings 
            settings={settings} 
            onChange={handleDelayChange} 
          />
        )}

        {/* Business Hours Settings */}
        {settings.reply_timing_mode === 'business_hours' && (
          <BusinessHoursSettings 
            settings={settings} 
            onChange={handleTimeChange} 
          />
        )}

        {/* Info Box */}
        <Alert>
          <AlertDescription>
            <strong>Smart Reply Rules:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Transactional queries (hours, inventory, pricing) always get instant replies</li>
              <li>• Rapport-building messages (greetings, thanks) use the configured delay</li>
              <li>• All replies include random jitter (±10-15 seconds) to feel natural</li>
              <li>• Maximum delay is capped at 5 minutes for safety</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components
const LoadingState = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading reply timing settings...
      </div>
    </CardContent>
  </Card>
);

const ReplyModeSelector = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) => (
  <div className="space-y-3">
    <Label htmlFor="reply-mode">Reply Timing Mode</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select reply timing mode" />
      </SelectTrigger>
      <SelectContent>
        {REPLY_TIMING_MODES.map((mode) => (
          <SelectItem key={mode.value} value={mode.value}>
            <div className="flex items-center gap-2">
              {mode.value === 'instant' && <Zap className="h-4 w-4" />}
              {mode.value === 'custom_delay' && <Clock className="h-4 w-4" />}
              {mode.value === 'business_hours' && <Building className="h-4 w-4" />}
              <div>
                <div className="font-medium">{mode.label}</div>
                <div className="text-sm text-muted-foreground">{mode.description}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const CustomDelaySettings = ({ 
  settings, 
  onChange 
}: { 
  settings: ReplyTimingSettings; 
  onChange: (field: keyof ReplyTimingSettings, value: string) => void; 
}) => (
  <div className="space-y-3">
    <Label htmlFor="custom-delay">Custom Delay (seconds)</Label>
    <Input
      id="custom-delay"
      type="number"
      min="0"
      max="300"
      value={settings.reply_delay_seconds}
      onChange={(e) => onChange('reply_delay_seconds', e.target.value)}
      placeholder="30"
    />
    <p className="text-sm text-muted-foreground">
      AI will wait this many seconds before responding (with random jitter)
    </p>
  </div>
);

const BusinessHoursSettings = ({ 
  settings, 
  onChange 
}: { 
  settings: ReplyTimingSettings; 
  onChange: (field: 'business_hours_start' | 'business_hours_end', value: string) => void; 
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="business-start">Business Hours Start</Label>
        <Input
          id="business-start"
          type="time"
          value={settings.business_hours_start}
          onChange={(e) => onChange('business_hours_start', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-end">Business Hours End</Label>
        <Input
          id="business-end"
          type="time"
          value={settings.business_hours_end}
          onChange={(e) => onChange('business_hours_end', e.target.value)}
        />
      </div>
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="business-delay">Delay During Business Hours (seconds)</Label>
      <Input
        id="business-delay"
        type="number"
        min="0"
        max="300"
        value={settings.business_hours_delay_seconds}
        onChange={(e) => onChange('business_hours_delay_seconds', e.target.value)}
        placeholder="60"
      />
      <p className="text-sm text-muted-foreground">
        Responses will be instant after hours, but delayed during business hours
      </p>
    </div>
  </div>
);
