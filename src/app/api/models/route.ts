import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 利用可能なモデル一覧を取得するエンドポイント
 * 
 * POST /api/models
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

        // Gemini APIでモデル一覧を取得
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch models' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // generateContent をサポートするモデルのみフィルタリング
        const models = (data.models || [])
            .filter((model: { supportedGenerationMethods?: string[] }) =>
                model.supportedGenerationMethods?.includes('generateContent')
            )
            .map((model: { name: string; displayName: string; description?: string }) => ({
                id: model.name.replace('models/', ''),
                name: model.displayName,
                description: model.description || '',
            }));

        return NextResponse.json({ success: true, models });
    } catch (error) {
        console.error('Models fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch models' },
            { status: 500 }
        );
    }
}
