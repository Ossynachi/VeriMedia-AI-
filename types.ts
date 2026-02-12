
export interface Artifact {
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  confidence: number;
}

export interface AnalysisResult {
  integrityScore: number; // 0 to 100
  isDeepfake: boolean;
  artifacts: Artifact[];
  detailedAnalysis: string;
  timestamp: string;
}

export interface MediaFile {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}
