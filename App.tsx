
import React, { useState, useRef, useCallback } from 'react';
import { MediaFile, AnalysisResult } from './types';
import FileUploader from './components/FileUploader';
import ResultsPanel from './components/ResultsPanel';
import { analyzeMediaArtifacts } from './services/geminiService';

const App: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMediaUpload = useCallback(async (media: MediaFile) => {
    setSelectedMedia(media);
    setAnalysisResult(null);
    setError(null);
  }, []);

  const extractFrameAndAnalyze = async () => {
    if (!selectedMedia) return;
    setLoading(true);
    setScanning(true);
    setError(null);

    try {
      let base64Data = '';
      let mimeType = selectedMedia.file.type;

      if (selectedMedia.type === 'video') {
        // If it's a video, we grab a frame from the middle
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
          // Temporarily set time to middle of video for analysis
          const duration = video.duration || 0;
          video.currentTime = duration / 2;
          
          await new Promise((resolve) => {
            video.onseeked = resolve;
          });

          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);
          
          base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          mimeType = 'image/jpeg';
        }
      } else {
        // Simple image read
        const reader = new FileReader();
        const readPromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        reader.readAsDataURL(selectedMedia.file);
        base64Data = await readPromise;
      }

      const result = await analyzeMediaArtifacts(base64Data, mimeType);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const reset = () => {
    setSelectedMedia(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen relative pb-20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-grid"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-900 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5 py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-fingerprint text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">VERI<span className="text-blue-500">MEDIA</span> AI</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Integrity Protocol v2.5</p>
          </div>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-blue-400 transition-colors">API Keys</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Ethical AI</a>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20">
          Connect Identity
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-12 relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
            Verify Reality. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Expose Deception.</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Our neural-powered artifact detector scans for sub-pixel inconsistencies, lighting anomalies, and anatomical discrepancies that give away deepfake media.
          </p>
        </div>

        {/* Upload & Preview Section */}
        {!analysisResult && !loading && !selectedMedia && (
          <div className="animate-slideUp">
            <FileUploader onFileSelected={handleMediaUpload} isLoading={loading} />
          </div>
        )}

        {selectedMedia && !analysisResult && (
          <div className="animate-fadeIn max-w-4xl mx-auto bg-gray-900/40 rounded-3xl p-8 border border-white/5 backdrop-blur-xl relative overflow-hidden">
            {scanning && <div className="absolute inset-0 z-10 scan-line pointer-events-none"></div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">
                {selectedMedia.type === 'video' ? (
                  <video 
                    ref={videoRef}
                    src={selectedMedia.previewUrl} 
                    className="w-full h-full object-contain" 
                    controls 
                  />
                ) : (
                  <img src={selectedMedia.previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                  <h4 className="text-blue-400 font-bold mb-1 flex items-center gap-2">
                    <i className="fas fa-file-signature"></i> File Integrity
                  </h4>
                  <p className="text-xs text-gray-500 break-all font-mono mb-2">{selectedMedia.file.name}</p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Format: <span className="text-gray-200">{selectedMedia.file.type}</span></span>
                    <span>Size: <span className="text-gray-200">{(selectedMedia.file.size / (1024 * 1024)).toFixed(2)} MB</span></span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={extractFrameAndAnalyze}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <><i className="fas fa-circle-notch fa-spin"></i> Analyzing...</>
                    ) : (
                      <><i className="fas fa-search"></i> Run Neural Scan</>
                    )}
                  </button>
                  <button 
                    onClick={reset}
                    disabled={loading}
                    className="px-6 border border-white/10 hover:bg-white/5 rounded-xl transition-all disabled:opacity-50"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {analysisResult && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-2xl font-black text-white">Scan Diagnostics</h3>
              <button 
                onClick={reset}
                className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg transition-colors"
              >
                <i className="fas fa-redo"></i> Scan New Media
              </button>
            </div>
            <ResultsPanel result={analysisResult} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-4 animate-shake">
            <i className="fas fa-exclamation-triangle text-xl"></i>
            <div>
              <p className="font-bold">Neural Engine Error</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto hover:text-white transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Informational Cards */}
        {!analysisResult && !loading && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] transition-all cursor-default group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-eye text-blue-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Neural Observation</h4>
              <p className="text-sm text-gray-500">Detecting subconscious facial cues, blinking patterns, and gaze anomalies that humans miss.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] transition-all cursor-default group">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-layer-group text-indigo-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Spectral Analysis</h4>
              <p className="text-sm text-gray-500">Scanning for GAN artifacts, frequency domain discrepancies, and pixel-level generation signatures.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] transition-all cursor-default group">
              <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-vial text-teal-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Deep Consistency</h4>
              <p className="text-sm text-gray-500">Cross-referencing lighting vectors and environmental geometry for unnatural inconsistencies.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-4 px-8 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest z-40">
        <div>&copy; 2024 VERIMEDIA LABS</div>
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Network Stable</span>
          <span>Terms of Protocol</span>
          <span>Neural Ethics</span>
        </div>
      </footer>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
