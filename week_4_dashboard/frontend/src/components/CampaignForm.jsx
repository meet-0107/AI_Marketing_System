import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function CampaignForm({ onSubmit, isGenerating }) {
  const [formData, setFormData] = useState({
    product_name: '',
    product_description: '',
    tone: 'professional',
    target_audience: '',
    image_prompt: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="premium-panel">
      <h2 className="panel-title">
        <Sparkles className="logo-icon" style={{ width: '24px', height: '24px', padding: '4px' }} />
        Campaign Generator
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="product_name">Product Name *</label>
          <input
            id="product_name"
            name="product_name"
            type="text"
            required
            className="form-input"
            placeholder="e.g., AeroBrew Smart Coffee Maker"
            value={formData.product_name}
            onChange={handleChange}
            disabled={isGenerating}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="product_description">Product Description *</label>
          <textarea
            id="product_description"
            name="product_description"
            required
            className="form-textarea"
            placeholder="Describe the key features, value proposition, and unique selling points..."
            value={formData.product_description}
            onChange={handleChange}
            disabled={isGenerating}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="tone">Marketing Tone</label>
          <select
            id="tone"
            name="tone"
            className="form-select"
            value={formData.tone}
            onChange={handleChange}
            disabled={isGenerating}
          >
            <option value="professional">Professional & Corporate</option>
            <option value="playful">Playful & Enthusiastic</option>
            <option value="minimalist">Minimalist & Elegant</option>
            <option value="futuristic">Futuristic & Visionary</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="target_audience">Target Audience (Optional)</label>
          <input
            id="target_audience"
            name="target_audience"
            type="text"
            className="form-input"
            placeholder="e.g., Busy tech professionals, remote workers"
            value={formData.target_audience}
            onChange={handleChange}
            disabled={isGenerating}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="image_prompt">Custom Image Prompt (Optional)</label>
          <input
            id="image_prompt"
            name="image_prompt"
            type="text"
            className="form-input"
            placeholder="e.g., A sleek matte black coffee maker on a white marble counter"
            value={formData.image_prompt}
            onChange={handleChange}
            disabled={isGenerating}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isGenerating}>
          {isGenerating ? 'Generating Campaign...' : 'Generate Marketing Campaign'}
        </button>
      </form>
    </div>
  );
}
