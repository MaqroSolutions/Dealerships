import { getAuthenticatedApi } from './api-client'

export interface SettingDefinition {
  key: string
  data_type: string
  description: string
  default_value: any
  allowed_values: any[] | null
  is_dealership_level: boolean
  is_user_level: boolean
  created_at: string
}

export interface UserSetting {
  user_id: string
  setting_key: string
  setting_value: any
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface DealershipSetting {
  dealership_id: string
  setting_key: string
  setting_value: any
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface EffectiveSetting {
  key: string
  value: any
  source: 'user' | 'dealership' | 'default'
  setting_definition: SettingDefinition
}

export interface UserSettingUpdate {
  setting_key: string
  setting_value: any
}

export interface DealershipSettingUpdate {
  setting_key: string
  setting_value: any
}

// Get all available setting definitions
export async function getSettingDefinitions(): Promise<SettingDefinition[]> {
  const api = await getAuthenticatedApi()
  return api.get<SettingDefinition[]>('/settings/definitions')
}

// Get user's personal settings (only overrides)
export async function getUserSettings(): Promise<UserSetting[]> {
  const api = await getAuthenticatedApi()
  return api.get<UserSetting[]>('/settings/user')
}

// Get effective value for a specific setting
export async function getSettingValue(key: string): Promise<any> {
  const api = await getAuthenticatedApi()
  const result = await api.get<{ key: string; value: any }>(`/settings/user/${key}`)
  return result.value
}

// Get detailed setting info with source
export async function getEffectiveSetting(key: string): Promise<EffectiveSetting> {
  const api = await getAuthenticatedApi()
  return api.get<EffectiveSetting>(`/settings/user/${key}/detailed`)
}

// Update a user setting
export async function updateUserSetting(key: string, value: any): Promise<UserSetting> {
  const api = await getAuthenticatedApi()
  const payload: UserSettingUpdate = {
    setting_key: key,
    setting_value: value,
  }
  return api.put<UserSetting>('/settings/user', payload)
}

// Remove user setting override (fall back to dealership/default)
export async function removeUserSetting(key: string): Promise<void> {
  const api = await getAuthenticatedApi()
  return api.delete<void>(`/settings/user/${key}`)
}

// Get dealership settings (requires manager+ role)
export async function getDealershipSettings(): Promise<DealershipSetting[]> {
  const api = await getAuthenticatedApi()
  return api.get<DealershipSetting[]>('/settings/dealership')
}

// Update dealership setting (requires manager+ role)
export async function updateDealershipSetting(key: string, value: any): Promise<DealershipSetting> {
  const api = await getAuthenticatedApi()
  const payload: DealershipSettingUpdate = {
    setting_key: key,
    setting_value: value,
  }
  return api.put<DealershipSetting>('/settings/dealership', payload)
}

// Helper to get multiple effective settings at once
export async function getMultipleSettings(keys: string[]): Promise<Record<string, any>> {
  const results = await Promise.allSettled(
    keys.map(key => getSettingValue(key))
  )
  
  const settings: Record<string, any> = {}
  
  results.forEach((result, index) => {
    const key = keys[index]
    if (result.status === 'fulfilled') {
      settings[key] = result.value
    } else {
      console.warn(`Failed to fetch setting ${key}:`, result.reason)
      settings[key] = null
    }
  })
  
  return settings
}