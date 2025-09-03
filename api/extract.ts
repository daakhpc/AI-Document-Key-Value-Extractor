
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
            You are an expert data extraction AI.
            Analyze the provided document (image or PDF) and extract all distinct key-value pairs.
            For example, if you see "Invoice Number: INV-123", you should extract { "key": "Invoice Number", "value": "INV-123" }.
            Do not create keys that are generic like 'Address Line 1'. Instead, use the label if present, e.g., 'Shipping Address'.
            Consolidate multi-line values into a single string.
            Return the result as a JSON array of objects, where each object has a "key" and a "value" property.
            If the document is not a form or does not contain clear key-value pairs, return an empty array.
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
                            key: {
                                type: Type.STRING,
                                description: 'The label or key for the data point.'
                            },
                            value: {
                                type: Type.STRING,
                                description: 'The corresponding value for the key.'
                            }
                        },
                        required: ["key", "value"]
                    }
                }
            }
        });
        
        const jsonText = geminiResponse.text.trim();
        if (!jsonText) {
            return res.status(500).json({ error: "The model returned an empty response. The document might not contain extractable key-value pairs." });
        }
        
        const parsedData = JSON.parse(jsonText);

        if (!Array.isArray(parsedData)) {
            return res.status(500).json({ error: "Invalid data format received from AI. Expected an array." });
        }

        const isValid = parsedData.every((item: any) => typeof item.key === 'string' && typeof item.value === 'string');
        if (!isValid) {
            return res.status(500).json({ error: "Invalid item format in data received from AI." });
        }

        return res.status(200).json(parsedData);

    } catch (e: any) {
        console.error("Gemini API call failed", e);
        const errorMessage = e.message || "An unknown error occurred";
        return res.status(500).json({ error: `Failed to process document with AI. ${errorMessage}` });
    }
}
