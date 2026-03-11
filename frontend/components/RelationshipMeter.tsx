import React from 'react';

export default function RelationshipMeter({ score }: { score: number }) {
    const hearts = Math.round(score / 20); // 0 to 5
    const emptyHearts = 5 - hearts;

    return (
        <div className="pixel-card pulse-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 className="section-title">💕 Relationship</h2>

            <div className="hearts-row heart-beat" style={{ marginBottom: '1rem' }}>
                {Array(Math.max(0, hearts)).fill(null).map((_, i) => (
                    <span key={`h-${i}`} style={{ filter: 'drop-shadow(0 0 6px rgba(255, 107, 157, 0.6))' }}>❤️</span>
                ))}
                {Array(Math.max(0, emptyHearts)).fill(null).map((_, i) => (
                    <span key={`e-${i}`} style={{ opacity: 0.3 }}>🖤</span>
                ))}
            </div>

            <div className="score-bar-track" style={{ marginBottom: '0.75rem' }}>
                <div className="score-bar-fill" style={{ width: `${score}%` }} />
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--pink-soft)' }}>
                {score}/100
            </div>
        </div>
    );
}
