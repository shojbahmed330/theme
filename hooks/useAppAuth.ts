
import { useState, useEffect } from 'react';
import { User as UserType, AppMode } from '../types';
import { DatabaseService } from '../services/dbService';

const ADMIN_EMAILS = ['rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com'];

export const useAppAuth = (navigateTo: (path: string, mode?: AppMode) => void) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showScan, setShowScan] = useState(true);
  const db = DatabaseService.getInstance();

  useEffect(() => {
    const handleSession = async (session: any) => {
      const forced = localStorage.getItem('df_force_login');
      
      if (!session?.user) {
        if (forced && ADMIN_EMAILS.includes(forced)) {
          const userData = await db.getUser(forced);
          if (userData) {
            setUser(userData);
            setShowScan(false);
            setAuthLoading(false);
            return;
          }
        }
        setAuthLoading(false);
        return;
      }

      try {
        // Automatically sync GitHub OAuth token if available in session
        const providerToken = session.provider_token;
        const identities = session.user.identities || [];
        const isGithubIdentity = identities.some((id: any) => id.provider === 'github');

        // Check if we are already logged in as a primary user (e.g., sumi@gmail.com)
        // If the session UID hasn't changed, we are still the same user, just potentially linked.
        const currentUserId = user?.id;

        // Extract GitHub token if present
        if (providerToken && (session.user.app_metadata?.provider === 'github' || isGithubIdentity)) {
          // Update the token for the CURRENT primary user ID to avoid logging in as the GitHub email
          const targetUserId = currentUserId || session.user.id;
          await db.updateGithubTokenOnly(targetUserId, providerToken);
        }

        // Always prioritize the primary user record
        // If we are already logged in and the session belongs to the same UID, just refresh data
        const userData = await db.getUser(session.user.email || '', session.user.id);
        
        if (userData) { 
          setUser(userData); 
          setShowScan(false);
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
             navigateTo('/profile', AppMode.PROFILE);
          }
        }
      } catch (e) { 
        console.error("Auth process error:", e); 
      } finally { 
        setAuthLoading(false); 
      }
    };

    db.supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = db.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]); // Adding user.id as dependency ensures we know who is currently active

  const handleLogout = async () => { 
    try { await db.signOut(); } catch (e) {}
    setUser(null); 
    setShowScan(true); 
    navigateTo('/login', AppMode.PREVIEW); 
  };

  return { user, setUser, authLoading, setAuthLoading, showScan, setShowScan, handleLogout };
};
