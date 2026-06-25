import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Megaphone, ArrowRight } from 'lucide-react';

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
          Our advanced artificial intelligence engine is crafting your premium marketing copy and engineering your visual assets. Please hang tight...
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
    const assetUrl = result.asset_url || '';

    return (
      <div className="premium-panel result-card">
        <div className="result-header">
          <h2 className="result-title">{copy.headline || 'Your Marketing Campaign'}</h2>
          <span className="result-badge">Ready</span>
        </div>

        {assetUrl && (
          <div className="result-media">
            <img src={assetUrl} alt={copy.headline || 'Campaign Asset'} className="result-image" />
          </div>
        )}

        <div className="result-body">
          <p className="result-text">{copy.body_copy}</p>
          {copy.call_to_action && (
            <div className="result-cta">
              {copy.call_to_action} <ArrowRight size={18} />
            </div>
          )}
        </div>

        <div className="task-id-badge" style={{ marginTop: '1rem' }}>
          Completed Task ID: {taskId}
        </div>
      </div>
    );
  }

  return null;
}
