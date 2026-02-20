
import React, { useState, useCallback, useEffect } from 'react';
import { MediaFile, AnalysisResult } from './types';
import FileUploader from './components/FileUploader';
import ResultsPanel from './components/ResultsPanel';
import MediaViewer from './components/MediaViewer';
import { analyzeMediaArtifacts, generateEmbedding } from './services/geminiService';
import { calculateAnomalyScore } from './utils/anomalyDetection';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export default function App() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('verimedia_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('verimedia_history', JSON.stringify(history));
  }, [history]);

  // Auto-select first file if none selected
  useEffect(() => {
    if (!activeFileId && files.length > 0) {
      setActiveFileId(files[0].id);
    }
  }, [files.length, activeFileId]);

  const activeFile = files.find(f => f.id === activeFileId);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const newMediaFiles: MediaFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      status: 'idle'
    }));

    setFiles(prev => [...prev, ...newMediaFiles]);
  }, []);

  const removeFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.previewUrl);
      return prev.filter(f => f.id !== id);
    });
    if (activeFileId === id) setActiveFileId(null);
  };

  const handleAnalyze = async (id: string) => {
    const fileToAnalyze = files.find(f => f.id === id);
    if (!fileToAnalyze) return;

    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'analyzing', error: undefined, userFeedback: undefined } : f));

    try {
      const base64 = await fileToBase64(fileToAnalyze.file);
      let result = await analyzeMediaArtifacts(base64, fileToAnalyze.file.type, fileToAnalyze.context);
      
      // Unsupervised Learning Step:
      // 1. Generate embedding for the detailed analysis text
      const embedding = await generateEmbedding(result.detailedAnalysis);
      
      if (embedding.length > 0) {
        // 2. Get embeddings of previously analyzed 'natural' media
        const naturalHistoryEmbeddings = history
          .filter(h => h.classification === 'natural' && h.embedding && h.embedding.length > 0)
          .map(h => h.embedding!);
          
        // 3. Calculate anomaly score relative to natural history
        // If no history, score is 0 (baseline)
        const anomalyScore = calculateAnomalyScore(embedding, naturalHistoryEmbeddings);
        
        result = { ...result, embedding, anomalyScore };
        
        // 4. Update history if it's a valid result
        setHistory(prev => [...prev, result]);
      }
      
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'complete', result } : f));
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'Analysis failed. The file might be too large or the format unsupported.';
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: errorMessage } : f));
    }
  };

  const handleContextChange = (id: string, context: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, context } : f));
  };

  const handleFeedback = (id: string, feedback: 'correct' | 'incorrect') => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, userFeedback: feedback } : f));
    // In a real production app, you would send this feedback to your backend here
    // e.g., await api.submitFeedback(id, feedback, activeFile.result);
  };

  const dismissError = (id: string) => {
     setFiles(prev => prev.map(f => f.id === id ? { ...f, error: undefined, status: 'idle' } : f));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center neon-border">
              <i className="fas fa-eye text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              VeriMedia <span className="text-blue-500">AI</span>
            </h1>
          </div>
          {files.length > 0 && (
            <FileUploader onFilesSelected={handleFilesSelected} compact />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-8 animate-fadeIn">
            <div className="text-center space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 pb-2">
                Detect Deepfakes with Precision
              </h2>
              <p className="text-gray-400 text-lg">
                Upload images or videos to analyze structural, biometric, and lighting artifacts using Gemini 3 Vision.
              </p>
            </div>
            <FileUploader onFilesSelected={handleFilesSelected} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            
            {/* Sidebar / File List */}
            <div className="lg:col-span-3 lg:h-full flex flex-col bg-gray-900/40 border border-blue-500/20 rounded-2xl backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-blue-500/20 flex justify-between items-center">
                <h3 className="font-bold text-gray-300">Media Queue ({files.length})</h3>
                <button 
                  onClick={() => setFiles([])} 
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {files.map(file => (
                  <div 
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`
                      group relative p-3 rounded-xl transition-all cursor-pointer border flex items-center gap-3
                      ${activeFileId === file.id 
                        ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]' 
                        : 'bg-black/40 border-gray-800 hover:bg-gray-800 hover:border-gray-700'}
                    `}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-black overflow-hidden relative flex-shrink-0">
                      {file.type === 'video' ? (
                        <video src={file.previewUrl} className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <img src={file.previewUrl} alt="thumb" className="w-full h-full object-cover" />
                      )}
                      {file.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fas fa-play text-[10px] text-white/80"></i>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${activeFileId === file.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                        {file.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {file.status === 'complete' && file.result && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            file.result.classification === 'ai-generated' ? 'bg-red-500/20 text-red-400' :
                            file.result.classification === 'ai-edited' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {file.result.classification.replace('-', ' ')}
                          </span>
                        )}
                        {file.status === 'analyzing' && (
                          <span className="text-[10px] text-blue-400 flex items-center gap-1">
                            <i className="fas fa-circle-notch fa-spin"></i> Analyzing...
                          </span>
                        )}
                        {file.status === 'error' && (
                          <span className="text-[10px] text-red-400">Error</span>
                        )}
                        {file.status === 'idle' && (
                           <span className="text-[10px] text-gray-500">Ready</span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button 
                      onClick={(e) => removeFile(e, file.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Details Panel */}
            <div className="lg:col-span-9 lg:h-full overflow-y-auto custom-scrollbar">
              {activeFile ? (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Media Preview & Actions */}
                  <div className="bg-gray-900/40 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Media Player */}
                      <div className="flex-1">
                         <MediaViewer file={activeFile} />
                      </div>

                      {/* Controls */}
                      <div className="w-full md:w-64 flex flex-col gap-4">
                        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                          <h4 className="font-bold text-gray-300 mb-2 text-sm">Context (Optional)</h4>
                          <textarea
                            value={activeFile.context || ''}
                            onChange={(e) => handleContextChange(activeFile.id, e.target.value)}
                            placeholder="E.g., 'Background was removed', 'Color corrected', 'Generated by Midjourney'..."
                            className="w-full bg-black/40 border border-gray-600 rounded-lg p-2 text-xs text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20"
                            disabled={activeFile.status === 'analyzing'}
                          />
                        </div>

                        <div className="flex-1 bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                          <h4 className="font-bold text-gray-300 mb-2">Analysis Status</h4>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-3 h-3 rounded-full ${
                              activeFile.status === 'analyzing' ? 'bg-blue-500 animate-pulse' :
                              activeFile.status === 'complete' ? 'bg-green-500' :
                              activeFile.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                            }`} />
                            <span className="capitalize text-sm text-gray-200">{activeFile.status}</span>
                          </div>

                          {activeFile.status === 'idle' || activeFile.status === 'error' ? (
                            <button
                              onClick={() => handleAnalyze(activeFile.id)}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-microscope"></i>
                              {activeFile.status === 'error' ? 'Retry Analysis' : 'Start Analysis'}
                            </button>
                          ) : activeFile.status === 'analyzing' ? (
                             <button disabled className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg font-bold cursor-not-allowed flex items-center justify-center gap-2">
                              <i className="fas fa-spinner fa-spin"></i>
                              Processing...
                            </button>
                          ) : (
                             <button 
                               onClick={() => handleAnalyze(activeFile.id)}
                               className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition-all border border-gray-600 flex items-center justify-center gap-2"
                             >
                              <i className="fas fa-redo"></i>
                              Re-Analyze
                            </button>
                          )}
                        </div>
                        
                        {activeFile.error && (
                          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-sm text-red-400 flex items-start gap-3 animate-fadeIn relative group">
                            <i className="fas fa-exclamation-triangle mt-0.5 text-lg"></i>
                            <div className="flex-1">
                                <p className="font-bold mb-1 text-red-300">Analysis Failed</p>
                                <p className="opacity-90 leading-relaxed text-xs sm:text-sm">{activeFile.error}</p>
                            </div>
                            <button 
                                onClick={() => dismissError(activeFile.id)}
                                className="text-red-400/50 hover:text-red-300 absolute top-2 right-2 p-1"
                                title="Dismiss"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Results Panel */}
                  {activeFile.status === 'complete' && activeFile.result && (
                    <ResultsPanel 
                      result={activeFile.result} 
                      userFeedback={activeFile.userFeedback}
                      onFeedback={(feedback) => handleFeedback(activeFile.id, feedback)}
                    />
                  )}
                  
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a file to view details
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
