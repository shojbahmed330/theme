
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';
import { AppMode, Package, Transaction, Project } from './types.ts';
import { DatabaseService } from './services/dbService.ts';
import { buildFinalHtml } from './utils/previewBuilder.ts';

// Layout & Hook Imports
import { useAppAuth } from './hooks/useAppAuth.ts';
import { useAppLogic } from './hooks/useAppLogic.ts';
import Header from './layout/Header.tsx';
import MobileNav from './layout/MobileNav.tsx';

// View Imports
import ScanPage from './biometric/ScanPage.tsx';
import AuthPage from './auth/AuthPage.tsx';
import AdminLoginPage from './auth/AdminLoginPage.tsx'; // Import Admin Login
import AdminPanel from './admin/AdminPanel.tsx';
import ShopView from './shop/ShopView.tsx';
import ProfileView from './profile/ProfileView.tsx';
import DashboardView from './dashboard/DashboardView.tsx';
import ProjectsView from './projects/ProjectsView.tsx';
import GithubSettingsView from './settings/GithubSettingsView.tsx';

const App: React.FC = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [mode, setMode] = useState<AppMode>(AppMode.PREVIEW);
  const [showFailsafe, setShowFailsafe] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('preview');
  const [liveProject, setLiveProject] = useState<Project | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

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
    selectedImage, setSelectedImage, handleImageSelect, projectConfig, setProjectConfig, loadProject,
    currentProjectId
  } = useAppLogic(user, setUser);

  const db = DatabaseService.getInstance();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    
    // Check if we are in live preview mode
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

  // LIVE PREVIEW UI (Public)
  if (path.startsWith('/preview/') && (liveProject || liveLoading)) {
    return (
      <div className="h-[100dvh] w-full bg-[#09090b] flex flex-col">
        {liveLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-pink-500" size={40}/>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Initializing Uplink...</p>
          </div>
        ) : liveProject ? (
          <div className="flex-1 w-full relative h-full">
            <iframe 
              srcDoc={buildFinalHtml(liveProject.files)} 
              className="w-full h-full border-none"
              title="live-preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
            {/* Control Overlay */}
            <div className="fixed bottom-10 right-10 flex flex-col gap-4">
               <button onClick={() => window.location.reload()} className="p-4 bg-pink-600 text-white rounded-2xl shadow-2xl active:scale-90 transition-all">
                 <RefreshCw size={20}/>
               </button>
               <button onClick={() => navigateTo('/login')} className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl active:scale-90 transition-all">
                 <Smartphone size={20}/>
               </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center">
            <h1 className="text-2xl font-black text-white uppercase">Project Offline</h1>
            <p className="text-zinc-600 text-xs uppercase font-bold">The developer has not authorized this uplink or it has been terminated.</p>
            <button onClick={() => navigateTo('/login')} className="mt-6 px-10 py-4 bg-pink-600 rounded-2xl font-black uppercase text-[10px]">Return to Terminal</button>
          </div>
        )}
      </div>
    );
  }

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

  useEffect(() => {
    db.getPackages().then(setPackages);
    if (user) db.getUserTransactions(user.id).then(setUserTransactions);
  }, [user]);

  const handleSaveGithubConfig = async (config: any) => {
    setGithubConfig(config);
    if (user) await db.updateGithubConfig(user.id, config);
  };

  const handleClearGithubConfig = async () => {
    if (!user) return;
    if (!window.confirm("আপনি কি নিশ্চিতভাবে গিটহাব ডিসকানেক্ট করতে চান?")) return;
    
    const emptyConfig = { token: '', owner: '', repo: '' };
    setGithubConfig(emptyConfig);
    await db.updateGithubConfig(user.id, emptyConfig);
    alert("GitHub Disconnected Successfully.");
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
        const pkg = packages.find(p => p.id === tx.package_id);
        if (pkg) {
            await db.addUserTokens(tx.user_id, pkg.tokens);
            alert("Payment Approved! Tokens added.");
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
      await db.updatePassword(newPass); alert("Password updated!");
      setOldPassword(''); setNewPass('');
    } catch (e: any) { alert(e.message); } finally { setIsUpdatingPass(false); }
  };

  if (authLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-indigo-500 gap-8">
      <Loader2 className="animate-spin text-pink-500" size={50}/>
    </div>
  );

  // ADMIN PATH HANDLING
  if (path === '/admin') {
    if (!user || !user.isAdmin) {
      return <AdminLoginPage onLoginSuccess={(u) => { setUser(u); navigateTo('/admin', AppMode.ADMIN); }} />;
    }
    return (
      <div className="h-[100dvh] flex flex-col text-slate-100 overflow-hidden">
        <Header user={user} path={path} mode={mode} navigateTo={navigateTo} />
        <AdminPanel 
          user={user} 
          onApprovePayment={handleApprovePayment} 
          onRejectPayment={handleRejectPayment}
        />
        <MobileNav path={path} mode={mode} user={user} navigateTo={navigateTo} />
      </div>
    );
  }

  // STANDARD USER HANDLING
  if (!user) {
    if (showScan) return <ScanPage onFinish={() => setShowScan(false)} />;
    return <AuthPage onLoginSuccess={(u) => { setUser(u); navigateTo('/profile', AppMode.PROFILE); }} />;
  }

  return (
    <div className="h-[100dvh] flex flex-col text-slate-100 overflow-hidden">
      <Header user={user} path={path} mode={mode} navigateTo={navigateTo} />
      
      <main className="flex-1 flex overflow-hidden relative">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onScreenshotFileChange} />
        
        {mode === AppMode.SETTINGS ? (
          <GithubSettingsView 
            config={githubConfig}
            onSave={handleSaveGithubConfig}
            onBack={() => setMode(AppMode.PREVIEW)}
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
            onSaveGithubConfig={handleSaveGithubConfig} clearGithubConfig={handleClearGithubConfig}
          />
        ) : path === '/projects' ? (
          <ProjectsView 
            userId={user.id} currentFiles={projectFiles}
            onLoadProject={(p) => { loadProject(p); navigateTo('/dashboard', AppMode.PREVIEW); }}
            onSaveCurrent={(name) => db.saveProject(user.id, name, projectFiles, projectConfig)}
            onCreateNew={(name) => {
              const defaultFiles = { 'index.html': '<h1>' + name + '</h1>' };
              return db.saveProject(user.id, name, defaultFiles, { appName: name, packageName: 'com.' + name.toLowerCase() });
            }}
          />
        ) : (
          <DashboardView 
            mode={mode} setMode={setMode} messages={messages} input={input} setInput={setInput}
            isGenerating={isGenerating} projectFiles={projectFiles} setProjectFiles={setProjectFiles}
            selectedFile={selectedFile} setSelectedFile={setSelectedFile} buildStatus={buildStatus}
            setBuildStatus={setBuildStatus} buildSteps={buildSteps} mobileTab={mobileTab} setMobileTab={setMobileTab}
            handleSend={handleSend} 
            handleBuildAPK={() => {
              handleBuildAPK(() => navigateTo('/dashboard', AppMode.SETTINGS));
              // Switch to EDIT mode to see the console if configuration is valid
              if (githubConfig.token && githubConfig.token.length > 10) {
                setMode(AppMode.EDIT);
              }
            }} 
            handleSecureDownload={handleSecureDownload} isDownloading={isDownloading}
            selectedImage={selectedImage} setSelectedImage={setSelectedImage}
            handleImageSelect={handleImageSelect}
            projectConfig={projectConfig} setProjectConfig={setProjectConfig}
            projectId={currentProjectId}
          />
        )}
      </main>

      <MobileNav path={path} mode={mode} user={user} navigateTo={navigateTo} />
    </div>
  );
};

export default App;
