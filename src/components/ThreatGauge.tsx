'use client';

interface ThreatGaugeProps {
    level: number; // 1-5
}

export function ThreatGauge({ level }: ThreatGaugeProps) {
    const clampedLevel = Math.max(1, Math.min(5, level));

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="opacity-70">脅威レベル</span>
                <span className="font-bold">{clampedLevel}/5</span>
            </div>
            <div className="threat-gauge">
                {[1, 2, 3, 4, 5].map((segment) => (
                    <div
                        key={segment}
                        className={`threat-gauge-segment threat-${segment} ${segment <= clampedLevel ? 'active' : ''
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
