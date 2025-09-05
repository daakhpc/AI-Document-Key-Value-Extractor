import React, { useState, useCallback } from 'react';
import { UploadedFile } from '../types';

interface FileUploadProps {
    onIdentifyHeaders: (files: UploadedFile[]) => void;
    isProcessing: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const FileUpload: React.FC<FileUploadProps> = ({ onIdentifyHeaders, isProcessing }) => {
    const [stagedFiles, setStagedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addFiles = (files: File[]) => {
        setError(null);
        const newFiles: UploadedFile[] = [];
        let hasError = false;
        for (const file of files) {
            if (stagedFiles.some(f => f.file.name === file.name && f.file.size === file.size)) continue;
            if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                setError(`File type not supported: ${file.name} (${file.type})`);
                hasError = true;
                break;
            }
            if (file.size > MAX_FILE_SIZE) {
                setError(`File size exceeds 20MB: ${file.name}`);
                hasError = true;
                break;
            }
            newFiles.push({ id: `${file.name}-${file.lastModified}`, file });
        }
        if (!hasError) {
            setStagedFiles(prev => [...prev, ...newFiles]);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    };

    const handleRemoveFile = (id: string) => {
        setStagedFiles(prev => prev.filter(f => f.id !== id));
    };
    
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 1: Upload Documents</h2>
            <div
                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
                    ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600'}`}
            >
                <input type="file" multiple id="file-upload" className="hidden" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.join(',')} />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Drag & drop files here, or <span className="font-semibold text-indigo-600 dark:text-indigo-400">click to browse</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">PDF, JPG, PNG, WEBP up to 20MB</p>
                </label>
            </div>
            
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            {stagedFiles.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-semibold">Staged Files:</h3>
                    <ul className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {stagedFiles.map(f => (
                            <li key={f.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <span className="truncate text-sm">{f.file.name}</span>
                                <button onClick={() => handleRemoveFile(f.id)} className="text-red-500 hover:text-red-700">&times;</button>
                            </li>
                        ))}
                    </ul>
                    <div className="text-right">
                        <button onClick={() => onIdentifyHeaders(stagedFiles)} disabled={isProcessing} className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isProcessing ? 'Processing...' : 'Identify Headers'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
