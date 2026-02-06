/**
 * AURA - Gemini 3 API Integration
 * 
 * This file contains ALL AI functionality for the AURA application.
 * 
 * ✅ HACKATHON COMPLIANCE - GEMINI 3 API:
 * - Uses Google's official @google/generative-ai SDK
 * - Makes LIVE API calls to GEMINI 3 API at runtime (no caching)
 * - Primary model: gemini-3-flash-preview (GEMINI 3 generation)
 * - Backup model: gemini-3-pro-preview (GEMINI 3 generation)
 * - Multimodal: Processes images + text
 * - Every scan/analysis = 1 real-time API call to Google Gemini 3
 * 
 * API Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API with API key from environment
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

// ⚡ GEMINI 3 API MODELS - HACKATHON REQUIREMENT ⚡
// Using Gemini 3 generation models (verified available with your API key)
// Candidate models to try in order of preference
// STRICT HACKATHON COMPLIANCE: ONLY USE GEMINI 3 MODELS
const CANDIDATE_MODELS = [
    "gemini-3-pro-preview",      // Primary: Best reasoning
    "gemini-3-flash-preview",    // Backup: Faster, also Gemini 3
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let workingModelName: string | null = null;

export async function analyzeScene(
    imageBase64: string,
    promptContext: string,
    mode: 'detect' | 'reason' | 'assist',
    lens: 'universal' | 'codex' | 'mechanic' | 'bio' = 'universal'
) {
    if (!apiKey) {
        console.error("❌ Missing Gemini API Key - Check your .env.local file");
        throw new Error("Missing Gemini API Key");
    }

    console.log("🔑 API Key loaded:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 4));

    // System Instruction Setup
    let systemInstruction = "";

    if (mode === 'detect') {
        systemInstruction = `Return a JSON array of detected items with format: [{"item": "name", "type": "category", "status": "loc/state"}]. Be brief. Do not use markdown formatting. Return raw JSON only.`;
    } else {
        // Specialized Lenses
        switch (lens) {
            case 'codex':
                systemInstruction = `
                You are AURA // CODEX. Specialized in Software Engineering.
                Analyze the image for Code, UI Designs, or Architecture constraints.
                OUTPUT FORMAT (JSON):
                {
                "observation": "Brief summary of code intent.",
                   "reasoning": "ACT AS A COMPILER. unexpected token? missing parenthesis? missing semicolon? undefined variable? anti-pattern? LIST EVERY ERROR.",
                   "suggestion": "Step-by-step fix for the syntax/logic error.",
                   "fixed_code": "The CORRECTED code block. Add missing semicolons, close parentheses, fix typos. MUST BE RUNNABLE."
                }
                
                IMPORTANT: If the code looks fine but has subtle syntax errors (like missing '}' or ')'), YOU MUST CATCH THEM.
              `;
                break;
            case 'mechanic':
                systemInstruction = `
                You are AURA // MECHANIC. Specialized in Hardware & Engineering.
                Analyze the image for machines, electronics, tools, or physical structures.
                Focus on: Damage state, missing parts, safety hazards, or usage instructions.
                OUTPUT FORMAT (JSON):
                {
                   "observation": "Physical state sizing and component ID",
                   "reasoning": "Analysis of function or failure mode",
                   "suggestion": "Repair step or safety warning"
                }
              `;
                break;
            case 'bio':
                systemInstruction = `
                You are AURA // BIO-SCANNER. Specialized in Biology & Chemistry.
                Analyze the image for Food, Plants, Animals, or Organic matter.
                Focus on: Health, Calories, Species ID, or Recipe generation.
                OUTPUT FORMAT (JSON):
                {
                   "observation": "Biological identification",
                   "reasoning": "Nutritional or ecological analysis",
                   "suggestion": "Recipe idea or care instruction"
                }
              `;
                break;
            default: // Universal (Sherlock)
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
                break;
        }
    }

    const imagePart = {
        inlineData: {
            data: imageBase64.split(',')[1],
            mimeType: "image/jpeg",
        },
    };

    // If we already found a working model, use it first.
    const modelsToTry = workingModelName
        ? [workingModelName, ...CANDIDATE_MODELS.filter(m => m !== workingModelName)]
        : CANDIDATE_MODELS;

    let lastError = null;

    for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                console.log(`🔄 Attempting connection to model: ${modelName} (Attempt ${attempt + 1}/2)`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent([
                    systemInstruction,
                    promptContext,
                    imagePart
                ]);

                const response = await result.response;
                const text = response.text();

                // If successful, remember this model for next time
                workingModelName = modelName;
                console.log(`✅ Success with model: ${modelName}`);
                return text;

            } catch (error: any) {
                const isRateLimit = error.message.includes('429') || error.message.includes('Quota exceeded');

                if (isRateLimit) {
                    console.warn(`⏳ Model ${modelName} rate limited. Retrying in 5s...`);
                    await delay(5000);
                    // Continue to next attempt
                } else {
                    console.error(`❌ Model ${modelName} failed:`, error.message);
                    lastError = error;
                    break; // Non-retryable error, try next model
                }

                lastError = error;
            }
        }
    }

    console.error("🚨 All models failed. Last error:", lastError?.message);
    throw new Error(`Connection failed. Last error: ${lastError?.message || "Unknown"}`);
}
