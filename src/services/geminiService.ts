
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const extractDataFromFiles = async (file: File): Promise<Record<string, string>[]> => {
    const base64Image = await fileToBase64(file);

    const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image: base64Image,
            mimeType: file.type,
        }),
    });

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            // Response was not JSON
        }
        throw new Error(errorMessage);
    }

    const data: Record<string, string>[] = await response.json();
    return data;
};
