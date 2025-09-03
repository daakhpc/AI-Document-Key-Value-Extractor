import React from 'react';
import { UploadedFile } from '../types';

interface FileProgressListProps {
    files: UploadedFile[];
}

const StatusIcon: React.FC<{ status: UploadedFile['status'] }> = ({ status }) => {
    switch (status) {
        case 'pending':
            return <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
        case 'processing':
            return <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>;
        case 'completed':
            return <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
        case 'error':
            return <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
        default:
            return null;
    }
};

const FileProgressList: React.FC<FileProgressListProps> = ({ files }) => {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">File Status</h2>
            <ul className="space-y-3">
                {files.map(file => (
                    <li key={file.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div className="flex items-center space-x-3">
                            <StatusIcon status={file.status} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.file.name}</p>
                                {file.status === 'error' && file.error && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate" title={file.error}>{file.error}</p>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FileProgressList;