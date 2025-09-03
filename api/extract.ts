
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
        return res.status(400).json({ error: 'Missing image data or mimeType' });
    }

    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        console.error("API_KEY environment variable not set");
        return res.status(500).json({ error: 'Server configuration error: API key not found.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = `
            You are an expert data extraction AI. Your task is to extract structured data from the provided document.
            The document may contain both document-level fields (e.g., "Invoice Number", "Date") and tabular data (e.g., a list of line items).
            Your goal is to return a JSON array of objects, where each object represents a single row of data.

            - If the document contains a table, each row of that table should become one object in the output array.
            - Any document-level fields that apply to the entire document should be included in *every* object in the array.
            - If the document is a simple form without a table, return a JSON array containing a *single object* with all the extracted key-value pairs.
            - The keys in the JSON objects should be the labels found in the document.
            - Consolidate multi-line values into a single string with spaces.
            - If the document does not contain clear key-value pairs or tabular data, return an empty array.

            For example, for an invoice with two line items, the output should look like this:
            [
              { "Invoice Number": "123", "Date": "2024-01-01", "Description": "Product A", "Quantity": "2", "Price": "10.00" },
              { "Invoice Number": "123", "Date": "2024-01-01", "Description": "Product B", "Quantity": "1", "Price": "20.00" }
            ]

            If the document is a business card, the output should be:
            [
              { "Name": "John Doe", "Title": "Software Engineer", "Phone": "555-1234" }
            ]

            Return ONLY the JSON array. Do not return any other text, explanations, or markdown formatting.
        `;

        const imagePart = {
            inlineData: { data: image, mimeType: mimeType },
        };

        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonText = geminiResponse.text.trim();
        if (!jsonText) {
            return res.status(200).json([]); // Return empty array if model returns nothing
        }
        
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData)) {
            return res.status(500).json({ error: "Invalid data format received from AI. Expected an array." });
        }

        const isValid = parsedData.every((item: any) => typeof item === 'object' && item !== null && !Array.isArray(item));
        if (!isValid) {
            return res.status(500).json({ error: "Invalid item format in data received from AI. Expected an array of objects." });
        }
        
        // Ensure all values are strings
        const dataWithStrings = parsedData.map((row: any) => {
            const newRow: Record<string, string> = {};
            for (const key in row) {
                if (Object.prototype.hasOwnProperty.call(row, key)) {
                    newRow[key] = String(row[key]);
                }
            }
            return newRow;
        });


        return res.status(200).json(dataWithStrings);

    } catch (e: any) {
        console.error("Gemini API call failed", e);
        const errorMessage = e.message || "An unknown error occurred";
        return res.status(500).json({ error: `Failed to process document with AI. ${errorMessage}` });
    }
}