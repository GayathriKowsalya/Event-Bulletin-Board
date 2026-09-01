"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createClient,
  Session,
  User,
} from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    signOut: async () => {},
  });

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        try {
          // =====================================================
          // DEMO ADMIN TOKEN
          // =====================================================

          const demoToken =
            localStorage.getItem(
              "demo_admin_token"
            );

          if (demoToken) {
            if (!mounted) return;

            setSession({
              access_token: demoToken,
            } as any);

            setUser({
              id: "demo-admin-id",
              email: "admin@123",
            } as any);

            setProfile({
              id: "demo-admin-id",
              role: "admin",
            });

            setLoading(false);
            return;
          }

          // =====================================================
          // SUPABASE SESSION
          // =====================================================

          const {
            data,
            error,
          } =
            await supabase.auth.getSession();

          if (error) {
            console.error(
              "[AUTH] Session error:",
              error
            );
          }

          if (!mounted) return;

          const currentSession =
            data.session;

          setSession(
            currentSession
          );

          setUser(
            currentSession?.user ||
              null
          );

          if (
            currentSession?.user
          ) {
            const {
              data: profileData,
              error: profileError,
            } = await supabase
              .from("profiles")
              .select("*")
              .eq(
                "id",
                currentSession.user.id
              )
              .maybeSingle();

            if (profileError) {
              console.error(
                "[AUTH] Profile fetch error:",
                profileError
              );
            }

            if (mounted) {
              setProfile(
                profileData || null
              );
            }
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error(
            "[AUTH] Initialization error:",
            error
          );

          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    initializeAuth();

    // ==========================================================
    // AUTH STATE CHANGES
    // ==========================================================

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          newSession
        ) => {
          if (
            localStorage.getItem(
              "demo_admin_token"
            )
          ) {
            return;
          }

          if (!mounted) return;

          setSession(
            newSession
          );

          setUser(
            newSession?.user ||
              null
          );

          if (newSession?.user) {
            try {
              const {
                data: profileData,
                error: profileError,
              } = await supabase
                .from("profiles")
                .select("*")
                .eq(
                  "id",
                  newSession.user.id
                )
                .maybeSingle();

              if (profileError) {
                console.error(
                  "[AUTH] Profile fetch error:",
                  profileError
                );
              }

              if (mounted) {
                setProfile(
                  profileData ||
                    null
                );
              }
            } catch (error) {
              console.error(
                "[AUTH] Profile error:",
                error
              );

              if (mounted) {
                setProfile(null);
              }
            }
          } else {
            setProfile(null);
          }

          if (mounted) {
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const signOut = async () => {
    console.log(
      "[AUTH] Logout"
    );

    try {
      // Remove demo admin session
      localStorage.removeItem(
        "demo_admin_token"
      );

      // Sign out from Supabase
      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "[AUTH] Logout error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "[AUTH] Logout exception:",
        error
      );
    } finally {
      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);

      // Always return to login page
      window.location.href =
        "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}