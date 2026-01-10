import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * APIキーをテストするエンドポイント
 * 
 * POST /api/test-key
 * Body: { apiKey: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { apiKey } = await request.json();

        if (!apiKey || typeof apiKey !== 'string') {
            return NextResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        // Gemini APIでテスト
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // 簡単なテストプロンプト
        const result = await model.generateContent('Say "OK" if you can read this.');
        const response = result.response;
        const text = response.text();

        if (text) {
            return NextResponse.json({ success: true, message: 'API key is valid' });
        } else {
            return NextResponse.json(
                { error: 'Invalid response from API' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('API key test error:', error);
        return NextResponse.json(
            { error: 'Invalid API key or API error' },
            { status: 401 }
        );
    }
}
