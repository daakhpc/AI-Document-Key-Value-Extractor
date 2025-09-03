
import React, { useState, useCallback, useEffect } from 'react';
import { UploadedFile } from './types';
import { extractDataFromFiles } from './services/geminiService';
import FileUpload from './components/FileUpload';
import FileProgressList from './components/FileProgressList';
import KeySelector from './components/KeySelector';
import DataTable from './components/DataTable';

const App: React.FC = () => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [keyGroups, setKeyGroups] = useState<Map<string, string[]>>(new Map());
    const [orderedDisplayKeys, setOrderedDisplayKeys] = useState<string[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFilesUpload = useCallback((files: File[]) => {
        const newFiles: UploadedFile[] = files.map(file => ({
            id: `${file.name}-${file.lastModified}-${file.size}`,
            file,
            status: 'pending',
            data: null,
            error: null,
        }));
        setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
        setKeyGroups(new Map());
        setOrderedDisplayKeys([]);
        setSelectedKeys(new Set());
    }, []);

    const processFiles = useCallback(async () => {
        const filesToProcess = uploadedFiles.filter(f => f.status === 'pending');
        if (filesToProcess.length === 0) {
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        setError(null);

        const processFile = async (fileToProcess: UploadedFile) => {
            setUploadedFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'processing' } : f));
            try {
                const data = await extractDataFromFiles(fileToProcess.file);
                setUploadedFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'completed', data } : f));
            } catch (err: any) {
                console.error("Error processing file:", err);
                const errorMessage = err.message || 'An unknown error occurred during processing.';
                setUploadedFiles(prev => prev.map(f => f.id === fileToProcess.id ? { ...f, status: 'error', error: errorMessage } : f));
            }
        };

        await Promise.all(filesToProcess.map(processFile));
        setIsProcessing(false);
    }, [uploadedFiles]);

    useEffect(() => {
        if (uploadedFiles.some(f => f.status === 'pending')) {
            processFiles();
        }
    }, [uploadedFiles, processFiles]);

    useEffect(() => {
        if (isProcessing || uploadedFiles.some(f => f.status === 'pending')) return;

        const completedFiles = uploadedFiles.filter(f => f.status === 'completed' && f.data);
        if (completedFiles.length === 0) {
             if (uploadedFiles.length > 0) { // If files were processed but all failed
                setKeyGroups(new Map());
                setOrderedDisplayKeys([]);
                setSelectedKeys(new Set());
            }
            return;
        }

        const keyToValues = new Map<string, Set<string>>();
        const discoveryOrder: string[] = [];
        completedFiles.forEach(file => {
            file.data?.forEach(rowObject => {
                 for (const key in rowObject) {
                    if (Object.prototype.hasOwnProperty.call(rowObject, key)) {
                        const trimmedKey = key.trim();
                        if (!trimmedKey) continue;

                        if (!keyToValues.has(trimmedKey)) {
                            keyToValues.set(trimmedKey, new Set());
                            discoveryOrder.push(trimmedKey);
                        }
                        keyToValues.get(trimmedKey)!.add(rowObject[key]);
                    }
                }
            });
        });

        const valueSetHashToKeys = new Map<string, string[]>();
        for (const [key, valueSet] of keyToValues.entries()) {
            if (valueSet.size === 0) continue;
            const hash = JSON.stringify(Array.from(valueSet).sort());
            if (!valueSetHashToKeys.has(hash)) {
                valueSetHashToKeys.set(hash, []);
            }
            valueSetHashToKeys.get(hash)!.push(key);
        }

        const newKeyGroups = new Map<string, string[]>();
        const newOrderedDisplayKeys: string[] = [];
        const processedOriginalKeys = new Set<string>();

        for (const originalKey of discoveryOrder) {
            if (processedOriginalKeys.has(originalKey)) continue;

            let foundGroup: string[] | undefined;
            for (const group of valueSetHashToKeys.values()) {
                if (group.includes(originalKey)) {
                    foundGroup = group;
                    break;
                }
            }
            
            if (foundGroup) {
                foundGroup.sort();
                const displayKey = foundGroup.join('/');
                newKeyGroups.set(displayKey, foundGroup);
                newOrderedDisplayKeys.push(displayKey);
                foundGroup.forEach(k => processedOriginalKeys.add(k));
            }
        }

        setKeyGroups(newKeyGroups);
        setOrderedDisplayKeys(newOrderedDisplayKeys);
        setSelectedKeys(new Set(newOrderedDisplayKeys));
    }, [isProcessing, uploadedFiles]);

    const handleKeySelectionChange = (key: string) => {
        setSelectedKeys(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(key)) {
                newSelection.delete(key);
            } else {
                newSelection.add(key);
            }
            return newSelection;
        });
    };
    
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed' && f.data);
    const hasPendingFiles = uploadedFiles.some(f => f.status === 'pending');

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        📄 AI Document Key-Value Extractor
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Upload documents to automatically extract structured data into a table.
                    </p>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <FileUpload onFilesUpload={handleFilesUpload} isProcessing={isProcessing || hasPendingFiles} />
                        <FileProgressList files={uploadedFiles} />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {keyGroups.size > 0 && !isProcessing && !hasPendingFiles ? (
                            <>
                                <KeySelector allKeys={orderedDisplayKeys} selectedKeys={selectedKeys} onKeySelectionChange={handleKeySelectionChange} />
                                <DataTable files={completedFiles} selectedKeys={selectedKeys} keyGroups={keyGroups} />
                            </>
                        ) : isProcessing || hasPendingFiles ? (
                             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-96">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Processing documents...</p>
                                <p className="text-gray-500 dark:text-gray-400">AI is extracting key-value pairs. Please wait.</p>
                            </div>
                        ) : (
                             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-96">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Awaiting Documents</p>
                                <p className="text-gray-500 dark:text-gray-400">Upload one or more files to begin data extraction.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
