
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Smartphone, Download, ArrowLeft, Loader2, SmartphoneNfc, ExternalLink, Link2 } from 'lucide-react';
import BuildConsole from './BuildConsole';
import { BuildStep } from '../../types';

interface BuildStatusDisplayProps {
  status: string;
  message: string;
  apkUrl?: string;
  webUrl?: string;
  buildSteps: BuildStep[];
  handleSecureDownload: () => void;
  resetBuild: () => void;
}

const BuildStatusDisplay: React.FC<BuildStatusDisplayProps> = ({
  status, message, apkUrl, webUrl, buildSteps, handleSecureDownload, resetBuild
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    
    if (status === 'success' && webUrl) {
      setQrGenerated(false);
      setError(null);

      const generateQR = () => {
        const QRCodeLib = (window as any).QRCode;
        const container = qrRef.current;

        if (QRCodeLib && container) {
          try {
            container.innerHTML = ''; // Clear previous content
            
            new QRCodeLib(container, {
              text: webUrl,
              width: 160,
              height: 160,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCodeLib.CorrectLevel.H
            });
            
            // The library adds an image or canvas. Check if something was added.
            if (container.children.length > 0) {
              setQrGenerated(true);
              return true;
            }
          } catch (err) {
            console.error("QR Error:", err);
            setError("QR Generation Failed");
          }
        }
        return false;
      };

      // Try immediately
      if (!generateQR()) {
        let attempts = 0;
        interval = setInterval(() => {
          attempts++;
          if (generateQR() || attempts > 20) {
            clearInterval(interval);
            if (attempts > 20 && !qrGenerated) {
                setError("Could not load QR library");
            }
          }
        }, 500);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, webUrl]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 overflow-y-auto bg-[#09090b]">
      <div className="glass-tech w-full max-w-2xl p-8 md:p-16 rounded-[3rem] text-center relative overflow-hidden border-pink-500/10 shadow-2xl">
        {status === 'success' ? (
          <div className="space-y-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-bounce">
              <CheckCircle2 size={40}/>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Build Complete</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Scan to get APK on your phone</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-6">
              {/* Enhanced QR Code Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative p-5 bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(236,72,153,0.3)] group transition-transform hover:scale-105 border-4 border-pink-500/20 flex items-center justify-center w-[200px] h-[200px]">
                  <div 
                    ref={qrRef} 
                    id="qrcode-container"
                    className={`rounded-xl overflow-hidden bg-white flex items-center justify-center ${!qrGenerated ? 'opacity-0' : 'opacity-100'}`}
                  >
                  </div>
                  
                  {!qrGenerated && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white rounded-[2.2rem]">
                      <Loader2 className="animate-spin text-pink-500" size={24}/>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Generating QR...</span>
                    </div>
                  )}

                  {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white rounded-[2.2rem] p-4">
                       <Link2 className="text-pink-500" size={24}/>
                       <span className="text-[8px] font-bold text-red-500 uppercase text-center">{error}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                    <SmartphoneNfc size={12}/> Scan with Camera
                  </span>
                  <span className="text-[8px] text-zinc-600 uppercase font-bold">Installs APK Directly</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 w-full md:w-64">
                <button 
                  onClick={handleSecureDownload} 
                  className="w-full flex items-center justify-center gap-3 py-6 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white rounded-3xl font-black uppercase text-xs shadow-2xl shadow-pink-600/30 transition-all active:scale-95 group"
                >
                  <Download size={20} className="group-hover:animate-bounce"/> Download ZIP
                </button>
                
                {webUrl && (
                  <button 
                    onClick={() => window.open(webUrl, '_blank')}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] transition-all"
                  >
                    <ExternalLink size={16}/> Direct Link
                  </button>
                )}
                
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold leading-relaxed">
                    Build artifacts are on GitHub. Scan the code to access them on your smartphone instantly.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={resetBuild} 
              className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors border-t border-white/5 pt-6 w-full justify-center"
            >
              <ArrowLeft size={14}/> Back to Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Smartphone size={60} className="text-pink-500 relative z-10 mx-auto animate-[pulse_2s_infinite]"/>
            </div>
            
            <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                {status === 'pushing' ? 'Syncing Code' : 'APK Compilation'}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></div>
                <p className="text-pink-400/70 font-mono text-[10px] uppercase tracking-[0.4em] font-black">
                  {status === 'pushing' ? message : 'Compiling Android App...'}
                </p>
              </div>
            </div>
            
            <BuildConsole buildSteps={buildSteps} />
            
            <button 
              onClick={resetBuild} 
              className="mt-6 text-[10px] font-black uppercase text-zinc-700 hover:text-red-500 transition-colors tracking-[0.2em] border border-white/5 px-6 py-3 rounded-xl hover:bg-white/5"
            >
              Terminate Build Process
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildStatusDisplay;
