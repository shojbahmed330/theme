
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
        const providerToken = session.provider_token;
        const identities = session.user.identities || [];
        const isGithubIdentity = identities.some((id: any) => id.provider === 'github');

        const currentUserId = user?.id || session.user.id;

        // If we have a GitHub token, try to fetch the username and update the full config
        if (providerToken && (session.user.app_metadata?.provider === 'github' || isGithubIdentity)) {
          try {
            const githubUserRes = await fetch('https://api.github.com/user', {
              headers: { 'Authorization': `token ${providerToken}` }
            });
            if (githubUserRes.ok) {
              const githubUserData = await githubUserRes.json();
              const username = githubUserData.login;
              
              // Save both token and owner to database
              await db.updateGithubConfig(currentUserId, {
                token: providerToken,
                owner: username,
                repo: user?.github_repo || '' // preserve existing repo if any
              });
            } else {
              // Fallback: just update token if profile fetch fails
              await db.updateGithubTokenOnly(currentUserId, providerToken);
            }
          } catch (e) {
            await db.updateGithubTokenOnly(currentUserId, providerToken);
          }
        }

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
  }, [user?.id]);

  const handleLogout = async () => { 
    try { await db.signOut(); } catch (e) {}
    setUser(null); 
    setShowScan(true); 
    navigateTo('/login', AppMode.PREVIEW); 
  };

  return { user, setUser, authLoading, setAuthLoading, showScan, setShowScan, handleLogout };
};
