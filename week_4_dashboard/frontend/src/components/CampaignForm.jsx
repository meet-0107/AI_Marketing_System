import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function CampaignForm({ onSubmit, isGenerating }) {
  const [formData, setFormData] = useState({
    product_name: '',
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
