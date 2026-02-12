
import React, { useCallback } from 'react';
import { MediaFile } from '../types';

interface FileUploaderProps {
  onFileSelected: (media: MediaFile) => void;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, isLoading }) => {
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith('video') ? 'video' : 'image';
    const previewUrl = URL.createObjectURL(file);
    
    onFileSelected({ file, previewUrl, type: type as 'video' | 'image' });
  }, [onFileSelected]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <label 
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all
          ${isLoading ? 'border-blue-800 bg-gray-900/50' : 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/5 bg-gray-900/30'}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
            <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-3xl`}></i>
          </div>
          <p className="mb-2 text-sm text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">Video (MP4, WEBM) or Images (JPG, PNG)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="video/*,image/*" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>
    </div>
  );
};

export default FileUploader;
