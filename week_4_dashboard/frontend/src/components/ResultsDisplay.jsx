import React from 'react';
import { Loader2, AlertCircle, Megaphone, Twitter, FileText, Image as ImageIcon } from 'lucide-react';

export default function ResultsDisplay({ taskId, status, result, error }) {
  // Empty State
  if (!taskId && !result && !error) {
    return (
      <div className="premium-panel empty-state">
        <Megaphone className="empty-state-icon" />
        <h3 className="empty-state-title">No Campaign Generated Yet</h3>
        <p>Fill out the form on the left to queue an asynchronous AI marketing campaign generation task.</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="premium-panel">
        <div className="error-banner">
          <AlertCircle size={28} />
          <div>
            <strong>Generation Failed</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Polling / Progress State
  if (status && status !== 'SUCCESS' && status !== 'FAILURE') {
    return (
      <div className="premium-panel polling-container">
        <div className="polling-icon-wrapper">
          <Loader2 size={36} className="status-dot" style={{ animation: 'spin 1.5s linear infinite', backgroundColor: 'transparent' }} />
        </div>
        <h3 className="polling-status-title">Generating Your Campaign</h3>
        <p className="polling-status-text">
          Our advanced artificial intelligence engine is crafting your premium marketing copy (Blog Post & 3 Tweets) and engineering 2 promotional images. Please hang tight...
        </p>
        <div className="progress-bar-container">
          <div className="progress-bar-fill"></div>
        </div>
        <div className="task-id-badge">Task ID: {taskId}</div>
      </div>
    );
  }

  // Success State
  if (status === 'SUCCESS' && result) {
    const copy = result.copy || {};
    const assetUrls = result.asset_urls || [];
    const tweets = copy.tweets || [];

    return (
      <div className="premium-panel result-card" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Header */}
        <div className="result-header" style={{ marginBottom: 0 }}>
          <h2 className="result-title">{copy.headline || 'Your Marketing Campaign Package'}</h2>
          <span className="result-badge">Package Ready</span>
        </div>

        {/* Blog Post Section */}
        <div className="result-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent)' }}>
            <FileText size={20} />
            Official Blog Post
          </h3>
          <div className="result-body" style={{ marginBottom: 0 }}>
            <p className="result-text" style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
              {copy.blog_post || copy.body_copy || 'No blog post content generated.'}
            </p>
          </div>
        </div>

        {/* 3 Tweet Variants Section */}
        <div className="result-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#1da1f2' }}>
            <Twitter size={20} />
            3 Tweet Variants
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tweets.map((tweet, index) => (
              <div key={index} style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Twitter size={24} style={{ color: '#1da1f2', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Variant {index + 1}</div>
                  <p style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{tweet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2 AI Promotional Images Section */}
        {assetUrls.length > 0 && (
          <div className="result-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
              <ImageIcon size={20} />
              2 AI Promotional Images
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {assetUrls.map((url, index) => (
                <div key={index} className="result-media" style={{ marginBottom: 0 }}>
                  <div style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Promotional Asset #{index + 1}
                  </div>
                  <img src={url} alt={`Promotional Asset ${index + 1}`} className="result-image" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="task-id-badge" style={{ marginTop: '0.5rem' }}>
          Completed Task ID: {taskId}
        </div>
      </div>
    );
  }

  return null;
}
