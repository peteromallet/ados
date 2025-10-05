import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return data
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: profile.id,
      discord_username: profile.discord_username,
      discord_id: profile.discord_id,
      avatar_url: profile.avatar_url,
      email: profile.email,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error upserting profile:', error)
    return null
  }
  
  return data
}

