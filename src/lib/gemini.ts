import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

// We use the latest experimental model which supports optimized reasoning and multimodal inputs
const MODEL_NAME = "gemini-2.0-flash-exp";

export async function analyzeScene(
    imageBase64: string,
    promptContext: string,
    mode: 'detect' | 'reason' | 'assist'
) {
    if (!apiKey) {
        throw new Error("Missing Gemini API Key");
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let systemInstruction = "";

    // Tailor the persona based on the mode
    if (mode === 'reason') {
        systemInstruction = `
      You are AURA (Augmented Reasoning Assistant). 
      DO NOT just describe the image. 
      ANALYZE the causal relationships, potential future states, and hidden context.
      Format your response as a JSON object with: 
      - 'observation': visible facts
      - 'reasoning': the logic connecting facts to a conclusion
      - 'suggestion': actionable advice
      - 'confidence': a percentage number
    `;
    } else if (mode === 'detect') {
        systemInstruction = `
      Identify key technical or organic components in the frame. 
      Be brief and precise. Returns a JSON list of items with status.
    `;
    } else {
        systemInstruction = `
      You are a helpful expert guide. 
      Provide step-by-step instructions based on what you see.
    `;
    }

    // Convert base64 to GenerativePart
    const imagePart = {
        inlineData: {
            data: imageBase64.split(',')[1],
            mimeType: "image/jpeg",
        },
    };

    const result = await model.generateContent([
        systemInstruction,
        promptContext,
        imagePart
    ]);

    const response = await result.response;
    return response.text();
}
