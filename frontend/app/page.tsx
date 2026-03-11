"use client";
import React, { useEffect, useState } from 'react';
import PixelInbox from '@/components/PixelInbox';
import RelationshipMeter from '@/components/RelationshipMeter';

export default function Home() {
  const [state, setState] = useState({
    relationship_score: 50,
    arguments: 0,
    messages_sent: 0,
    breakups: 0,
    messages: []
  });
  const [started, setStarted] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/state`)
        .then(res => res.json())
        .then(data => setState(data))
        .catch(err => console.error(err));
    }, 1000);

    return () => clearInterval(interval);
  }, [BACKEND_URL]);

  const handleStart = async () => {
    setStarted(true);
    await fetch(`${BACKEND_URL}/start`, { method: 'POST' });
  };

  const statusLabel = state.relationship_score > 70 ? 'In Love' : state.relationship_score < 30 ? "It's Complicated" : 'Dating';
  const statusClass = state.relationship_score > 70 ? 'love' : state.relationship_score < 30 ? 'complicated' : 'dating';

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* ─── Header ─── */}
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
          background: 'linear-gradient(135deg, #ff6b9d, #a855f7, #60a5fa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.75rem',
          lineHeight: 1.4,
          filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.3))',
        }}>
          💌 AI LOVE PROTOCOL 💌
        </h1>
        <div style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
          Romantic <span style={{ color: 'var(--pink-glow)' }}>❤️</span> Skeptic
        </div>
        <div>
          <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
        </div>
      </header>

      {/* ─── START DRAMA ─── */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="drama-btn" onClick={handleStart}>
          {started ? '⚡ DRAMA IN PROGRESS ⚡' : '💥 START DRAMA 💥'}
        </button>
      </div>

      {/* ─── Two-col: Meter + Metrics ─── */}
      <div className="two-col" style={{ marginBottom: '2rem' }}>
        <RelationshipMeter score={state.relationship_score} />

        <div className="pixel-card pulse-glow">
          <h2 className="section-title">📊 Metrics</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="stat-row">
              <span style={{ color: 'var(--text-muted)' }}>💬 Messages</span>
              <span className="stat-value" style={{ color: 'var(--blue-glow)' }}>{state.messages_sent}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--text-muted)' }}>🔥 Arguments</span>
              <span className="stat-value" style={{ color: 'var(--pink-glow)' }}>{state.arguments}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: 'var(--text-muted)' }}>💔 Breakups</span>
              <span className="stat-value" style={{ color: 'var(--purple-glow)' }}>{state.breakups}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Email Thread ─── */}
      <PixelInbox messages={state.messages} />
    </main>
  );
}
