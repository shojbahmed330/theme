
import { useState, useRef, useEffect } from 'react';
import { GithubConfig, BuildStep, User as UserType, ProjectConfig, Project, ChatMessage } from '../types';
import { GeminiService } from '../services/geminiService';
import { DatabaseService } from '../services/dbService';
import { GithubService } from '../services/githubService';

export const useAppLogic = (user: UserType | null, setUser: (u: UserType | null) => void) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(localStorage.getItem('active_project_id'));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    'index.html': '<div style="background:#09090b; color:#f4f4f5; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding: 20px;"><h1>OneClick Studio</h1><p>Ready for Full-Stack Engineering.</p></div>'
  });
  
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({
    appName: 'OneClickApp',
    packageName: 'com.oneclick.studio',
    dbConfig: { provider: 'none' }
  });

  const [selectedFile, setSelectedFile] = useState('index.html');
  const [githubConfig, setGithubConfig] = useState<GithubConfig>({ 
    token: '', 
    repo: '', 
    owner: '' 
  });

  const gemini = useRef(new GeminiService());
  const db = DatabaseService.getInstance();
  const github = useRef(new GithubService());

  useEffect(() => {
    if (user && currentProjectId) {
      db.getProjectById(currentProjectId).then(p => {
        if (p) {
          setProjectFiles(p.files || {});
          if (p.config) setProjectConfig(p.config);
          if (p.files && p.files['index.html']) setSelectedFile('index.html');
          else if (p.files) setSelectedFile(Object.keys(p.files)[0]);
        }
      });
    }
  }, [user, currentProjectId]);

  const handleSend = async (extraData?: string) => {
    if ((!input.trim() && !selectedImage && !extraData) || isGenerating) return;
    
    if (user && user.tokens <= 0 && !user.isAdmin) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "আপনার টোকেন শেষ হয়ে গেছে। দয়া করে শপ থেকে টোকেন সংগ্রহ করুন।", 
        timestamp: Date.now() 
      }]);
      return;
    }

    const text = extraData || input; 
    const currentImage = selectedImage;

    let updatedMessages: ChatMessage[] = [];

    if (extraData) {
      setMessages(prev => {
        const lastAsstIdx = [...prev].reverse().findIndex(m => m.role === 'assistant' && m.questions);
        if (lastAsstIdx !== -1) {
          const actualIdx = prev.length - 1 - lastAsstIdx;
          const updated = [...prev];
          updated[actualIdx] = { ...updated[actualIdx], answersSummary: extraData };
          updatedMessages = updated;
          return updated;
        }
        return prev;
      });
    } else {
      const newUserMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: text, 
        image: currentImage?.preview,
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, newUserMsg]);
      updatedMessages = [...messages, newUserMsg];
      setInput(''); 
      setSelectedImage(null);
    }

    setIsGenerating(true);
    try {
      const res = await gemini.current.generateWebsite(
        text, 
        projectFiles, 
        updatedMessages, 
        currentImage ? { data: currentImage.data, mimeType: currentImage.mimeType } : undefined, 
        projectConfig.dbConfig, 
        false
      );

      const hasNewFiles = res.files && Object.keys(res.files).length > 0;
      
      if (hasNewFiles) {
        const newFiles = { ...projectFiles, ...res.files };
        setProjectFiles(newFiles);
        if (user && currentProjectId) {
          await db.updateProject(user.id, currentProjectId, newFiles, projectConfig);
        }
        
        if (user) { 
          const updatedUser = await db.useToken(user.id, user.email); 
          if (updatedUser) setUser(updatedUser); 
        }
      }

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: res.answer, 
        timestamp: Date.now(),
        questions: res.questions,
        thought: res.thought,
        files: res.files 
      }]);

    } catch (e: any) { 
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Neural Error: ${e.message}`, timestamp: Date.now() }]); 
    } finally { setIsGenerating(false); }
  };

  const handleBuildAPK = async (navigateToProfile: () => void) => {
    if (!githubConfig.token || githubConfig.token.length < 10) { navigateToProfile(); return; }
  };

  const loadProject = (p: Project) => {
    if (!p) return;
    setCurrentProjectId(p.id);
    localStorage.setItem('active_project_id', p.id);
    setProjectFiles(p.files || {});
    if (p.config) setProjectConfig(p.config);
    if (p.files && p.files['index.html']) setSelectedFile('index.html');
    else if (p.files) setSelectedFile(Object.keys(p.files)[0]);
  };

  return {
    messages, setMessages, input, setInput, isGenerating, projectFiles, setProjectFiles,
    selectedFile, setSelectedFile, githubConfig, setGithubConfig, 
    buildStatus: { status: 'idle', message: '' }, setBuildStatus: () => {},
    buildSteps: [], setBuildSteps: () => {}, isDownloading: false,
    handleSend, handleBuildAPK, handleSecureDownload: async () => {},
    selectedImage, setSelectedImage, handleImageSelect: () => {}, 
    projectConfig, setProjectConfig: () => {}, currentProjectId, loadProject
  };
};
