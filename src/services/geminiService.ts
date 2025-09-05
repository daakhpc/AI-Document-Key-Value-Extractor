import { UploadedFile } from './types';

interface FilePayload {
    data: string;
    mimeType: string;
}

const fileToBase64Payload = (file: File): Promise<FilePayload> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve({
                data: result.split(',')[1],
                mimeType: file.type,
            });
        };
        reader.onerror = error => reject(error);
    });
};

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const identifyHeaders = async (files: UploadedFile[]): Promise<string[]> => {
    const filesToSample = files.slice(0, 3); // Use a subset of files
    const filePayloads = await Promise.all(filesToSample.map(f => fileToBase64Payload(f.file)));

    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'identify_headers',
            payload: { files: filePayloads },
        }),
    });
    
    const data = await handleApiResponse(response);
    return data.headers;
};

export const extractData = async (file: UploadedFile, headers: string[], instructions: string): Promise<Record<string, string>> => {
    const filePayload = await fileToBase64Payload(file.file);

    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'extract_data',
            payload: {
                file: filePayload,
                headers,
                instructions,
            },
        }),
    });

    const data = await handleApiResponse(response);
    return data.data;
};
