import React, { useState, useRef } from 'react';
import { Sparkles, Upload } from 'lucide-react';

export default function CampaignForm({ onSubmit, isGenerating }) {
  const [formData, setFormData] = useState({
    product_name: '',
    tone: 'professional',
    target_audience: '',
    image_prompt: '',
    generate_text: true,
    generate_images: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate that at least one option is selected
    if (!formData.generate_text && !formData.generate_images) {
      alert('Please select at least one asset to generate (Copy or Images).');
      return;
    }
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
          <label className="form-label" htmlFor="product_name">New Product Launch *</label>
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



        {/* Separated Generation Selection Controls */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="generate_text"
              checked={formData.generate_text}
              disabled={isGenerating}
              onChange={(e) => setFormData(prev => ({ ...prev, generate_text: e.target.checked }))}
              style={{ width: '16px', height: '16px', borderRadius: '4px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            Generate Copy
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="generate_images"
              checked={formData.generate_images}
              disabled={isGenerating}
              onChange={(e) => setFormData(prev => ({ ...prev, generate_images: e.target.checked }))}
              style={{ width: '16px', height: '16px', borderRadius: '4px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            Generate Images
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={isGenerating}>
          {isGenerating ? 'Generating Campaign...' : 'Generate Marketing Campaign'}
        </button>
      </form>
    </div>
  );
}
