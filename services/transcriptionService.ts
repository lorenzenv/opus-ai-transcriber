/**
 * Sends audio data to the server for transcription.
 * @param base64Audio The base64-encoded audio data.
 * @param mimeType The MIME type of the audio data (e.g., audio/opus or audio/ogg).
 * @returns A promise that resolves with the transcription text.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    console.log("Sending transcription request to server...");
    try {
        const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ base64Audio, mimeType }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Received transcription from server.");
        
        if (typeof data.transcription !== "string") {
            throw new Error("Received invalid transcription data from server.");
        }
        
        return data.transcription;
    } catch (error: any) {
        console.error("Error received from server during transcription:", error);
        throw new Error(error.message || "An unknown error occurred during transcription.");
    }
}
