import { secureStoreStorage } from "@/services/secureStoreStorage";
import { supabase } from "@/services/supabase";
import { User } from '@supabase/supabase-js';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  user: User | null;
  isHydrated: boolean; 
};

type Action = {
  setUser: (user: User | null) => void;
  clearUser: () => void;
  setIsHydrated: (value: boolean) => void; 
};

let authSubscription: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

export const useUserAuthStore = create<State & Action>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false, 
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setIsHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: "user-auth-storage",
      storage: createJSONStorage(() => secureStoreStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => async (state) => {
        const { data: { session } } = await supabase.auth.getSession();
        state?.setUser(session?.user ?? null);

        authSubscription = supabase.auth.onAuthStateChange((event, session) => {
          console.log(`Auth event: ${event}`, session?.user?.email);
          state?.setUser(session?.user ?? null);
          
          if (event === 'INITIAL_SESSION') {
            state?.setIsHydrated(true);
          }
        });
      },
    }
  )
);

export const unsubscribeAuth = () => {
  authSubscription?.data?.subscription?.unsubscribe();
};