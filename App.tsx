
import React, { useState, useEffect, useRef } from 'react';
import { AppMode, Project } from './types.ts';
import { DatabaseService } from './services/dbService.ts';

// Layout & Hook Imports
import { useAppAuth } from './hooks/useAppAuth.ts';
import { useAppLogic } from './hooks/useAppLogic.ts';
import { usePaymentLogic } from './hooks/usePaymentLogic.ts';
import Header from './layout/Header.tsx';
import MobileNav from './layout/MobileNav.tsx';

// View Imports
import ScanPage from './biometric/ScanPage.tsx';
import AuthPage from './auth/AuthPage.tsx';
import AdminLoginPage from './auth/AdminLoginPage.tsx';
import AdminPanel from './admin/AdminPanel.tsx';
import ShopView from './shop/ShopView.tsx';
import ProfileView from './profile/ProfileView.tsx';
import DashboardView from './dashboard/DashboardView.tsx';
import ProjectsView from './projects/ProjectsView.tsx';
import GithubSettingsView from './settings/GithubSettingsView.tsx';
import LivePreviewView from './preview/LivePreviewView.tsx';

const App: React.FC = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [mode, setMode] = useState<AppMode>(AppMode.PREVIEW);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('preview');
  const [liveProject, setLiveProject] = useState<Project | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const navigateTo = (newPath: string, newMode?: AppMode) => {
    try { if (window.location.pathname !== newPath) window.history.pushState({}, '', newPath); } catch (e) {}
    setPath(newPath);
    if (newMode) setMode(newMode);
  };

  const { user, setUser, authLoading, showScan, setShowScan, handleLogout } = useAppAuth(navigateTo);
  const logic = useAppLogic(user, setUser);
  const payment = usePaymentLogic(user);
  const db = DatabaseService.getInstance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    if (path.startsWith('/preview/')) {
      const id = path.split('/').pop();
      if (id) {
        setLiveLoading(true);
        db.supabase.from('projects').select('*').eq('id', id).maybeSingle().then(({ data }) => {
          if (data) setLiveProject(data);
          setLiveLoading(false);
        });
      }
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [path]);

  if (path.startsWith('/preview/')) return <LivePreviewView project={liveProject} loading={liveLoading} onReturnToTerminal={() => navigateTo('/login')} />;
  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-[#09090b]"><div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div></div>;

  if (path === '/admin') {
    if (!user || !user.isAdmin) return <AdminLoginPage onLoginSuccess={(u) => { setUser(u); navigateTo('/admin', AppMode.ADMIN); }} />;
    return (
      <div className="h-[100dvh] flex flex-col text-slate-100 overflow-hidden">
        <Header user={user} path={path} mode={mode} navigateTo={navigateTo} />
        <AdminPanel user={user} onApprovePayment={payment.handleApprovePayment} onRejectPayment={payment.handleRejectPayment} />
        <MobileNav path={path} mode={mode} user={user} navigateTo={navigateTo} />
      </div>
    );
  }

  if (!user) return showScan ? <ScanPage onFinish={() => setShowScan(false)} /> : <AuthPage onLoginSuccess={(u) => { setUser(u); navigateTo('/profile', AppMode.PROFILE); }} />;

  return (
    <div className="h-[100dvh] flex flex-col text-slate-100 overflow-hidden">
      <Header user={user} path={path} mode={mode} navigateTo={navigateTo} />
      <main className="flex-1 flex overflow-hidden relative">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => payment.setPaymentForm(p => ({ ...p, screenshot: reader.result as string }));
            reader.readAsDataURL(file);
          }
        }} />
        {mode === AppMode.SETTINGS ? (
          <GithubSettingsView config={logic.githubConfig} onSave={(c) => { logic.setGithubConfig(c); db.updateGithubConfig(user.id, c); }} onBack={() => setMode(AppMode.PREVIEW)} onDisconnect={async () => {
            if (window.confirm("গিটহাব ডিসকানেক্ট করতে চান?")) {
              await db.unlinkGithubIdentity();
              const empty = { token: '', owner: '', repo: '' };
              logic.setGithubConfig(empty);
              db.updateGithubConfig(user.id, empty);
            }
          }} />
        ) : path === '/shop' ? (
          <ShopView {...payment} handlePaymentScreenshotUpload={() => fileInputRef.current?.click()} />
        ) : path === '/profile' ? (
          <ProfileView 
            user={user} userTransactions={payment.userTransactions} githubConfig={logic.githubConfig} navigateTo={navigateTo} handleLogout={handleLogout}
            oldPassword={""} setOldPassword={() => {}} newPass={""} setNewPass={() => {}} passError={""} isUpdatingPass={false} handlePasswordChange={() => {}} handleAvatarUpload={() => {}}
            onSaveGithubConfig={(c) => { logic.setGithubConfig(c); db.updateGithubConfig(user.id, c); }}
            clearGithubConfig={() => {}}
          />
        ) : path === '/projects' ? (
          <ProjectsView userId={user.id} currentFiles={logic.projectFiles} onLoadProject={(p) => { logic.loadProject(p); navigateTo('/dashboard', AppMode.PREVIEW); }} onSaveCurrent={(n) => db.saveProject(user.id, n, logic.projectFiles, logic.projectConfig)} onCreateNew={(n) => db.saveProject(user.id, n, { 'index.html': '<h1>' + n + '</h1>' }, { appName: n, packageName: 'com.' + n.toLowerCase() })} />
        ) : (
          <DashboardView 
            {...logic} mode={mode} setMode={setMode} mobileTab={mobileTab} setMobileTab={setMobileTab}
            handleBuildAPK={() => { logic.handleBuildAPK(() => navigateTo('/dashboard', AppMode.SETTINGS)); if (logic.githubConfig.token.length > 10) setMode(AppMode.EDIT); }} 
            projectId={logic.currentProjectId}
          />
        )}
      </main>
      <MobileNav path={path} mode={mode} user={user} navigateTo={navigateTo} />
    </div>
  );
};

export default App;
