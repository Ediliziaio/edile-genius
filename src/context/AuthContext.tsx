import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type AppRole = "superadmin" | "superadmin_user" | "company_admin" | "company_user";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isSuperAdmin: boolean;
  isCompanyUser: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }
      if (rolesRes.data) {
        setRoles(rolesRes.data.map((r: { role: string }) => r.role as AppRole));
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlock, but keep loading=true until data is ready
          setTimeout(async () => {
            await fetchUserData(newSession.user.id);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    // THEN check existing session — only set loading=false after roles are fetched
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        await fetchUserData(existingSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSuperAdmin = roles.includes("superadmin") || roles.includes("superadmin_user");
  const isCompanyUser = roles.includes("company_admin") || roles.includes("company_user");

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear(); // Evita che dati del vecchio utente appaiano al login successivo
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, isSuperAdmin, isCompanyUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
