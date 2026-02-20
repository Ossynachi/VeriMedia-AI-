
export interface Artifact {
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  confidence: number;
  timestampStart?: number; // Start time in seconds (for video)
  timestampEnd?: number;   // End time in seconds (for video)
  boundingBox?: number[];  // [ymin, xmin, ymax, xmax] normalized 0-1
}

export interface AnalysisResult {
  integrityScore: number; // 0 to 100
  isDeepfake: boolean;
  classification: 'natural' | 'ai-edited' | 'ai-generated';
  artifacts: Artifact[];
  detailedAnalysis: string;
  timestamp: string;
  embedding?: number[]; // For unsupervised learning
  anomalyScore?: number; // 0 to 100 (0 = normal, 100 = anomaly)
}

export interface MediaFile {
  id: string; // Unique ID
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  result?: AnalysisResult;
  error?: string;
  userFeedback?: 'correct' | 'incorrect';
  context?: string;
}
