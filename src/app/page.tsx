import { runWeatherPipeline } from '@/actions/pipeline';
import {
  WeatherIcon,
  ThreatGauge,
  ModeBadge,
  BroadcastCard,
  RelevanceCard,
  NewsList,
} from '@/components';
import type { WeatherCondition } from '@/types';

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

export default async function Home() {
  const report = await runWeatherPipeline();

  return (
    <div className={`min-h-screen ${getWeatherClass(report.weatherCondition)}`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
