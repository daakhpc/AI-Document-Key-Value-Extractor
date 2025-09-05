import type { VercelRequest, VercelResponse } from '@vercel/node';
// FIX: Import Type from @google/genai to define response schemas.
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

// FIX: Validate API_KEY at the module level to prevent the function from running with an invalid configuration.
if (!API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// FIX: Update generateContent to accept a response schema for more reliable JSON output.
const generateContent = async (prompt: string, imageParts: any[], schema?: object) => {
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            ...(schema && { responseSchema: schema })
        }
    });
};

const handleIdentifyHeaders = async (payload: any, res: VercelResponse) => {
    const { files } = payload;
    if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'No files provided for header identification.' });
    }

    const imageParts = files.map(file => ({
        inlineData: { data: file.data, mimeType: file.mimeType },
    }));

    // FIX: Update prompt to be more concise as JSON formatting is now handled by responseSchema.
    const prompt = `
        Analyze the attached documents. Based on their content, suggest a comprehensive list of column headers for data extraction.
        Consider all fields present, including document-level fields and fields within line items.
    `;

    // FIX: Define a response schema to ensure the AI returns a valid array of strings.
    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
    };

    const response = await generateContent(prompt, imageParts, responseSchema);
    
    try {
        // FIX: The response text should be valid JSON due to the schema, but we'll clean it up just in case.
        let jsonText = response.text.trim();
        const jsonMatch = jsonText.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            jsonText = jsonMatch[2];
        }
        const headers = JSON.parse(jsonText);
        if (Array.isArray(headers) && headers.every(h => typeof h === 'string')) {
            return res.status(200).json({ headers });
        }
        throw new Error("AI returned an invalid format for headers.");
    } catch (e: any) {
        console.error("Failed to parse headers from Gemini:", e.message, "Response text:", response.text);
        return res.status(500).json({ error: "The AI failed to suggest headers. The document might be unreadable or in an unsupported format." });
    }
};

const handleExtractData = async (payload: any, res: VercelResponse) => {
    const { file, headers, instructions } = payload;
    if (!file || !Array.isArray(headers)) {
        return res.status(400).json({ error: 'Missing file or headers for data extraction.' });
    }

    const imagePart = {
        inlineData: { data: file.data, mimeType: file.mimeType },
    };

    // FIX: Define a dynamic response schema based on the requested headers.
    const filteredHeaders = headers.filter((h: string) => h !== 'S.No' && h !== 'Document Name');
    const properties: Record<string, object> = {};
    filteredHeaders.forEach((header: string) => {
        properties[header] = {
            type: Type.STRING,
            description: `Extracted value for the field "${header}".`,
        };
    });

    const responseSchema = {
        type: Type.OBJECT,
        properties,
    };

    // FIX: Update prompt to be more concise and rely on the response schema for formatting.
    const prompt = `
        You are a data extraction expert. From the attached document, extract the data for the fields described in the response schema.
        ${instructions ? `Follow these additional instructions carefully: ${instructions}` : ''}
        If a value for a field is not found, return an empty string "" for that field.
    `;
    
    const response = await generateContent(prompt, [imagePart], responseSchema);

    try {
        // FIX: The response text should be valid JSON due to the schema, but we'll clean it up just in case.
        let jsonText = response.text.trim();
        const jsonMatch = jsonText.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            jsonText = jsonMatch[2];
        }
        const data = JSON.parse(jsonText);
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
             // Ensure all values are strings
            const result: Record<string, string> = {};
            for (const key in data) {
                result[key] = String(data[key]);
            }
            return res.status(200).json({ data: result });
        }
        throw new Error("AI returned an invalid format for extracted data.");
    } catch (e: any) {
        console.error("Failed to parse extracted data from Gemini:", e.message, "Response text:", response.text);
        return res.status(500).json({ error: "The AI failed to extract data. The document might be complex or unreadable." });
    }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // FIX: Removed redundant API_KEY check, as it is now handled at the module level.
    const { action, payload } = req.body;

    try {
        switch (action) {
            case 'identify_headers':
                return await handleIdentifyHeaders(payload, res);
            case 'extract_data':
                return await handleExtractData(payload, res);
            default:
                return res.status(400).json({ error: 'Invalid action specified.' });
        }
    } catch (e: any) {
        console.error("Gemini API call failed", e);
        const errorMessage = e.message || "An unknown error occurred";
        return res.status(500).json({ error: `Failed to process document with AI. ${errorMessage}` });
    }
}
