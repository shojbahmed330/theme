
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { AppMode, Package, Transaction, Project } from './types.ts';
import { DatabaseService } from './services/dbService.ts';

// Layout & Hook Imports
import { useAppAuth } from './hooks/useAppAuth.ts';
import { useAppLogic } from './hooks/useAppLogic.ts';
import Header from './layout/Header.tsx';
import MobileNav from './layout/MobileNav.tsx';

// View Imports
import ScanPage from './biometric/ScanPage.tsx';
import AuthPage from './auth/AuthPage.tsx';
import AdminPanel from './admin/AdminPanel.tsx';
import ShopView from './shop/ShopView.tsx';
import ProfileView from './profile/ProfileView.tsx';
import DashboardView from './dashboard/DashboardView.tsx';
import ProjectsView from './projects/ProjectsView.tsx';

const App: React.FC = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [mode, setMode] = useState<AppMode>(AppMode.PREVIEW);
  const [showFailsafe, setShowFailsafe] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('preview');

  const navigateTo = (newPath: string, newMode?: AppMode) => {
    try { if (window.location.pathname !== newPath) window.history.pushState({}, '', newPath); } catch (e) {}
    setPath(newPath);
    if (newMode) setMode(newMode);
  };

  const { user, setUser, authLoading, setAuthLoading, showScan, setShowScan, handleLogout } = useAppAuth(navigateTo);
  
  const { 
    messages, input, setInput, isGenerating, projectFiles, setProjectFiles,
    selectedFile, setSelectedFile, githubConfig, setGithubConfig, buildStatus, setBuildStatus,
    buildSteps, setBuildSteps, isDownloading, handleSend, handleBuildAPK, handleSecureDownload,
    selectedImage, setSelectedImage, handleImageSelect, projectConfig, setProjectConfig, loadProject
  } = useAppLogic(user, setUser);

  const [packages, setPackages] = useState<Package[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'form' | 'success' | 'idle'>('idle');
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | null>(null);
  const [paymentForm, setPaymentForm] = useState({ trxId: '', screenshot: '', message: '' });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const db = DatabaseService.getInstance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    const failsafeShowTimer = setTimeout(() => setShowFailsafe(true), 4000);
    const forceStopTimer = setTimeout(() => setAuthLoading(false), 8500);

    db.getPackages().then(setPackages);
    if (user) db.getUserTransactions(user.id).then(setUserTransactions);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(failsafeShowTimer);
      clearTimeout(forceStopTimer);
    };
  }, [user]);

  const handleSaveGithubConfig = async (config: any) => {
    setGithubConfig(config);
    if (user) await db.updateGithubConfig(user.id, config);
    alert("GitHub Configuration Synced!");
  };

  const handlePaymentScreenshotUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentForm(prev => ({ ...prev, screenshot: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPkg || !paymentMethod || !paymentForm.trxId || !user) {
        alert("সবগুলো তথ্য সঠিকভাবে পূরণ করুন।");
        return;
    }
    setPaymentSubmitting(true);
    try {
      const success = await db.submitPaymentRequest(user.id, selectedPkg.id, selectedPkg.price, paymentMethod, paymentForm.trxId, paymentForm.screenshot, paymentForm.message);
      if (success) { 
        setPaymentStep('success'); 
        setPaymentForm({ trxId: '', screenshot: '', message: '' }); 
        db.getUserTransactions(user.id).then(setUserTransactions);
      }
    } catch (e: any) { alert(e.message || "Payment request failed."); } finally { setPaymentSubmitting(false); }
  };

  const handleApprovePayment = async (txId: string) => {
    try {
        const tx = await db.updateTransactionStatus(txId, 'completed');
        // Find package to get token count
        const pkg = packages.find(p => p.id === tx.package_id);
        if (pkg) {
            await db.addUserTokens(tx.user_id, pkg.tokens);
            alert("Payment Approved! Tokens added to user account.");
        }
    } catch (e: any) { alert(e.message); }
  };

  const handleRejectPayment = async (txId: string) => {
    try {
        await db.updateTransactionStatus(txId, 'rejected');
        alert("Payment Rejected.");
    } catch (e: any) { alert(e.message); }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPass || !user) { alert('Please fill all fields'); return; }
    setIsUpdatingPass(true);
    try {
      const { error } = await db.supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
      if (error) { alert('Old password incorrect.'); return; }
      await db.updatePassword(newPass); alert("Password updated successfully!");
      setOldPassword(''); setNewPass('');
    } catch (e: any) { alert(e.message || "Failed to update password"); } finally { setIsUpdatingPass(false); }
  };

  if (authLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-indigo-500 gap-8">
      <Loader2 className="animate-spin text-pink-500" size={50}/>
      {showFailsafe && (
        <button onClick={() => { setAuthLoading(false); navigateTo('/login'); }} className="mt-6 flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-pink-500 transition-all">
          <ArrowLeft size={14}/> Back to Login Terminal
        </button>
      )}
    </div>
  );

  if (!user) {
    if (showScan) return <ScanPage onFinish={() => setShowScan(false)} />;
    return <AuthPage onLoginSuccess={(u) => { setUser(u); navigateTo('/profile', AppMode.PROFILE); }} />;
  }

  return (
    <div className="h-[100dvh] flex flex-col text-slate-100 overflow-hidden">
      <Header user={user} path={path} mode={mode} navigateTo={navigateTo} />
      
      <main className="flex-1 flex overflow-hidden relative">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={onScreenshotFileChange} 
        />
        
        {path === '/admin' && user.isAdmin ? (
          <AdminPanel 
            user={user} 
            onApprovePayment={handleApprovePayment} 
            onRejectPayment={handleRejectPayment}
          />
        ) : path === '/shop' ? (
          <ShopView 
            packages={packages} paymentStep={paymentStep} setPaymentStep={setPaymentStep}
            selectedPkg={selectedPkg} setSelectedPkg={setSelectedPkg} paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod} paymentForm={paymentForm} setPaymentForm={setPaymentForm}
            paymentSubmitting={paymentSubmitting} handlePaymentSubmit={handlePaymentSubmit}
            handlePaymentScreenshotUpload={handlePaymentScreenshotUpload} 
          />
        ) : path === '/profile' ? (
          <ProfileView 
            user={user} userTransactions={userTransactions} oldPassword={oldPassword}
            setOldPassword={setOldPassword} newPass={newPass} setNewPass={setNewPass}
            passError={""} isUpdatingPass={isUpdatingPass} handlePasswordChange={handlePasswordChange}
            handleLogout={handleLogout} handleAvatarUpload={() => {}} githubConfig={githubConfig}
            onSaveGithubConfig={handleSaveGithubConfig} clearGithubConfig={() => {}}
          />
        ) : path === '/projects' ? (
          <ProjectsView 
            userId={user.id} currentFiles={projectFiles}
            onLoadProject={(p) => { 
              loadProject(p);
              navigateTo('/dashboard', AppMode.PREVIEW); 
            }}
            onSaveCurrent={(name) => db.saveProject(user.id, name, projectFiles, projectConfig)}
            onCreateNew={(name) => {
              const defaultFiles = { 'index.html': '<div style="background:#09090b; color:#f4f4f5; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding: 20px;"><h1>' + name + '</h1></div>' };
              const defaultConfig = { appName: name, packageName: 'com.' + name.toLowerCase().replace(/\s+/g, '.') };
              return db.saveProject(user.id, name, defaultFiles, defaultConfig);
            }}
          />
        ) : (
          <DashboardView 
            mode={mode} setMode={setMode} messages={messages} input={input} setInput={setInput}
            isGenerating={isGenerating} projectFiles={projectFiles} setProjectFiles={setProjectFiles}
            selectedFile={selectedFile} setSelectedFile={setSelectedFile} buildStatus={buildStatus}
            setBuildStatus={setBuildStatus} buildSteps={buildSteps} mobileTab={mobileTab} setMobileTab={setMobileTab}
            handleSend={handleSend} handleBuildAPK={() => handleBuildAPK(() => navigateTo('/profile', AppMode.PROFILE))} 
            handleSecureDownload={handleSecureDownload} isDownloading={isDownloading}
            selectedImage={selectedImage} setSelectedImage={setSelectedImage}
            handleImageSelect={handleImageSelect}
            projectConfig={projectConfig} setProjectConfig={setProjectConfig}
          />
        )}
      </main>

      <MobileNav path={path} mode={mode} user={user} navigateTo={navigateTo} />
    </div>
  );
};

export default App;
