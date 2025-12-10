import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

const secureStorageAdapter = {
    getItem: (key: string): Promise<string | null> => SecureStore.getItemAsync(key).catch((err) => 
    { 
        console.error('SecureStore getItem error:', err);
        return null
    }),
    setItem: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value).catch((err) => {
        console.error('SecureStore getItem error:', err);
    }),
    removeItem: (key: string): Promise<void> => SecureStore.deleteItemAsync(key).catch((err) => {
        console.error('SecureStore getItem error:', err);
    }),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: secureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    }
})

