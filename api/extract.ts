
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

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
            You are an expert data extraction AI. Your task is to extract all key-value pairs from the provided document.
            Return a JSON array of objects, where each object has two keys: "key" and "value".
            - The "key" should be the label or field name found in the document.
            - The "value" should be the corresponding data for that label.
            - Consolidate multi-line values into a single string.
            - If a field has no value, you can omit it.
            - Order the pairs logically as they appear in the document.

            Example response format:
            [
              { "key": "Invoice Number", "value": "123" },
              { "key": "Date", "value": "2024-01-01" },
              { "key": "Name", "value": "John Doe" }
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
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            key: { type: Type.STRING },
                            value: { type: Type.STRING }
                        },
                        required: ["key", "value"]
                    }
                }
            }
        });
        
        const jsonText = geminiResponse.text.trim();
        if (!jsonText) {
            return res.status(200).json([]); // Return empty array if model returns nothing
        }
        
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData)) {
            return res.status(500).json({ error: "Invalid data format from AI. Expected an array." });
        }

        // Validate that each item in the array is a KeyValuePair
        const isValid = parsedData.every((item: any) =>
            typeof item === 'object' &&
            item !== null &&
            !Array.isArray(item) &&
            'key' in item &&
            'value' in item &&
            typeof item.key === 'string'
        );

        if (!isValid) {
            return res.status(500).json({ error: "Invalid item format in data from AI. Expected {key: string, value: string} objects." });
        }
        
        // Ensure all values are strings, as expected by the frontend
        const finalData = parsedData.map((item: { key: string; value: any }) => ({
            key: item.key,
            value: String(item.value),
        }));

        return res.status(200).json(finalData);

    } catch (e: any) {
        console.error("Gemini API call failed", e);
        const errorMessage = e.message || "An unknown error occurred";
        return res.status(500).json({ error: `Failed to process document with AI. ${errorMessage}` });
    }
}
