import { getMockReport } from '@/data/mock-reports';
import {
  WeatherIcon,
  ThreatGauge,
  ModeBadge,
  BroadcastCard,
  RelevanceCard,
  NewsList,
} from '@/components';
import type { WeatherCondition } from '@/types';
import Link from 'next/link';

// 動的レンダリング（キャッシュ無効化）
export const dynamic = 'force-dynamic';

function getWeatherClass(condition: WeatherCondition): string {
  const classes: Record<WeatherCondition, string> = {
    sunny: 'weather-sunny',
    cloudy: 'weather-cloudy',
    rainy: 'weather-rainy',
    stormy: 'weather-stormy',
  };
  return classes[condition];
}

interface PageProps {
  searchParams: Promise<{ weather?: string; review?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const isReview = params.review === 'true';
  const report = getMockReport(params.weather, isReview);

  return (
    <div className={`min-h-screen ${getWeatherClass(report.weatherCondition)}`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Demo Mode Banner */}
        <div className="mb-6 p-3 rounded-lg bg-black/20 backdrop-blur text-center text-sm">
          <span className="opacity-70">🎮 デモモード</span>
          <div className="flex justify-center gap-2 mt-2 flex-wrap">
            <Link href="/?weather=sunny" className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition">
              ☀️ 晴れ
            </Link>
            <Link href="/?weather=cloudy" className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition">
              ☁️ 曇り
            </Link>
            <Link href="/?weather=rainy" className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition">
              🌧️ 雨
            </Link>
            <Link href="/?weather=stormy" className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition">
              ⛈️ 嵐
            </Link>
            <Link href="/?weather=cloudy&review=true" className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition">
              🌙 夜
            </Link>
          </div>
        </div>

        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <ModeBadge mode={report.mode} />
            <span className="timestamp">
              {new Date(report.generatedAt).toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <WeatherIcon condition={report.weatherCondition} size="lg" />
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Threat Gauge */}
          <div className="card">
            <ThreatGauge level={report.threatLevel} />
          </div>

          {/* Broadcast */}
          <BroadcastCard
            headline={report.headline}
            body={report.body}
            closingRemark={report.closingRemark}
          />

          {/* Relevance */}
          <RelevanceCard reason={report.relevanceReason} />

          {/* News List */}
          <NewsList items={report.analyzedItems} />
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs opacity-50">
            Security Weather Station
            <br />
            Powered by Gemini AI
          </p>
        </footer>
      </div>
    </div>
  );
}
