"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, Zap, Building } from 'lucide-react';
import { getAuthenticatedApi } from '@/lib/api-client';

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
  { value: 'instant', label: 'Instant reply', description: 'Send responses immediately' },
  { value: 'custom_delay', label: 'Custom delay', description: 'Wait a specific time before responding' },
  { value: 'business_hours', label: 'Business hours profile', description: 'Different delays for business vs after hours' }
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
      const rows = await fetchSettings();
      const replySettings = extractReplySettings(rows);
      setSettings(replySettings);
    } catch (err) {
      setError('Failed to load reply timing settings');
    } finally {
      setLoading(false);
    }
  }, [dealershipId]);

  const fetchSettings = async (): Promise<Array<{ setting_key: string; setting_value: any }>> => {
    const api = await getAuthenticatedApi();
    return api.get<Array<{ setting_key: string; setting_value: any }>>('/settings/dealership');
  };

  const extractReplySettings = (rows: Array<{ setting_key: string; setting_value: any }>): ReplyTimingSettings => {
    const map: Record<string, any> = {};
    for (const r of rows) map[r.setting_key] = r.setting_value;
    return {
      reply_timing_mode: (map['reply_timing_mode'] as string) || 'instant',
      reply_delay_seconds: (map['reply_delay_seconds'] as number) ?? 30,
      business_hours_start: (map['business_hours_start'] as string) || '09:00',
      business_hours_end: (map['business_hours_end'] as string) || '17:00',
      business_hours_delay_seconds: (map['business_hours_delay_seconds'] as number) ?? 60,
    };
  };

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
    const api = await getAuthenticatedApi();
    const settingUpdates = createSettingUpdates(settings);
    for (const update of settingUpdates) {
      await api.put('/settings/dealership', {
        setting_key: update.key,
        setting_value: update.value,
      });
    }
  };

  const createSettingUpdates = (settings: ReplyTimingSettings) => [
    { key: 'reply_timing_mode', value: settings.reply_timing_mode },
    { key: 'reply_delay_seconds', value: settings.reply_delay_seconds },
    { key: 'business_hours_start', value: settings.business_hours_start },
    { key: 'business_hours_end', value: settings.business_hours_end },
    { key: 'business_hours_delay_seconds', value: settings.business_hours_delay_seconds }
  ];

  // updateSetting removed; handled by saveSettings via api client

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
    <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Clock className="h-5 w-5 text-gray-500" />
          Reply Timing Settings
        </CardTitle>
        <CardDescription className="text-gray-700">
          Configure how quickly the AI responds to customer messages.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Temporarily hide load error UI */}
        
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">Reply timing settings saved successfully.</AlertDescription>
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
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-gray-700">
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
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl">
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
    <Label htmlFor="reply-mode" className="text-gray-700 font-medium">Reply timing mode</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white/90 border-gray-300 text-black justify-start rounded-xl focus:border-amber-400 focus:ring-amber-200">
        <SelectValue placeholder="Select reply timing mode" className="text-left" />
      </SelectTrigger>
      <SelectContent className="bg-white/95 backdrop-blur-sm border-amber-200 text-black rounded-xl">
        {REPLY_TIMING_MODES.map((mode) => (
          <SelectItem key={mode.value} value={mode.value}>
            <div className="flex items-center gap-2">
              {mode.value === 'instant' && <Zap className="h-4 w-4" />}
              {mode.value === 'custom_delay' && <Clock className="h-4 w-4" />}
              {mode.value === 'business_hours' && <Building className="h-4 w-4" />}
              <div>
                <div className="font-medium text-gray-900">{mode.label}</div>
                <div className="text-sm text-gray-600">{mode.description}</div>
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
    <Label htmlFor="custom-delay" className="text-gray-700 font-medium">Custom delay (seconds)</Label>
    <Input
      id="custom-delay"
      type="number"
      min="0"
      max="300"
      value={settings.reply_delay_seconds}
      onChange={(e) => onChange('reply_delay_seconds', e.target.value)}
      placeholder="30"
      className="bg-white/90 border-gray-300 text-black rounded-xl focus:border-amber-400 focus:ring-amber-200"
    />
    <p className="text-sm text-gray-600">
      The AI will wait this many seconds before responding (with random jitter).
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
        <Label htmlFor="business-start" className="text-gray-700 font-medium">Business hours start</Label>
        <Input
          id="business-start"
          type="time"
          value={settings.business_hours_start}
          onChange={(e) => onChange('business_hours_start', e.target.value)}
          className="bg-white/90 border-gray-300 text-black rounded-xl focus:border-amber-400 focus:ring-amber-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="business-end" className="text-gray-700 font-medium">Business hours end</Label>
        <Input
          id="business-end"
          type="time"
          value={settings.business_hours_end}
          onChange={(e) => onChange('business_hours_end', e.target.value)}
          className="bg-white/90 border-gray-300 text-black rounded-xl focus:border-amber-400 focus:ring-amber-200"
        />
      </div>
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="business-delay" className="text-gray-700 font-medium">Delay during business hours (seconds)</Label>
      <Input
        id="business-delay"
        type="number"
        min="0"
        max="300"
        value={settings.business_hours_delay_seconds}
        onChange={(e) => onChange('business_hours_delay_seconds', e.target.value)}
        placeholder="60"
        className="bg-white/90 border-gray-300 text-black rounded-xl focus:border-amber-400 focus:ring-amber-200"
      />
      <p className="text-sm text-gray-600">
        Responses are instant after hours, delayed during business hours.
      </p>
    </div>
  </div>
);
