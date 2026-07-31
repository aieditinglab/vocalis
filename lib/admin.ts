import { createClient } from './supabase'

export interface FeatureFlag {
  id: string
  label: string
  description: string
  enabled: boolean
  updated_at: string
}

/**
 * Reads the profiles.is_admin flag rather than comparing an email string, so
 * this agrees with the RLS policies and the admin_* functions, which all gate
 * on is_admin(). This check only decides what UI to render — every privileged
 * read is independently enforced server-side, so faking it client-side yields
 * an empty page, not data.
 */
export async function getIsAdmin(): Promise<boolean> {
  const sb = createClient()
  try {
    const { data: { session } } = await sb.auth.getSession()
    if (!session?.user) return false

    const { data } = await sb
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle()

    return data?.is_admin === true
  } catch { return false }
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const sb = createClient()
  try {
    const { data } = await sb
      .from('feature_flags')
      .select('*')
      .order('id')
    return data || []
  } catch { return [] }
}

export async function getFeatureFlag(id: string): Promise<boolean> {
  const sb = createClient()
  try {
    const { data } = await sb
      .from('feature_flags')
      .select('enabled')
      .eq('id', id)
      .single()
    return data?.enabled !== false // default true if not found
  } catch { return true }
}

export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<boolean> {
  const sb = createClient()
  try {
    const { error } = await sb
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  } catch { return false }
}