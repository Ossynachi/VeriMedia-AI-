
import React, { useCallback, useState } from 'react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled, compact }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      validateAndUpload(selectedFiles);
    }
    // Reset input so same files can be selected again if needed
    e.target.value = '';
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFiles = Array.from(e.dataTransfer.files);
      validateAndUpload(selectedFiles);
    }
  }, [disabled, onFilesSelected]);

  const validateAndUpload = (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'));
    const videos = files.filter(f => f.type.startsWith('video/'));

    if (images.length > 20) {
      alert(`Too many images selected. Maximum allowed is 20. You selected ${images.length}.`);
      return;
    }

    if (videos.length > 10) {
      alert(`Too many videos selected. Maximum allowed is 10. You selected ${videos.length}.`);
      return;
    }

    onFilesSelected(files);
  };

  if (compact) {
     return (
        <label className={`cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <i className="fas fa-plus"></i>
            <span className="hidden sm:inline">Add Media</span>
            <input 
              type="file" 
              className="hidden" 
              accept="video/*,image/*" 
              multiple
              onChange={handleFileChange}
              disabled={disabled}
            />
        </label>
     )
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto animate-slideUp">
      <label 
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${disabled 
            ? 'border-gray-700 bg-gray-900/50 cursor-not-allowed' 
            : isDragging 
              ? 'border-blue-400 bg-blue-600/20 shadow-[0_0_25px_rgba(59,130,246,0.3)] scale-[1.01]' 
              : 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/5 bg-gray-900/30'}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
          <div className={`w-16 h-16 mb-4 flex items-center justify-center rounded-full transition-colors duration-300 ${
            isDragging ? 'bg-blue-500 text-white scale-110' : 'bg-blue-500/10 text-blue-400'
          }`}>
            <i className={`fas ${disabled ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-3xl`}></i>
          </div>
          <p className={`mb-2 text-sm transition-colors ${isDragging ? 'text-blue-200' : 'text-gray-400'}`}>
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">Multiple files supported (Images & Videos)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="video/*,image/*" 
          multiple
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
};

export default FileUploader;
