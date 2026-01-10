/**
 * モックデータ - 天気UIの動作確認用
 */

import type { WeatherReport } from '@/actions/pipeline';
import type { WeatherCondition } from '@/types';

/**
 * 各天気状態のモックレポート
 */
export const MOCK_REPORTS: Record<WeatherCondition, WeatherReport> = {
    sunny: {
        generatedAt: new Date(),
        mode: 'forecast',
        weatherCondition: 'sunny',
        threatLevel: 1,
        headline: '☀️ 今日のインターネットは晴れ',
        body: '本日は特に注目すべきセキュリティニュースはありません。穏やかな一日になりそうです。開発に集中できる日ですね。',
        closingRemark: '引き続き、安全なインターネットライフをお過ごしください。',
        relevanceReason: '特に対応が必要な項目はありません。',
        analyzedItems: [],
        newsItems: [],
        orchestratorOutput: {
            strategy: 'brief',
            tone: 'calm',
            reason: '本日は関連するセキュリティニュースがありません',
            focusItems: [],
        },
    },

    cloudy: {
        generatedAt: new Date(),
        mode: 'forecast',
        weatherCondition: 'cloudy',
        threatLevel: 2,
        headline: '☁️ 今日のインターネットは曇り空',
        body: 'いくつかのセキュリティアップデートが公開されています。緊急性は低いですが、週末までに確認しておくと安心です。',
        closingRemark: '定期的なアップデート確認を心がけましょう。',
        relevanceReason: 'Node.js のマイナーアップデートがあり、依存パッケージの更新を推奨します。',
        analyzedItems: [
            {
                id: 'mock-1',
                title: 'Node.js v20.11.0 セキュリティアップデート',
                threatLevel: 2,
                summary: 'HTTP/2 関連の軽微な脆弱性修正。ローカル開発環境では影響軽微。',
                relevanceScore: 0.4,
            },
            {
                id: 'mock-2',
                title: 'npm パッケージ依存関係の脆弱性警告',
                threatLevel: 2,
                summary: '一部の開発用パッケージに低リスクの脆弱性。npm audit で確認推奨。',
                relevanceScore: 0.3,
            },
        ],
        newsItems: [],
        orchestratorOutput: {
            strategy: 'normal',
            tone: 'calm',
            reason: '軽微なアップデートがいくつか存在',
            focusItems: ['Node.js v20.11.0 セキュリティアップデート'],
        },
    },

    rainy: {
        generatedAt: new Date(),
        mode: 'forecast',
        weatherCondition: 'rainy',
        threatLevel: 3,
        headline: '🌧️ 今日のインターネットは雨模様',
        body: 'Docker関連の重要なセキュリティアップデートが公開されました。コンテナを運用中の方は、今週中のアップデートを検討してください。',
        closingRemark: '傘を忘れずに。早めの対応が安心につながります。',
        relevanceReason: 'Docker を利用中のため、コンテナランタイムの脆弱性に注意が必要です。',
        analyzedItems: [
            {
                id: 'mock-3',
                title: 'Docker Engine 24.0.8 緊急アップデート',
                threatLevel: 4,
                summary: 'コンテナエスケープの脆弱性修正。本番環境は即時アップデート推奨。',
                relevanceScore: 0.8,
            },
            {
                id: 'mock-4',
                title: 'PostgreSQL 16.2 セキュリティリリース',
                threatLevel: 3,
                summary: '権限昇格の脆弱性修正。リモートからの悪用は困難だが対応推奨。',
                relevanceScore: 0.6,
            },
            {
                id: 'mock-5',
                title: 'Linux Kernel ローカル権限昇格',
                threatLevel: 3,
                summary: 'CVE-2024-XXXX。ローカルユーザーが root 権限を取得可能。パッチ適用推奨。',
                relevanceScore: 0.5,
            },
        ],
        newsItems: [],
        orchestratorOutput: {
            strategy: 'normal',
            tone: 'cautious',
            reason: 'Docker関連の重要な脆弱性が報告されている',
            focusItems: ['Docker Engine 24.0.8 緊急アップデート', 'PostgreSQL 16.2 セキュリティリリース'],
        },
    },

    stormy: {
        generatedAt: new Date(),
        mode: 'forecast',
        weatherCondition: 'stormy',
        threatLevel: 5,
        headline: '⛈️ 警報: インターネットは嵐の中！',
        body: '重大なゼロデイ脆弱性が活発に悪用されています。Next.js を使用している場合、直ちにバージョンを確認し、影響を受けるバージョンであれば即座にアップデートしてください。',
        closingRemark: '⚠️ 警戒態勢で臨んでください。不審なアクセスがあれば即座に対応を。',
        relevanceReason: 'Next.js を使用中のため、直接的な影響があります。本番環境は即時対応が必要です。',
        analyzedItems: [
            {
                id: 'mock-6',
                title: '【緊急】Next.js Server Actions にRCE脆弱性',
                threatLevel: 5,
                summary: 'CVE-2024-YYYY。リモートコード実行が可能。野良エクスプロイトが出回っている。',
                relevanceScore: 1.0,
            },
            {
                id: 'mock-7',
                title: 'Vercel が緊急パッチをリリース',
                threatLevel: 5,
                summary: 'Next.js 14.1.1, 13.5.7 にアップデート必須。Vercel ホスティングは自動適用済み。',
                relevanceScore: 1.0,
            },
            {
                id: 'mock-8',
                title: 'CISA が緊急警告を発令',
                threatLevel: 4,
                summary: '72時間以内のパッチ適用を推奨。政府機関は即時対応が義務付け。',
                relevanceScore: 0.7,
            },
            {
                id: 'mock-9',
                title: 'AWS, GCP が影響調査を発表',
                threatLevel: 3,
                summary: 'マネージドサービスへの影響は限定的。ユーザー管理のインスタンスは確認推奨。',
                relevanceScore: 0.5,
            },
        ],
        newsItems: [],
        orchestratorOutput: {
            strategy: 'deep',
            tone: 'alert',
            reason: 'Next.js の重大な脆弱性が活発に悪用されている',
            focusItems: [
                '【緊急】Next.js Server Actions にRCE脆弱性',
                'Vercel が緊急パッチをリリース',
            ],
        },
    },
};

