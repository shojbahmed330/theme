
import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Terminal, Download, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    // Generate QR Code only when status is success and webUrl exists
    if (status === 'success' && webUrl) {
      // Use a small timeout to ensure DOM is fully ready
      const timer = setTimeout(() => {
        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          const QRCodeLib = (window as any).QRCode;
          if (QRCodeLib) {
            try {
              new QRCodeLib(qrRef.current, {
                text: webUrl,
                width: 160,
                height: 160,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCodeLib.CorrectLevel.H
              });
            } catch (err) {
              console.error("QR Code Generation Error:", err);
            }
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
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
                <div className="p-5 bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(236,72,153,0.3)] group transition-transform hover:scale-105 border-4 border-pink-500/20">
                  <div ref={qrRef} className="rounded-xl overflow-hidden min-w-[160px] min-h-[160px] flex items-center justify-center bg-white">
                    {!webUrl && <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent animate-spin rounded-full"></div>}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Scan with Camera</span>
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
                
                <p className="text-[9px] text-zinc-600 uppercase font-bold leading-relaxed px-4">
                  GitHub access needed for manual download. QR code works with phone camera.
                </p>
              </div>
            </div>

            <button 
              onClick={resetBuild} 
              className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors border-t border-white/5 pt-6 w-full justify-center"
            >
              <ArrowLeft size={14}/> Back to Terminal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Terminal size={60} className="text-pink-500 relative z-10 mx-auto"/>
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                {status === 'pushing' ? 'Syncing Repository' : 'Cloud Compilation'}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></div>
                <p className="text-pink-400/70 font-mono text-[10px] uppercase tracking-widest">{message}</p>
              </div>
            </div>
            
            <BuildConsole steps={buildSteps} />
            
            <button 
              onClick={resetBuild} 
              className="mt-6 text-[10px] font-black uppercase text-zinc-700 hover:text-red-500 transition-colors tracking-[0.2em]"
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
