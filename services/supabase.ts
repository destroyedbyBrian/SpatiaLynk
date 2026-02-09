import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const storage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  // process.env.SUPABASE_URL!,
  // process.env.SUPABASE_ANON_KEY!,
  " https://vrtwgtlgzklxkuyioqtu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydHdndGxnemtseGt1eWlvcXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTk0NjUsImV4cCI6MjA4MTAzNTQ2NX0.BzEeRmdqJ0KlTBl01MAlN70v3KrlN4fnSWY8fXALxt4",
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)

console.log(
  'SUPABASE ENV:',
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
