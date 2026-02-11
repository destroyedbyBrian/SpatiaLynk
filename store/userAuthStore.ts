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
      onRehydrateStorage: () => (state) => {
        state?.setIsHydrated(true);
      },
    }
  )
);

supabase.auth.getUser().then(({ data: { user } }) => {
    useUserAuthStore.getState().setUser(user);
});

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    useUserAuthStore.getState().setUser(session?.user ?? null);
});

export const unsubscribeAuth = () => {
    authListener?.subscription.unsubscribe()
}