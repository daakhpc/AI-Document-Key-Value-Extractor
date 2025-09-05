// FIX: Add Vite client types to fix import.meta.env errors.
/// <reference types="vite/client" />

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { UploadedFile, TableRow, AppStep } from './types';
import * as geminiService from './services/geminiService';
import FileUpload from './components/FileUpload';
import HeaderConfiguration from './components/KeySelector';
import DataTable from './components/DataTable';

// --- Helper & Sub-Components defined in App.tsx to avoid creating new files ---

const API_KEY = import.meta.env.VITE_API_KEY;

const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; toggleTheme: () => void }> = ({ theme, toggleTheme }) => (
    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
        {theme === 'light' ? 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> : 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
    </button>
);

const ApiKeyTester: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
    const testApiKey = async () => {
        setStatus('testing');
        if (!API_KEY) {
            setStatus('invalid');
            return;
        }
        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
            setStatus('valid');
        } catch (error) {
            console.error("API Key test failed:", error);
            setStatus('invalid');
        }
    };
    return (
        <div className="flex items-center space-x-2">
            <button onClick={testApiKey} disabled={status === 'testing'} className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                Test API Key
            </button>
            {status === 'testing' && <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>}
            {status === 'valid' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
            {status === 'invalid' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
        </div>
    );
};

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="w-full">
        <p className="text-center mb-2">{`Processing file ${current} of ${total}`}</p>
        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
            <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${(current / total) * 100}%` }}></div>
        </div>
    </div>
);

// --- Main App Component ---

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [step, setStep] = useState<AppStep>('upload');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [suggestedHeaders, setSuggestedHeaders] = useState<string[]>([]);
    const [finalHeaders, setFinalHeaders] = useState<string[]>([]);
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [tableData, setTableData] = useState<TableRow[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (userPrefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const handleIdentifyHeaders = async (files: UploadedFile[]) => {
        setUploadedFiles(files);
        setIsProcessing(true);
        setError(null);
        try {
            const headers = await geminiService.identifyHeaders(files);
            setSuggestedHeaders(headers);
            setStep('configure');
        } catch (err: any) {
            setError(err.message || 'Failed to identify headers.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleHeaderConfigurationComplete = (orderedHeaders: string[]) => {
        setFinalHeaders(orderedHeaders);
        setStep('extract');
    };

    const handleCreateTable = async () => {
        setStep('extracting');
        setProgress({ current: 0, total: uploadedFiles.length });
        setTableData([]);
        setError(null);

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            setProgress({ current: i + 1, total: uploadedFiles.length });
            try {
                const extractedData = await geminiService.extractData(file, finalHeaders, additionalInstructions);
                setTableData(prevData => [...prevData, { 'S.No': prevData.length + 1, 'Document Name': file.file.name, ...extractedData }]);
            } catch (err: any) {
                console.error(`Error processing ${file.file.name}:`, err);
                const errorRow = { 'S.No': tableData.length + 1, 'Document Name': file.file.name } as TableRow;
                finalHeaders.forEach(h => { if(h !== 'S.No' && h !== 'Document Name') errorRow[h] = `Error: ${err.message}`; });
                setTableData(prevData => [...prevData, errorRow]);
            }
        }
        setStep('done');
    };

    const handleReset = () => {
        setStep('upload');
        setUploadedFiles([]);
        setSuggestedHeaders([]);
        setFinalHeaders([]);
        setAdditionalInstructions('');
        setTableData([]);
        setIsProcessing(false);
        setError(null);
        setProgress({ current: 0, total: 0 });
    };

    const renderStepContent = () => {
        if (error) {
            return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">An Error Occurred</p>
                <p>{error}</p>
                <button onClick={() => setError(null)} className="mt-2 text-sm font-semibold">Dismiss</button>
            </div>;
        }

        switch (step) {
            case 'upload':
                return <FileUpload onIdentifyHeaders={handleIdentifyHeaders} isProcessing={isProcessing} />;
            case 'configure':
                return <HeaderConfiguration suggestedHeaders={suggestedHeaders} onConfigComplete={handleHeaderConfigurationComplete} />;
            case 'extract':
                 return (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-xl font-semibold">Final Instructions (Optional)</h2>
                        <textarea
                            value={additionalInstructions}
                            onChange={(e) => setAdditionalInstructions(e.target.value)}
                            placeholder="e.g., Format all dates as YYYY-MM-DD. Extract currency as a number without symbols."
                            className="w-full h-24 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="text-right">
                             <button onClick={handleCreateTable} className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Create Table</button>
                        </div>
                    </div>
                 );
            case 'extracting':
                return <ProgressBar current={progress.current} total={progress.total} />;
            case 'done':
                 return (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">Extraction Complete!</h2>
                         <p className="text-gray-600 dark:text-gray-400 mt-2">The data has been extracted and is displayed below.</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        📄 AI Document Extractor
                    </h1>
                    <div className="flex items-center space-x-4">
                        <ApiKeyTester />
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    {renderStepContent()}
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Results</h2>
                        <div>
                             {tableData.length > 0 && step === 'done' && <DataTable.ExportButton data={tableData} headers={['S.No', 'Document Name', ...finalHeaders]} />}
                             <button onClick={handleReset} className="ml-4 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700">Start New Extraction</button>
                        </div>
                    </div>
                    <DataTable headers={['S.No', 'Document Name', ...finalHeaders]} data={tableData} isExtracting={step === 'extracting'} />
                </div>
            </main>
        </div>
    );
};

export default App;