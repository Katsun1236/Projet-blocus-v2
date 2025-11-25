
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
// process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a synthesis based on provided text content.
 * @param {string} text - The course content text.
 * @param {string} style - The desired style (Standard, Bullet Points, etc.).
 * @param {number} wordCount - Approximate word count.
 * @returns {Promise<string>} - The generated HTML content.
 */
export async function generateSynthesis(text, style, wordCount) {
    const modelId = "gemini-2.5-flash";
    
    const prompt = `
    You are an expert academic tutor. 
    Based on the following course content, create a high-quality study summary.
    
    **Configuration:**
    - Style: ${style}
    - Approximate Length: ${wordCount} words
    - Output Format: Clean semantic HTML (use <h2>, <p>, <ul>, <li>, <strong>). Do not use <h1>, <html>, <body> or markdown code blocks.
    - Language: French (Français).

    **Course Content:**
    ${text.substring(0, 30000)} 
    
    Generate the summary now.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Gemini Synthesis Error:", error);
        throw error;
    }
}

/**
 * Generates a quiz based on provided text content.
 * @param {string} text - The course content.
 * @param {number} count - Number of questions.
 * @param {string} difficulty - Difficulty level.
 * @param {string} type - 'QCM', 'Vrai/Faux', 'Mixte' or 'Flashcards'.
 * @returns {Promise<Object>} - The structured quiz or flashcards data.
 */
export async function generateQuizOrFlashcards(text, count, difficulty, type) {
    const modelId = "gemini-2.5-flash";
    const isFlashcards = type === 'Flashcards';
    
    let systemInstruction = "";
    let responseSchema = null;

    if (isFlashcards) {
        systemInstruction = `You are a teacher creating flashcards for students. Difficulty: ${difficulty}. Language: French.`;
        // Defining schema for Flashcards
        responseSchema = {
            type: "OBJECT",
            properties: {
                flashcards: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            term: { type: "STRING" },
                            definition: { type: "STRING" }
                        },
                        required: ["term", "definition"]
                    }
                }
            }
        };
    } else {
        systemInstruction = `You are a teacher creating a quiz. Type: ${type}. Difficulty: ${difficulty}. Language: French.`;
        // Defining schema for Quiz
        responseSchema = {
            type: "OBJECT",
            properties: {
                quiz: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            question: { type: "STRING" },
                            options: { 
                                type: "ARRAY", 
                                items: { type: "STRING" },
                                description: "List of 4 possible answers if multiple choice, or just empty for open questions."
                            },
                            answer: { type: "STRING", description: "The correct answer text" },
                            explanation: { type: "STRING", description: "Brief explanation of why this is correct" }
                        },
                        required: ["question", "answer", "options"]
                    }
                }
            }
        };
    }

    const prompt = `
    Generate ${count} items based on the text below.
    
    **Text:**
    ${text.substring(0, 30000)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                systemInstruction: systemInstruction
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini Quiz Error:", error);
        throw error;
    }
}
