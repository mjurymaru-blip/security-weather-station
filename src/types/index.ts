/**
 * Security Weather Station - Core Type Definitions
 */

// =============================================================================
// News & Data Types
// =============================================================================

/**
 * ニュースソースの種別
 */
export type NewsSource = 'nvd' | 'jpcert' | 'ipa' | 'jvn' | 'rss';

/**
 * 収集されたニュースアイテム（Collector出力）
 */
export interface NewsItem {
  id: string;
  title: string;
  source: NewsSource;
  sourceUrl: string;
  publishedAt: Date;
  cvssScore?: number;
  affectedSystems?: string[];
  rawContent: string;
}

// =============================================================================
// Orchestrator Types
// =============================================================================

/**
 * Orchestratorの戦略タイプ
 */
export type Strategy = 'brief' | 'normal' | 'deep';

/**
 * Orchestratorのトーン設定
 */
export type Tone = 'calm' | 'cautious' | 'alert';

/**
 * Orchestrator Agent の出力
 */
export interface OrchestratorOutput {
  strategy: Strategy;
  tone: Tone;
  reason: string;
  focusItems: string[];
}

// =============================================================================
// Weather Scoring Types
// =============================================================================

/**
 * 天気スコアの各要素
 */
export interface WeatherScores {
  /** 今日の関連ニュース数 (0-1) */
  volume: number;
  /** CVSS / 影響度の最大値 (0-1) */
  severity: number;
  /** 技術スタック一致率 (0-1) */
  relevance: number;
  /** 昨日比 (0-1, 0.5が変化なし) */
  trend: number;
}

/**
 * 天気状態
 */
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

// =============================================================================
// Analyst Types
// =============================================================================

/**
 * 分析されたニュースアイテム
 */
export interface AnalyzedItem {
  id: string;
  title: string;
  threatLevel: number; // 1-5
  summary: string;
  relevanceScore: number; // 0-1
}

/**
 * Analyst Agent の出力
 */
export interface AnalystOutput {
  weatherCondition: WeatherCondition;
  threatLevel: number; // 1-5
  summary: string;
  relevanceReason: string;
  analyzedItems: AnalyzedItem[];
}

// =============================================================================
// Narrator Types
// =============================================================================

/**
 * Narratorのモード
 */
export type NarratorMode = 'forecast' | 'review';

/**
 * Narrator Agent の出力
 */
export interface NarratorOutput {
  mode: NarratorMode;
  headline: string;
  body: string;
  closingRemark: string;
}

// =============================================================================
// User Profile Types
// =============================================================================

/**
 * ユーザーの技術スタックプロファイル
 */
export interface UserProfile {
  techStack: string[];
  interests: string[];
}

/**
 * デフォルトのユーザープロファイル
 */
export const DEFAULT_USER_PROFILE: UserProfile = {
  techStack: ['Linux', 'Docker', 'Next.js', 'PostgreSQL', 'Node.js'],
  interests: ['OSS', 'Web Security', 'Cloud'],
};
