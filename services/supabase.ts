import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vrtwgtlgzklxkuyioqtu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydHdndGxnemtseGt1eWlvcXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTk0NjUsImV4cCI6MjA4MTAzNTQ2NX0.BzEeRmdqJ0KlTBl01MAlN70v3KrlN4fnSWY8fXALxt4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
