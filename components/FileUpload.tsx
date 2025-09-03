
import React, { useState, useCallback } from 'react';

interface FileUploadProps {
    onFilesUpload: (files: File[]) => void;
    isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUpload, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            onFilesUpload(Array.from(event.target.files));
        }
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

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesUpload(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    }, [onFilesUpload]);

    const acceptedFileTypes = "application/pdf,image/jpeg,image/png,image/webp";

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Documents</h2>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
                    ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600'}`}
            >
                <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Drag & drop files here</span> or click to browse.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PDF, JPG, PNG, WEBP supported.</p>
                </div>
                <input
                    type="file"
                    multiple
                    accept={acceptedFileTypes}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-input"
                    disabled={isProcessing}
                />
                <label htmlFor="file-upload-input" className={`mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isProcessing ? 'Processing...' : 'Select Files'}
                </label>
            </div>
        </div>
    );
};

export default FileUpload;
