// FIX: Add Vite client types to fix import.meta.env errors.
/// <reference types="vite/client" />

import { GoogleGenAI, Type } from "@google/genai";
import { UploadedFile } from './types';

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
    throw new Error("VITE_API_KEY environment variable not set. Please create a .env file and add your API key.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const identifyHeaders = async (files: UploadedFile[]): Promise<string[]> => {
    // Use a subset of files to avoid sending too much data
    const filesToSample = files.slice(0, 3);
    const imageParts = await Promise.all(filesToSample.map(f => fileToGenerativePart(f.file)));

    const prompt = `
        Analyze the attached documents. Based on their content, suggest a comprehensive list of column headers for data extraction.
        Consider all fields present, including document-level fields and fields within line items.
        Return your answer as a single JSON array of strings. For example: ["Invoice Number", "Date", "Description", "Total Amount"].
        Do not return any other text, explanations, or markdown formatting.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    try {
        const jsonText = response.text.trim();
        const headers = JSON.parse(jsonText);
        if (Array.isArray(headers) && headers.every(h => typeof h === 'string')) {
            return headers;
        }
        throw new Error("AI returned an invalid format for headers.");
    } catch (e) {
        console.error("Failed to parse headers from Gemini:", e);
        throw new Error("The AI failed to suggest headers. The document might be unreadable or in an unsupported format.");
    }
};

export const extractData = async (file: UploadedFile, headers: string[], instructions: string): Promise<Record<string, string>> => {
    const imagePart = await fileToGenerativePart(file.file);
    const headersString = headers.filter(h => h !== 'S.No' && h !== 'Document Name').map(h => `"${h}"`).join(', ');

    const prompt = `
        You are a data extraction expert. From the attached document, extract the data for the following fields: ${headersString}.
        ${instructions ? `Follow these additional instructions carefully: ${instructions}` : ''}
        
        Return your answer as a single JSON object where the keys are the field names and the values are the extracted data.
        If a value for a field is not found, return an empty string "" for that field.
        The JSON object should have exactly these keys: ${headersString}.
        
        Example response format:
        {
            "Invoice Number": "INV-123",
            "Date": "2023-10-27",
            "Total Amount": "150.00"
        }
        
        Return ONLY the JSON object. Do not return any other text, explanations, or markdown formatting.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    try {
        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // Ensure all values are strings
            const result: Record<string, string> = {};
            for (const key in data) {
                result[key] = String(data[key]);
            }
            return result;
        }
        throw new Error("AI returned an invalid format for extracted data.");
    } catch (e) {
        console.error("Failed to parse extracted data from Gemini:", e);
        throw new Error("The AI failed to extract data. The document might be complex or unreadable.");
    }
};