/**
 * 夜モード（振り返り）用のモック
 */
export const MOCK_REVIEW_REPORT: WeatherReport = {
    generatedAt: new Date(),
    mode: 'review',
    weatherCondition: 'cloudy',
    threatLevel: 2,
    headline: '☁️ 本日のインターネットは曇りでした',
    body: '朝の予報通り、大きな問題は発生しませんでした。Node.js のアップデートは確認できましたでしょうか？明日も穏やかな天気が続く見込みです。',
    closingRemark: 'お疲れさまでした。明日も安全な一日を。',
    relevanceReason: '本日発表されたアップデートは概ね対応完了。継続的な監視を推奨。',
    analyzedItems: [
        {
            id: 'mock-r1',
            title: 'Node.js v20.11.0 セキュリティアップデート',
            threatLevel: 2,
            summary: '✅ 対応完了。次回リリースでの確認不要。',
            relevanceScore: 0.3,
        },
    ],
    newsItems: [],
    orchestratorOutput: {
        strategy: 'brief',
        tone: 'calm',
        reason: '本日は平穏な一日でした',
        focusItems: [],
    },
};

/**
 * デモ用の天気を取得（クエリパラメータで切り替え）
 */
export function getMockReport(weather?: string, isReview?: boolean): WeatherReport {
    if (isReview) {
        return MOCK_REVIEW_REPORT;
    }

    const condition = weather as WeatherCondition;
    if (condition && MOCK_REPORTS[condition]) {
        return MOCK_REPORTS[condition];
    }

    // デフォルトは sunny
    return MOCK_REPORTS.sunny;
}
