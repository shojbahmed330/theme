
import { useState, useRef } from 'react';
import { GithubConfig, BuildStep, User as UserType } from '../types';
import { GeminiService } from '../services/geminiService';
import { DatabaseService } from '../services/dbService';
import { GithubService } from '../services/githubService';

export const useAppLogic = (user: UserType | null, setUser: (u: UserType | null) => void) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    'index.html': '<div style="background:#09090b; color:#f4f4f5; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding: 20px;"><h1>OneClick Studio</h1></div>'
  });
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [githubConfig, setGithubConfig] = useState<GithubConfig>({ 
    token: user?.github_token || '', 
    repo: user?.github_repo || '', 
    owner: user?.github_owner || '' 
  });
  const [buildStatus, setBuildStatus] = useState<{ status: 'idle' | 'pushing' | 'building' | 'success' | 'error', message: string, apkUrl?: string, webUrl?: string }>({ status: 'idle', message: '' });
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const gemini = useRef(new GeminiService());
  const db = DatabaseService.getInstance();
  const github = useRef(new GithubService());

  const handleSend = async (extraData?: string) => {
    if ((!input.trim() && !selectedImage && !extraData) || isGenerating) return;
    const text = extraData || input; 
    const currentImage = selectedImage;

    // If answers are provided, update the last assistant message to show the summary instead of questions
    if (extraData) {
      setMessages(prev => {
        const lastAsstIdx = [...prev].reverse().findIndex(m => m.role === 'assistant' && m.questions);
        if (lastAsstIdx !== -1) {
          const actualIdx = prev.length - 1 - lastAsstIdx;
          const updated = [...prev];
          updated[actualIdx] = { ...updated[actualIdx], answersSummary: extraData };
          return updated;
        }
        return prev;
      });
    } else {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'user', 
        content: text, 
        image: currentImage?.preview,
        timestamp: Date.now() 
      }]);
      setInput(''); 
      setSelectedImage(null);
    }

    setIsGenerating(true);
    
    try {
      const res = await gemini.current.generateWebsite(text, projectFiles, messages, currentImage ? { data: currentImage.data, mimeType: currentImage.mimeType } : undefined);
      if (res.files) setProjectFiles(prev => ({ ...prev, ...res.files }));
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: res.answer, 
        timestamp: Date.now(),
        questions: res.questions,
        thought: res.thought,
        files: res.files 
      }]);

      if (user) { 
        const updated = await db.useToken(user.id, user.email); 
        if (updated) setUser(updated); 
      }
    } catch (e) { 
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Error during generation process." }]); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({
        data: base64String,
        mimeType: file.type,
        preview: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleBuildAPK = async (navigateToProfile: () => void) => {
    if (!githubConfig.token || !githubConfig.repo || !githubConfig.owner) { 
      navigateToProfile(); 
      return; 
    }
    setBuildSteps([]); // Reset steps at the start of a new build
    setBuildStatus({ status: 'pushing', message: 'Syncing project...' });
    try {
      await github.current.pushToGithub(githubConfig, projectFiles);
      setBuildStatus({ status: 'building', message: 'Compiling Android Binary...' });
      
      const checkInterval = setInterval(async () => {
        const runDetails = await github.current.getRunDetails(githubConfig);
        
        // Update live steps in real-time
        if (runDetails?.jobs?.[0]?.steps) {
          setBuildSteps(runDetails.jobs[0].steps);
        }

        if (runDetails?.jobs?.[0]?.status === 'completed') {
          clearInterval(checkInterval);
          const details = await github.current.getLatestApk(githubConfig);
          if (details) {
            setBuildStatus({ 
              status: 'success', 
              message: 'Done!', 
              apkUrl: details.downloadUrl, 
              webUrl: details.webUrl 
            });
          } else {
            setBuildStatus({ status: 'error', message: 'Build completed but artifact not found.' });
          }
        } else if (runDetails?.jobs?.[0]?.conclusion === 'failure') {
          clearInterval(checkInterval);
          setBuildStatus({ status: 'error', message: 'Build process failed on GitHub side.' });
        }
      }, 5000);
    } catch (e: any) { 
      setBuildStatus({ status: 'error', message: e.message || "Build failed." }); 
    }
  };

  const handleSecureDownload = async () => {
    if (!buildStatus.apkUrl) return;
    setIsDownloading(true);
    try {
      const blob = await github.current.downloadArtifact(githubConfig, buildStatus.apkUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${githubConfig.repo}-build.zip`;
      document.body.appendChild(a); a.click();
    } catch (e: any) { 
      alert(e.message); 
    } finally { 
      setIsDownloading(false); 
    }
  };

  return {
    messages, setMessages, input, setInput, isGenerating, projectFiles, setProjectFiles,
    selectedFile, setSelectedFile, githubConfig, setGithubConfig, buildStatus, setBuildStatus,
    buildSteps, setBuildSteps, isDownloading, handleSend, handleBuildAPK, handleSecureDownload,
    selectedImage, setSelectedImage, handleImageSelect
  };
};
