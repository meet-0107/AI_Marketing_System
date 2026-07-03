import React, { useState, useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import CampaignForm from './components/CampaignForm';
import ResultsDisplay from './components/ResultsDisplay';
import { createCampaign, getCampaignStatus } from './api';

function App() {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [progressStep, setProgressStep] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const pollingIntervalRef = useRef(null);

  const handleFormSubmit = async (formData) => {
    // Reset state
    setActiveTaskId(null);
    setStatus(null);
    setProgressStep(null);
    setResult(null);
    setError(null);
    setIsGenerating(true);

    try {
      const response = await createCampaign(formData);
      setActiveTaskId(response.task_id);
      setStatus('PENDING');
    } catch (err) {
      setError(err.message || 'Failed to connect to the backend API.');
      setIsGenerating(false);
    }
  };

  // Poll backend status whenever activeTaskId changes or status is pending/progress
  useEffect(() => {
    if (!activeTaskId) return;

    const pollStatus = async () => {
      try {
        const data = await getCampaignStatus(activeTaskId);
        setStatus(data.status);
        setProgressStep(data.progress_step);
        
        if (data.result) {
          setResult(data.result);
        }

        if (data.status === 'SUCCESS') {
          setIsGenerating(false);
          clearInterval(pollingIntervalRef.current);
        } else if (data.status === 'FAILURE') {
          setError(data.error || 'Task failed during execution.');
          setIsGenerating(false);
          clearInterval(pollingIntervalRef.current);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval every 2 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [activeTaskId]);

  return (
    <div className="app-container">
      {/* Navigation */}
      <header className="top-nav" style={{ padding: '1rem 0' }}>
        <div style={{ maxWidth: '1320px', width: '100%', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="logo-container">
            <div className="logo-icon">
              <Layers size={22} />
            </div>
            <span className="logo-text">AI Marketing Studio</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Enterprise Campaign Generator</h1>
          <p className="dashboard-subtitle">
            Generate professional marketing copy and premium visual assets through our advanced asynchronous AI engine.
          </p>
        </div>

        <div className="grid-container">
          <CampaignForm onSubmit={handleFormSubmit} isGenerating={isGenerating} />
          <ResultsDisplay
            taskId={activeTaskId}
            status={status}
            progressStep={progressStep}
            result={result}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
