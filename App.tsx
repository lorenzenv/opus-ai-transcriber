import React, { useState, useCallback, useRef, useEffect } from 'react';
import { transcribeAudio } from './services/transcriptionService';

const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CopyIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File | undefined): file is File => {
    if (!file) return false;
    const isOpusMime = file.type === 'audio/opus';
    const isOpusExtension = file.name.toLowerCase().endsWith('.opus');
    const isOggMime = file.type === 'audio/ogg';
    const isOggExtension = file.name.toLowerCase().endsWith('.ogg');
    const isM4aMime = file.type === 'audio/m4a' || file.type === 'audio/mp4';
    const isM4aExtension = file.name.toLowerCase().endsWith('.m4a');
    return isOpusMime || isOpusExtension || isOggMime || isOggExtension || isM4aMime || isM4aExtension;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (isValidFile(file)) {
      onFileSelect(file);
    } else {
        alert('Please select an .opus, .ogg, or .m4a file.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    
    const file = event.dataTransfer.files?.[0];
    if (isValidFile(file)) {
      onFileSelect(file);
    } else {
        alert('Please drop an .opus, .ogg, or .m4a file.');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  
  const handleClick = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  const dropzoneClasses = `
    flex flex-col items-center justify-center w-full max-w-lg p-8 border-2 border-dashed rounded-lg transition-colors duration-300
    ${disabled ? 'cursor-not-allowed bg-slate-800 border-slate-700' : 'cursor-pointer hover:bg-slate-700'}
    ${isDragging ? 'bg-sky-900/50 border-sky-400' : 'bg-slate-800/50 border-slate-600'}
  `;

  return (
    <div
      className={dropzoneClasses}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/opus,audio/ogg,audio/m4a,audio/mp4"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <UploadIcon className={`w-12 h-12 mb-4 ${isDragging ? 'text-sky-300' : 'text-slate-500'}`} />
      <p className="text-center text-slate-400">
        <span className="font-semibold text-sky-400">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-slate-500 mt-2">OPUS, OGG, or M4A audio files only</p>
    </div>
  );
};

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
    <p className="text-sky-300">Transcribing, please wait...</p>
  </div>
);

interface TranscriptionDisplayProps {
  text: string;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl bg-slate-800 p-6 rounded-lg shadow-lg relative">
      <h3 className="text-lg font-semibold text-sky-300 mb-4">Transcription Result</h3>
      <button 
        onClick={handleCopy}
        className="absolute top-4 right-4 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
        aria-label="Copy transcription"
      >
        {copied ? 'Copied!' : <CopyIcon className="w-5 h-5" />}
      </button>
      <p className="text-slate-200 whitespace-pre-wrap font-mono bg-slate-900/50 p-4 rounded-md">{text}</p>
    </div>
  );
};

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
        setTranscription('');
        setError(null);
    }
  }, [selectedFile]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setTranscription('');
    setError(null);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          return reject(new Error('File could not be read as a string.'));
        }
        resolve(reader.result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranscription('');

    try {
      const base64Audio = await fileToBase64(selectedFile);
      
      let mimeType = selectedFile.type;
      if (!mimeType) {
        const extension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (extension === 'opus') {
            mimeType = 'audio/opus';
        } else if (extension === 'ogg') {
            mimeType = 'audio/ogg';
        } else if (extension === 'm4a') {
            mimeType = 'audio/m4a';
        } else {
            mimeType = 'application/octet-stream'; 
        }
      }

      const result = await transcribeAudio(base64Audio, mimeType);
      setTranscription(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-8">
        <header className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-sky-400 tracking-tight">Opus AI Transcriber</h1>
            <p className="mt-4 text-lg text-slate-300">Upload an Opus, Ogg, or M4A audio file and let AI turn it into text.</p>
        </header>

        <main className="w-full flex flex-col items-center space-y-6">
          {!selectedFile && <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />}

          {selectedFile && (
            <div className="flex items-center space-x-3 bg-slate-800 p-3 pl-4 rounded-lg w-full max-w-lg">
                <FileIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />
                <span className="text-slate-300 truncate flex-grow" title={selectedFile.name}>{selectedFile.name}</span>
                <span className="text-slate-500 text-sm ml-auto flex-shrink-0">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                </span>
                <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="ml-2 p-1 rounded-full hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    aria-label="Clear file"
                >
                    <CloseIcon className="w-5 h-5 text-slate-400" />
                </button>
            </div>
          )}

          <button
            onClick={handleTranscribe}
            disabled={!selectedFile || isLoading}
            className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader /> : 'Transcribe Audio'}
          </button>
          
          {error && (
            <div className="w-full max-w-2xl bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
          )}

          {transcription && <TranscriptionDisplay text={transcription} />}
        </main>
      </div>
    </div>
  );
}
