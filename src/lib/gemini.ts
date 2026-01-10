/**
 * Gemini AI Client
 * 
 * Google Generative AI SDKのラッパー
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn('Warning: GEMINI_API_KEY is not set. AI features will not work.');
}

/**
 * Gemini クライアントインスタンス
 */
export const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * デフォルトのモデル設定
 */
export const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Geminiモデルを取得
 */
export function getModel(modelName: string = DEFAULT_MODEL) {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    return genAI.getGenerativeModel({ model: modelName });
}

/**
 * JSON形式でレスポンスを取得
 */
export async function generateJSON<T>(
    prompt: string,
    modelName: string = DEFAULT_MODEL
): Promise<T> {
    const model = getModel(modelName);

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    const response = result.response;
    const text = response.text();

    try {
        return JSON.parse(text) as T;
    } catch {
        throw new Error(`Failed to parse JSON response: ${text}`);
    }
}
