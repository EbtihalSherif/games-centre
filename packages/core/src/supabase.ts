import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// With no Supabase keys the app runs in "demo mode": data stays in this browser only.
export const isDemo = !url || !key

const client: SupabaseClient | null = isDemo ? null : createClient(url, key)

// Callers guard on `isDemo` first; this turns the nullable client into a plain one.
export function db(): SupabaseClient {
  if (!client) throw new Error('Supabase is not configured')
  return client
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export async function uploadImage(blob: Blob, bucket = 'photos'): Promise<string> {
  if (isDemo) return blobToDataUrl(blob)
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await db().storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return db().storage.from(bucket).getPublicUrl(path).data.publicUrl
}
