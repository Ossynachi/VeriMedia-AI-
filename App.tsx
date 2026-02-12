
import React, { useState, useRef, useCallback } from 'react';
import { MediaFile, AnalysisResult } from './types';
import FileUploader from './components/FileUploader';
import ResultsPanel from './components/ResultsPanel';
import { analyzeMediaArtifacts } from './services/geminiService';

// --- Sub-components for different views ---

const DocumentationView = () => (
  <div className="animate-fadeIn space-y-8 text-gray-300">
    <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
      <h2 className="text-3xl font-bold text-white mb-6">System Documentation</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-bold text-blue-400 mb-2">1. Overview</h3>
          <p className="leading-relaxed">
            VeriMedia AI is a specialized forensic tool designed to identify synthetic media manipulation. 
            By leveraging the Gemini 3 Flash multimodal capabilities, it analyzes pixel-level irregularities, 
            lighting inconsistencies, and semantic anomalies typical of deepfake generation algorithms (GANs, Diffusion models).
          </p>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-400 mb-2">2. Supported Formats</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-white font-mono">Video</span>: MP4, WEBM (up to 50MB recommended)</li>
            <li><span className="text-white font-mono">Images</span>: JPG, PNG, WEBP</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-blue-400 mb-2">3. Analysis Methodology</h3>
          <p className="leading-relaxed mb-2">The system performs a multi-stage analysis:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong className="text-white">Structural Scan:</strong> Checks for warping in background geometry.</li>
            <li><strong className="text-white">Biometric Consistency:</strong> Analyzes eye blinking patterns and lip-sync accuracy.</li>
            <li><strong className="text-white">Noise Distribution:</strong> Detects inconsistent sensor noise patterns often smoothed out by AI upscaling.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

const ApiInfoView = () => (
  <div className="animate-fadeIn space-y-8 text-gray-300">
    <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
      <h2 className="text-3xl font-bold text-white mb-6">API & System Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-black/40 rounded-xl border border-green-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
            <i className="fas fa-server"></i>
          </div>
          <div>
            <div className="text-sm text-gray-400 uppercase font-bold">System Status</div>
            <div className="text-xl font-bold text-white">Operational</div>
          </div>
        </div>
        <div className="p-4 bg-black/40 rounded-xl border border-blue-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <i className="fas fa-brain"></i>
          </div>
          <div>
            <div className="text-sm text-gray-400 uppercase font-bold">Active Model</div>
            <div className="text-xl font-bold text-white">Gemini 3 Flash</div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white mb-2">Security & Quota</h3>
        <p className="leading-relaxed">
          Your session is secured using standard TLS encryption. API access is managed via server-side environment configurations 
          to ensure key integrity. No API keys are stored in the browser local storage.
        </p>
        
        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/20">
          <h4 className="font-bold text-blue-300 mb-2"><i className="fas fa-info-circle"></i> Developer Note</h4>
          <p className="text-sm">
            This instance is configured with a predefined quota. If you experience rate limiting, please try again in a few moments. 
            Commercial integration requires a dedicated Enterprise License Key.
          </p>
        </div>
      </section>
    </div>
  </div>
);

const EthicsView = () => (
  <div className="animate-fadeIn space-y-8 text-gray-300">
    <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
      <h2 className="text-3xl font-bold text-white mb-6">Ethical AI Manifesto</h2>
      
      <div className="space-y-8">
        <div className="flex gap-6">
          <div className="w-16 h-16 shrink-0 bg-white/5 rounded-full flex items-center justify-center text-2xl text-indigo-400">
            <i className="fas fa-balance-scale"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Truth & Authenticity</h3>
            <p className="leading-relaxed">
              We believe that in an age of generative media, the ability to discern truth is a fundamental digital right. 
              Our tools are built not to police content, but to provide transparency and context to media consumers.
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-16 h-16 shrink-0 bg-white/5 rounded-full flex items-center justify-center text-2xl text-purple-400">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Privacy First</h3>
            <p className="leading-relaxed">
              Media analyzed by VeriMedia AI is processed in real-time. We do not store user uploads for model training 
              without explicit consent. Your data remains your property.
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-16 h-16 shrink-0 bg-white/5 rounded-full flex items-center justify-center text-2xl text-teal-400">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Bias Mitigation</h3>
            <p className="leading-relaxed">
              Deepfake detection models can inherit biases. We continuously audit our system against diverse datasets 
              to ensure fair and accurate detection across all demographics.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Identity Modal ---

const IdentityModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (name: string) => void }) => {
    const [name, setName] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim()) return;
        setIsLoggingIn(true);
        // Simulate API delay
        setTimeout(() => {
            onLogin(name);
            setIsLoggingIn(false);
            onClose();
            setName('');
        }, 1500);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-900 border border-blue-500/30 p-8 rounded-2xl w-full max-w-md relative shadow-2xl shadow-blue-900/50">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <i className="fas fa-times"></i>
                </button>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                        <i className="fas fa-user-astronaut text-2xl text-white"></i>
                    </div>
                    <h3 className="text-2xl font-black text-white">Agent Identification</h3>
                    <p className="text-gray-400 text-sm mt-2">Enter your callsign to access the neural network.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Callsign</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                            placeholder="e.g. TRUTH_SEEKER_01"
                            autoFocus
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoggingIn}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoggingIn ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-fingerprint"></i>}
                        {isLoggingIn ? 'Authenticating...' : 'Establish Connection'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  // Media Analysis State
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  
  // Navigation & User State
  const [currentView, setCurrentView] = useState<'home' | 'docs' | 'api' | 'ethics'>('home');
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [identity, setIdentity] = useState<{name: string} | null>(null);

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
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
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

  const handleLogin = (name: string) => {
      setIdentity({ name });
  };
  
  const handleLogout = () => {
      setIdentity(null);
      setCurrentView('home');
  };

  const renderHomeContent = () => (
    <>
        <div className="text-center mb-12 animate-slideUp">
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
          <div className="space-y-6 animate-fadeIn">
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
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 animate-slideUp">
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
    </>
  );

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
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-fingerprint text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">VERI<span className="text-blue-500">MEDIA</span> AI</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Integrity Protocol v2.5</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
          <button 
            onClick={() => setCurrentView('docs')} 
            className={`hover:text-blue-400 transition-colors ${currentView === 'docs' ? 'text-white' : ''}`}
          >
            Documentation
          </button>
          <button 
            onClick={() => setCurrentView('api')} 
            className={`hover:text-blue-400 transition-colors ${currentView === 'api' ? 'text-white' : ''}`}
          >
            API Keys
          </button>
          <button 
            onClick={() => setCurrentView('ethics')} 
            className={`hover:text-blue-400 transition-colors ${currentView === 'ethics' ? 'text-white' : ''}`}
          >
            Ethical AI
          </button>
        </div>

        <button 
            onClick={() => identity ? handleLogout() : setIsIdentityModalOpen(true)}
            className={`
                px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2
                ${identity 
                    ? 'bg-red-900/50 hover:bg-red-900 border border-red-500/50 text-red-200 shadow-red-900/20' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }
            `}
        >
          {identity ? (
            <>
                <i className="fas fa-sign-out-alt"></i>
                <span className="max-w-[100px] truncate">{identity.name}</span>
            </>
          ) : (
            <>
                <i className="fas fa-id-card-alt"></i>
                Connect Identity
            </>
          )}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-12 relative">
        {currentView !== 'home' && (
            <div className="mb-8">
                <button 
                    onClick={() => setCurrentView('home')} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest group"
                >
                    <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Back to Scanner
                </button>
            </div>
        )}
        
        {currentView === 'home' && renderHomeContent()}
        {currentView === 'docs' && <DocumentationView />}
        {currentView === 'api' && <ApiInfoView />}
        {currentView === 'ethics' && <EthicsView />}
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-4 px-8 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest z-40">
        <div>&copy; 2024 VERIMEDIA LABS</div>
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Network Stable</span>
          <span>Terms of Protocol</span>
          <span>Neural Ethics</span>
        </div>
      </footer>
      
      <IdentityModal 
        isOpen={isIdentityModalOpen} 
        onClose={() => setIsIdentityModalOpen(false)} 
        onLogin={handleLogin} 
      />

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
