import React, { useRef, useEffect, useState } from 'react';
import { MediaFile, Artifact } from '../types';

interface MediaViewerProps {
  file: MediaFile;
}

export default function MediaViewer({ file }: MediaViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [file.id]);

  const handleMediaLoad = (e: React.SyntheticEvent<HTMLVideoElement | HTMLImageElement>) => {
    const target = e.currentTarget;
    setMediaDimensions({ width: target.offsetWidth, height: target.offsetHeight });
  };

  // Filter artifacts relevant to the current time (for video) or all (for image)
  const activeArtifacts = file.result?.artifacts?.filter(artifact => {
    if (file.type === 'image') return true;
    
    // If no timestamp, show it always (or maybe never? let's show always for now as fallback)
    if (artifact.timestampStart === undefined && artifact.timestampEnd === undefined) return true;
    
    const start = artifact.timestampStart || 0;
    const end = artifact.timestampEnd || videoRef.current?.duration || 1000;
    
    return currentTime >= start && currentTime <= end;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'rgba(239, 68, 68, 0.4)'; // Red
      case 'Medium': return 'rgba(234, 179, 8, 0.4)'; // Yellow
      case 'Low': return 'rgba(59, 130, 246, 0.4)'; // Blue
      default: return 'rgba(156, 163, 175, 0.4)'; // Gray
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'High': return '#ef4444';
      case 'Medium': return '#eab308';
      case 'Low': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden group flex items-center justify-center border border-gray-800 relative min-h-[300px]">
      
      {/* Media Container - fits content */}
      <div className="relative inline-block max-w-full max-h-[500px]">
        {file.type === 'video' ? (
          <video 
            ref={videoRef}
            src={file.previewUrl} 
            controls 
            className="max-h-[500px] w-auto max-w-full block"
            onLoadedMetadata={handleMediaLoad}
          />
        ) : (
          <img 
            src={file.previewUrl} 
            alt="preview" 
            className="max-h-[500px] w-auto max-w-full block"
            onLoad={handleMediaLoad}
          />
        )}

        {/* Heatmap Overlay Layer */}
        {showHeatmap && activeArtifacts.map((artifact, idx) => {
          if (!artifact.boundingBox || artifact.boundingBox.length !== 4) return null;
          
          // Gemini returns [ymin, xmin, ymax, xmax]
          const [ymin, xmin, ymax, xmax] = artifact.boundingBox;
          
          return (
            <div
              key={idx}
              className="absolute pointer-events-none transition-opacity duration-300"
              style={{
                top: `${ymin * 100}%`,
                left: `${xmin * 100}%`,
                height: `${(ymax - ymin) * 100}%`,
                width: `${(xmax - xmin) * 100}%`,
                backgroundColor: getSeverityColor(artifact.severity),
                border: `2px solid ${getBorderColor(artifact.severity)}`,
                boxShadow: `0 0 15px ${getSeverityColor(artifact.severity)}`,
                zIndex: 10
              }}
            >
              {/* Tooltip on hover (pointer-events-auto needed for tooltip interaction if we wanted it, but let's keep it simple) */}
              <div className="absolute -top-6 left-0 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-white/20 shadow-lg backdrop-blur-sm">
                {artifact.type}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls Overlay (Absolute to main container) */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {file.result && file.result.artifacts.length > 0 && (
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all backdrop-blur-md ${
              showHeatmap 
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-black/60 text-gray-300 hover:bg-black/80 border border-white/10'
            }`}
          >
            <i className={`fas ${showHeatmap ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            {showHeatmap ? 'Heatmap On' : 'Heatmap Off'}
          </button>
        )}
      </div>

      {/* File Info Badge */}
      <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-gray-300 border border-white/10 pointer-events-none">
         {file.file.type} • {(file.file.size / 1024 / 1024).toFixed(2)} MB
      </div>
    </div>
  );
}
