import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * APIキーをテストするエンドポイント
 * 
 * POST /api/test-key
 * Body: { apiKey: string, model?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { apiKey, model } = await request.json();

        if (!apiKey || typeof apiKey !== 'string') {
            return NextResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        // モデルが指定されていない場合は、まずモデル一覧を取得して最初のものを使う
        let modelToUse = model;

        if (!modelToUse) {
            // モデル一覧を取得
            const modelsResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );

            if (!modelsResponse.ok) {
                return NextResponse.json(
                    { error: 'Invalid API key' },
                    { status: 401 }
                );
            }

            const modelsData = await modelsResponse.json();
            const availableModels = (modelsData.models || [])
                .filter((m: { supportedGenerationMethods?: string[] }) =>
                    m.supportedGenerationMethods?.includes('generateContent')
                );

            if (availableModels.length === 0) {
                return NextResponse.json(
                    { error: 'No available models' },
                    { status: 400 }
                );
            }

            // 最初の利用可能なモデルを使用
            modelToUse = availableModels[0].name.replace('models/', '');
        }

        // Gemini APIでテスト
        const genAI = new GoogleGenerativeAI(apiKey);
        const genModel = genAI.getGenerativeModel({ model: modelToUse });

        // 簡単なテストプロンプト
        const result = await genModel.generateContent('Say "OK" if you can read this.');
        const response = result.response;
        const text = response.text();

        if (text) {
            return NextResponse.json({
                success: true,
                message: 'API key is valid',
                model: modelToUse,
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid response from API' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('API key test error:', error);
        return NextResponse.json(
            { error: 'Invalid API key or API error', details: String(error) },
            { status: 401 }
        );
    }
}
