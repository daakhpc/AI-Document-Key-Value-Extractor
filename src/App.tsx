
import React, { useState, useCallback, useEffect } from 'react';
import { UploadedFile } from './types';
import { extractDataFromFiles } from './services/geminiService';
import FileUpload from './components/FileUpload';
import FileProgressList from './components/FileProgressList';
import KeySelector from './components/KeySelector';
import DataTable from './components/DataTable';
import TableConfiguration from './components/TableConfiguration';

const App: React.FC = () => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [keyGroups, setKeyGroups] = useState<Map<string, string[]>>(new Map()); // Key: display key "Name/नाम", Value: ["Name", "नाम"]
    const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
    const [displayedKeys, setDisplayedKeys] = useState<string[]>([]);
    const [isTableVisible, setIsTableVisible] = useState<boolean>(false);
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
        setIsTableVisible(false);
    }, []);

    const processFiles = useCallback(async () => {
        const filesToProcess = uploadedFiles.filter(f => f.status === 'pending');
        if (filesToProcess.length === 0) {
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

    // Effect to group keys after processing is finished
    useEffect(() => {
        if (isProcessing) return;

        const completedFiles = uploadedFiles.filter(f => f.status === 'completed' && f.data);
        if (completedFiles.length === 0) return;

        // 1. Collect all values for each unique, trimmed original key
        const keyToValues = new Map<string, Set<string>>();
        completedFiles.forEach(file => {
            file.data?.forEach(pair => {
                const key = pair.key.trim();
                if (!key) return;
                if (!keyToValues.has(key)) {
                    keyToValues.set(key, new Set());
                }
                keyToValues.get(key)!.add(pair.value);
            });
        });

        // 2. Group original keys by their exact set of values
        const valueSetHashToKeys = new Map<string, string[]>();
        for (const [key, valueSet] of keyToValues.entries()) {
            if (valueSet.size === 0) continue;
            // Create a consistent hash from the set of values to find identical sets
            const hash = JSON.stringify(Array.from(valueSet).sort());
            if (!valueSetHashToKeys.has(hash)) {
                valueSetHashToKeys.set(hash, []);
            }
            valueSetHashToKeys.get(hash)!.push(key);
        }

        // 3. Create the final display key groups
        const newKeyGroups = new Map<string, string[]>();
        for (const originalKeys of valueSetHashToKeys.values()) {
            originalKeys.sort(); // Sort for consistent display, e.g., "Name/नाम" not "नाम/Name"
            const displayKey = originalKeys.join('/');
            newKeyGroups.set(displayKey, originalKeys);
        }

        setKeyGroups(newKeyGroups);
        // Auto-select all newly found keys
        setCheckedKeys(new Set(newKeyGroups.keys()));
        setIsTableVisible(false);

    }, [isProcessing, uploadedFiles]);


    const handleKeySelectionChange = (key: string) => {
        setIsTableVisible(false);
        setCheckedKeys(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(key)) {
                newSelection.delete(key);
            } else {
                newSelection.add(key);
            }
            return newSelection;
        });
    };

    const handleSelectAllKeys = () => {
        setIsTableVisible(false);
        setCheckedKeys(new Set(Array.from(keyGroups.keys())));
    };

    const handleDeselectAllKeys = () => {
        setIsTableVisible(false);
        setCheckedKeys(new Set());
    };



    const handleCreateTable = (orderedKeys: string[]) => {
        setDisplayedKeys(orderedKeys);
        setIsTableVisible(true);
    };
    
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed' && f.data);
    const allDisplayKeys = Array.from(keyGroups.keys());

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        📄 AI Document Key-Value Extractor
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Upload documents, select data, reorder columns, and export your results.
                    </p>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <FileUpload onFilesUpload={handleFilesUpload} isProcessing={isProcessing} />
                        <FileProgressList files={uploadedFiles} />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {completedFiles.length > 0 ? (
                            <>
                                <KeySelector 
                                    allKeys={allDisplayKeys} 
                                    checkedKeys={checkedKeys} 
                                    onKeySelectionChange={handleKeySelectionChange}
                                    onSelectAll={handleSelectAllKeys}
                                    onDeselectAll={handleDeselectAllKeys}
                                />
                                {checkedKeys.size > 0 && (
                                    <TableConfiguration 
                                        keys={Array.from(checkedKeys).sort((a,b) => allDisplayKeys.indexOf(a) - allDisplayKeys.indexOf(b))} 
                                        onCreateTable={handleCreateTable} 
                                    />
                                )}
                                {isTableVisible && (
                                    <DataTable files={completedFiles} displayedKeys={displayedKeys} keyGroups={keyGroups} />
                                )}
                            </>
                        ) : isProcessing ? (
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
