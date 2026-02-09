import { supabase } from "@/services/supabase";
import { User } from '@supabase/supabase-js';
import { create } from "zustand";


type State ={
    user: User | null
}

type Action = {
    setUser: (User: User | null) => void
    clearUser: () => void
}

export const useUserAuthStore = create<State & Action>((set) => ({
    user: null,
    role: 'free_users',
    setUser: (user: User | null) => set({ user }),
    clearUser: () => set({ user: null})
}))

// Initialize and sync with Supabase session
supabase.auth.getUser().then(({ data: { user } }) => {
    useUserAuthStore.getState().setUser(user);
});

// Listen for auth changes (login/logout automatically update store)
const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    useUserAuthStore.getState().setUser(session?.user ?? null);

});

export const unsubscribeAuth = () => {
    authListener?.subscription.unsubscribe()
}
// import { supabase } from '@/services/supabase';
// import { Session, User } from '@supabase/supabase-js';
// import { useEffect } from 'react';
// import { create } from 'zustand';

// type AuthState = {
//   user: User | null;
//   session: Session | null;
//   setUser: (user: User | null) => void;
//   setSession: (session: Session | null) => void;
//   initialize: () => () => void; // returns unsubscribe function
// };

// export const userAuthStore = create<AuthState>((set) => ({
//   user: null,
//   session: null,
//   setUser: (user) => set({ user }),
//   setSession: (session) => set({ session }),
  
//   initialize: () => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       set({ session, user: session?.user ?? null });
//     });

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         set({ session, user: session?.user ?? null });
//       }
//     );

//     return () => subscription.unsubscribe();
//   },
// }));

// // Hook to initialize auth in your layout/root component
// export const useInitializeAuth = () => {
//   const initialize = userAuthStore((state) => state.initialize);
  
//   useEffect(() => {
//     const unsubscribe = initialize();
//     return () => unsubscribe();
//   }, []);
// };
