// API helper functions for communicating with the FastAPI backend

const API_BASE = '/api';

/**
 * Submit a campaign generation request to the backend queue.
 * @param {Object} campaignData 
 * @returns {Promise<Object>}
 */
export async function createCampaign(campaignData) {
  const response = await fetch(`${API_BASE}/campaign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(campaignData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit campaign generation task.');
  }

  return await response.json();
}

/**
 * Poll the backend for the status of a Celery task.
 * @param {string} taskId 
 * @returns {Promise<Object>}
 */
export async function getCampaignStatus(taskId) {
  const response = await fetch(`${API_BASE}/status/${taskId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch task status.');
  }

  return await response.json();
}
