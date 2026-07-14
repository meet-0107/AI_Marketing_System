import React from 'react';
import { Loader2, AlertCircle, Megaphone, Twitter, FileText, Image as ImageIcon, Sparkles, Tag, Award, Zap, ShieldCheck, TrendingUp, Star, CheckCircle, ArrowRight, Clock, Facebook, Instagram, ThumbsUp, Download, Edit2, Copy, Check, RotateCw, Save, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const parseBoldText = (text) => {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} style={{ color: 'var(--text-main)', fontWeight: 700 }}>{part}</strong>;
    }
    return part;
  });
};

const renderBlogPost = (text) => {
  if (!text) return 'No blog post content generated.';
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const cleanLine = line.trim();
    if (cleanLine === '---' || cleanLine === '***') {
      return <hr key={index} style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)', opacity: 0.3 }} />;
    }
    if (cleanLine.startsWith('# ')) {
      return (
        <h1 key={index} style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
          {cleanLine.replace('# ', '').replace(/\*\*/g, '')}
        </h1>
      );
    }
    if (cleanLine.startsWith('## ')) {
      return (
        <h2 key={index} style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--accent)' }}>
          {cleanLine.replace('## ', '').replace(/\*\*/g, '')}
        </h2>
      );
    }
    if (cleanLine.startsWith('### ')) {
      return (
        <h3 key={index} style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          {cleanLine.replace('### ', '').replace(/\*\*/g, '')}
        </h3>
      );
    }
    if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
      const content = cleanLine.substring(2);
      return (
        <li key={index} style={{ listStyleType: 'disc', marginLeft: '1.5rem', marginBottom: '0.4rem', fontSize: '0.95rem', color: 'var(--text-main)' }}>
          {parseBoldText(content)}
        </li>
      );
    }
    if (cleanLine === '') {
      return <div key={index} style={{ height: '0.5rem' }} />;
    }
    return (
      <p key={index} style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
        {parseBoldText(cleanLine)}
      </p>
    );
  });
};

export default function ResultsDisplay({ taskId, status, progressStep, result, error }) {
  const imageRef1 = React.useRef(null);
  const imageRef2 = React.useRef(null);

  const [blogPost, setBlogPost] = React.useState('');
  const [tweets, setTweets] = React.useState([]);
  const [isEditingBlog, setIsEditingBlog] = React.useState(false);
  const [tempBlogPost, setTempBlogPost] = React.useState('');
  const [editingTweetIdx, setEditingTweetIdx] = React.useState(null);
  const [tempTweetText, setTempTweetText] = React.useState('');
  const [copiedStatus, setCopiedStatus] = React.useState({});

  const [regeneratingTweetIdx, setRegeneratingTweetIdx] = React.useState(null);

  const [isRegeneratingBlog, setIsRegeneratingBlog] = React.useState(false);
  const [isRegeneratingImage1, setIsRegeneratingImage1] = React.useState(false);
  const [isRegeneratingImage2, setIsRegeneratingImage2] = React.useState(false);

  const [customImage1, setCustomImage1] = React.useState(null);
  const [customImage2, setCustomImage2] = React.useState(null);

  const [showRefineBlog, setShowRefineBlog] = React.useState(false);
  const [refineInstructionBlog, setRefineInstructionBlog] = React.useState('');
  
  const [showRefineTweetIdx, setShowRefineTweetIdx] = React.useState(null);
  const [refineInstructionTweet, setRefineInstructionTweet] = React.useState('');

  const [showRefineImage1, setShowRefineImage1] = React.useState(false);
  const [refineInstructionImage1, setRefineInstructionImage1] = React.useState('');

  const [showRefineImage2, setShowRefineImage2] = React.useState(false);
  const [refineInstructionImage2, setRefineInstructionImage2] = React.useState('');

  const [seoTags, setSeoTags] = React.useState([]);
  const [isEditingSeo, setIsEditingSeo] = React.useState(false);
  const [tempSeoTagsText, setTempSeoTagsText] = React.useState('');
  const [showRefineSeo, setShowRefineSeo] = React.useState(false);
  const [refineInstructionSeo, setRefineInstructionSeo] = React.useState('');
  const [isRegeneratingSeo, setIsRegeneratingSeo] = React.useState(false);

  React.useEffect(() => {
    if (result && result.copy) {
      setBlogPost(result.copy.blog_post || result.copy.body_copy || '');
      setTweets(result.copy.tweets || []);
      setSeoTags(result.copy.seo_tags || []);
      setCustomImage1(null);
      setCustomImage2(null);
    }
  }, [result]);

  const handleCopyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStatus((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStatus((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleRegenerate = async (elementType, refinementInstruction = null, currentContent = null) => {
    if (!result) return;
    const isIndividualTweet = elementType.startsWith('tweet_');
    let tweetIndex = null;
    if (isIndividualTweet) {
      tweetIndex = parseInt(elementType.split('_')[1], 10) - 1;
      setRegeneratingTweetIdx(tweetIndex);
    }

    if (elementType === 'blog_post') setIsRegeneratingBlog(true);
    else if (elementType === 'image_1') setIsRegeneratingImage1(true);
    else if (elementType === 'image_2') setIsRegeneratingImage2(true);
    else if (elementType === 'seo_tags') setIsRegeneratingSeo(true);

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: result.product_name,
          product_description: result.product_description || '',
          tone: result.tone || 'professional',
          target_audience: result.target_audience || '',
          element_type: elementType,
          image_prompt: result.image_prompt || '',
          image_reference: result.image_reference || '',
          refinement_instruction: refinementInstruction,
          current_content: currentContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate asset element.');
      }

      const data = await response.json();

      if (elementType === 'blog_post') {
        setBlogPost(data.blog_post);
        setIsEditingBlog(false);
      } else if (elementType === 'tweets') {
        setTweets(data.tweets);
        setEditingTweetIdx(null);
      } else if (isIndividualTweet) {
        const updatedTweets = [...tweets];
        updatedTweets[tweetIndex] = data.tweet;
        setTweets(updatedTweets);
        setEditingTweetIdx(null);
      } else if (elementType === 'image_1') {
        setCustomImage1(data.image_url);
      } else if (elementType === 'image_2') {
        setCustomImage2(data.image_url);
      } else if (elementType === 'seo_tags') {
        setSeoTags(data.seo_tags);
        setIsEditingSeo(false);
      }
    } catch (err) {
      console.error('Error during regeneration:', err);
      alert('Regeneration failed: ' + err.message);
    } finally {
      if (elementType === 'blog_post') setIsRegeneratingBlog(false);
      else if (elementType === 'image_1') setIsRegeneratingImage1(false);
      else if (elementType === 'image_2') setIsRegeneratingImage2(false);
      else if (elementType === 'seo_tags') setIsRegeneratingSeo(false);
      if (isIndividualTweet) setRegeneratingTweetIdx(null);
    }
  };

  const downloadImage = async (ref, filename) => {
    if (!ref.current) return;
    try {
      // Wait for all images inside the container to fully load
      const images = ref.current.getElementsByTagName('img');
      for (let img of images) {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
      }

      // Check if images are data URIs (mock mode) or remote URLs
      let hasRemoteImages = false;
      for (let img of images) {
        if (img.src && !img.src.startsWith('data:')) {
          hasRemoteImages = true;
        }
      }

      // Capture the entire composite (image + text overlays) via html2canvas
      const canvas = await html2canvas(ref.current, {
        useCORS: hasRemoteImages,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#0f172a',
        logging: false,
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight
      });

      // Convert canvas to proper JPEG Blob manually
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const base64 = dataUrl.split(',')[1];
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/jpeg' });

      // Download via Blob URL (Chrome respects filename on blob: URLs)
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 200);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

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

  // Polling / Progress State (Show loading screen ONLY if we don't have copy results yet)
  if (status && status !== 'SUCCESS' && status !== 'FAILURE' && !(result && result.copy)) {
    const isCopyDone = progressStep && (progressStep.includes('images') || progressStep.includes('completed') || progressStep.includes('mock') || progressStep.includes('MOCK'));
    const isImagesActive = progressStep && (progressStep.includes('images') || progressStep.includes('mock') || progressStep.includes('MOCK'));

    return (
      <div className="premium-panel unique-loader-container">
        <div className="hologram-orb">
          <div className="orb-ring"></div>
          <div className="orb-ring"></div>
          <div className="orb-ring"></div>
          <div className="orb-core"></div>
        </div>

        <h3 className="glitch-text">
          Crafting Your Campaign
        </h3>

        <p className="loading-subtitle">
          Generating your assets...
        </p>

        {/* Live Step Badge */}
        {progressStep && (
          <div style={{ marginTop: '2.5rem', padding: '0.6rem 1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', animation: 'pulse 2s infinite', boxShadow: '0 0 15px rgba(37,99,235,0.15)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></span>
            {progressStep.toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  // Success / Partial Success (Early Copy) State
  if ((status === 'SUCCESS' || (status && status !== 'FAILURE' && result && result.copy)) && result) {
    const copy = result.copy || {};
    const assetUrls = result.asset_urls || [];
    const tweets = copy.tweets || [];

    // Generate dynamic stable pricing based on product name and category
    const getProductPrice = (name) => {
      const defaultPrice = { original: 1499, discounted: 1199, discountPercent: 20 };
      if (!name) return defaultPrice;

      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }

      const lowerName = name.toLowerCase();
      let minPrice = 399;
      let maxPrice = 1999;

      // Category 1: Low-cost items (Mug, Cup, Pen, Bottle, Keychain, etc.)
      if (lowerName.includes('mug') || lowerName.includes('cup') || lowerName.includes('pen') ||
        lowerName.includes('keychain') || lowerName.includes('sticker') || lowerName.includes('notebook') ||
        lowerName.includes('bottle') || lowerName.includes('glass') || lowerName.includes('tshirt') ||
        lowerName.includes('shirt') || lowerName.includes('cap') || lowerName.includes('plate')) {
        minPrice = 199;
        maxPrice = 599;
      }
      // Category 3: Mid-range items (Headphones, Earbuds, Smartwatch, Keyboard, Coffee Maker, etc.)
      else if (lowerName.includes('headphone') || lowerName.includes('earbud') || lowerName.includes('watch') ||
        lowerName.includes('smartwatch') || lowerName.includes('keyboard') || lowerName.includes('mouse') ||
        lowerName.includes('charger') || lowerName.includes('speaker') || lowerName.includes('blender') ||
        lowerName.includes('kettle') || lowerName.includes('coffee') || lowerName.includes('thermos')) {
        minPrice = 999;
        maxPrice = 4999;
      }
      // Category 2: High-end premium items (Laptop, Smartphone, TV, Tablet, etc.)
      else if (lowerName.includes('laptop') || lowerName.includes('phone') || lowerName.includes('smartphone') ||
        lowerName.includes('tv') || lowerName.includes('television') || lowerName.includes('camera') ||
        lowerName.includes('computer') || lowerName.includes('tablet') || lowerName.includes('macbook') ||
        lowerName.includes('ipad') || lowerName.includes('iphone')) {
        minPrice = 14999;
        maxPrice = 79999;
      }

      // Calculate dynamic price based on hash inside the range
      const range = maxPrice - minPrice;
      let base = minPrice + (Math.abs(hash) % Math.floor(range / 100)) * 100;

      // If it's Category 2 (High-end), let's step in larger multiples (e.g. multiples of 1000)
      if (minPrice >= 14999) {
        base = minPrice + (Math.abs(hash) % Math.floor(range / 1000)) * 1000;
      }

      const original = base - 1; // e.g. 299, 1499, 29999
      const discountPercent = ((Math.abs(hash) % 6) + 2) * 5; // Dynamic discount: 10%, 15%, 20%, 25%, 30%, 35%
      const discounted = Math.round(original * (1 - (discountPercent / 100))); // Apply dynamic discount

      return { original, discounted, discountPercent };
    };

    const price = getProductPrice(result.product_name);

    // Generate dynamic promo code from product name
    const codePrefix = (result.product_name || 'DEAL').trim().split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8);
    const promoCode = `${codePrefix}${price.discountPercent}`;

    const tone = (result.tone || 'professional').toLowerCase();

    const getHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };

    // A set of 6 distinct high-end luxury color gradients and accents
    const luxuryPalettes = [
      { // 1. Deep Indigo & Champagne Gold
        primaryGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        accent: '#dfc07b',
        accentLight: 'rgba(223, 192, 123, 0.12)',
        badgeBg: 'rgba(15, 23, 42, 0.82)',
        badgeBorder: 'rgba(223, 192, 123, 0.4)',
        btnGlow: 'rgba(49, 46, 129, 0.35)',
        btnHoverGlow: 'rgba(79, 70, 229, 0.5)',
        ribbonBg: '#991b1b'
      },
      { // 2. Emerald Green & Rich Bronze Gold
        primaryGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
        accent: '#fbbf24',
        accentLight: 'rgba(251, 191, 36, 0.12)',
        badgeBg: 'rgba(15, 23, 42, 0.82)',
        badgeBorder: 'rgba(251, 191, 36, 0.4)',
        btnGlow: 'rgba(6, 78, 59, 0.35)',
        btnHoverGlow: 'rgba(5, 150, 105, 0.5)',
        ribbonBg: '#b45309'
      },
      { // 3. Crimson Burgundy & Platinum Silver
        primaryGradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
        accent: '#cbd5e1',
        accentLight: 'rgba(203, 213, 225, 0.12)',
        badgeBg: 'rgba(15, 23, 42, 0.82)',
        badgeBorder: 'rgba(203, 213, 225, 0.4)',
        btnGlow: 'rgba(127, 29, 29, 0.35)',
        btnHoverGlow: 'rgba(220, 38, 38, 0.5)',
        ribbonBg: '#1e3a8a'
      },
      { // 4. Midnight Slate & Rose Gold
        primaryGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        accent: '#fda4af',
        accentLight: 'rgba(253, 164, 175, 0.12)',
        badgeBg: 'rgba(15, 23, 42, 0.82)',
        badgeBorder: 'rgba(253, 164, 175, 0.4)',
        btnGlow: 'rgba(30, 41, 59, 0.35)',
        btnHoverGlow: 'rgba(71, 85, 105, 0.5)',
        ribbonBg: '#be185d'
      },
      { // 5. Deep Plum & Bright Electric Teal
        primaryGradient: 'linear-gradient(135deg, #3b0764 0%, #581c87 100%)',
        accent: '#22d3ee',
        accentLight: 'rgba(34, 211, 238, 0.12)',
        badgeBg: 'rgba(15, 23, 42, 0.82)',
        badgeBorder: 'rgba(34, 211, 238, 0.4)',
        btnGlow: 'rgba(88, 28, 135, 0.35)',
        btnHoverGlow: 'rgba(147, 51, 234, 0.5)',
        ribbonBg: '#db2777'
      },
      { // 6. Charcoal Carbon & Bright Chrome Gold
        primaryGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
        accent: '#fbbf24',
        accentLight: 'rgba(251, 191, 36, 0.12)',
        badgeBg: 'rgba(15, 23, 42, 0.85)',
        badgeBorder: 'rgba(251, 191, 36, 0.4)',
        btnGlow: 'rgba(41, 37, 36, 0.35)',
        btnHoverGlow: 'rgba(120, 113, 108, 0.5)',
        ribbonBg: '#1e3a8a'
      }
    ];

    const getDynamicTheme = (toneName, name, isComplementary = false) => {
      const hash = getHash(name || 'default');
      const offset = isComplementary ? 1 : 0;

      const subsetIndices = {
        professional: [0, 1, 5],
        playful: [1, 3, 4],
        minimalist: [0, 3, 5],
        futuristic: [4, 2, 3]
      };

      const allowed = subsetIndices[toneName] || subsetIndices.professional;
      const paletteIndex = allowed[(hash + offset) % allowed.length];
      const selected = luxuryPalettes[paletteIndex];

      return {
        ...selected,
        primary: selected.primaryGradient.includes('#1e1b4b') ? '#312e81' : '#1e293b',
        textColor: '#f8fafc',
        textMuted: '#cbd5e1',
        badgeRadius: toneName === 'playful' ? '20px' : toneName === 'minimalist' ? '4px' : '12px',
        btnRadius: toneName === 'playful' ? '20px' : toneName === 'minimalist' ? '4px' : '6px'
      };
    };

    const theme1 = getDynamicTheme(tone, result.product_name, false);
    const theme2 = getDynamicTheme(tone, result.product_name, true);

    // Map features to custom matching Lucide icons
    const getFeatureIcon = (text, index, size = 20, color = '#fbbf24') => {
      const lower = (text || '').toLowerCase();
      if (lower.includes('power') || lower.includes('charg') || lower.includes('fast') || lower.includes('speed') || lower.includes('battery') || lower.includes('quick') || lower.includes('watt') || lower.includes('sound') || lower.includes('audio')) {
        return <Zap size={size} style={{ color, flexShrink: 0 }} />;
      }
      if (lower.includes('safe') || lower.includes('warranty') || lower.includes('shield') || lower.includes('secure') || lower.includes('protect') || lower.includes('durable') || lower.includes('tough')) {
        return <ShieldCheck size={size} style={{ color, flexShrink: 0 }} />;
      }
      if (lower.includes('premium') || lower.includes('luxury') || lower.includes('gold') || lower.includes('award') || lower.includes('quality') || lower.includes('best') || lower.includes('elite')) {
        return <Award size={size} style={{ color, flexShrink: 0 }} />;
      }
      if (lower.includes('comfort') || lower.includes('soft') || lower.includes('design') || lower.includes('style') || lower.includes('beauty') || lower.includes('ergonomic') || lower.includes('vibrant')) {
        return <Sparkles size={size} style={{ color, flexShrink: 0 }} />;
      }
      if (lower.includes('time') || lower.includes('dur') || lower.includes('long') || lower.includes('hour') || lower.includes('day') || lower.includes('clock') || lower.includes('life')) {
        return <Clock size={size} style={{ color, flexShrink: 0 }} />;
      }
      if (lower.includes('trend') || lower.includes('up') || lower.includes('boost') || lower.includes('high') || lower.includes('performance') || lower.includes('smart')) {
        return <TrendingUp size={size} style={{ color, flexShrink: 0 }} />;
      }

      // Fallback to distinct icons based on index so they are never all the same
      const fallbacks = [
        <Award size={size} style={{ color, flexShrink: 0 }} />,       // Left 1
        <Sparkles size={size} style={{ color, flexShrink: 0 }} />,    // Left 2
        <ShieldCheck size={size} style={{ color, flexShrink: 0 }} />, // Left 3
        <TrendingUp size={size} style={{ color, flexShrink: 0 }} />,  // Right 1
        <Zap size={size} style={{ color, flexShrink: 0 }} />,         // Right 2
        <Clock size={size} style={{ color, flexShrink: 0 }} />        // Right 3
      ];
      const element = fallbacks[index % 6];
      return React.cloneElement(element, { style: { ...element.props.style, color } });
    };

    // Cleanly parse the product description into distinct professional bullet points, with category custom fallbacks
    const getDynamicBullets = (name, desc) => {
      let extracted = [];
      if (desc) {
        extracted = desc
          .replace(/[🎁🏡🌿🎨✨🚀🔥🎉💎🏆]/g, '')
          .split(/(?:\. |\n|, | - |;)/)
          .map(s => s.trim())
          .filter(s => s.length >= 4)
          .map(s => s.trim().split(/\s+/).slice(0, 3).join(' '))
          .map(s => s.charAt(0).toUpperCase() + s.slice(1));
      }

      const lowerName = (name || '').toLowerCase();
      let categoryBullets = [
        'Premium Quality',
        'Built To Last',
        'High Performance',
        'Ergonomic Design',
        'Modern Vibe',
        'Advanced Tech'
      ];

      if (lowerName.includes('mug') || lowerName.includes('cup') || lowerName.includes('bottle') || lowerName.includes('kettle') || lowerName.includes('coffee') || lowerName.includes('brew') || lowerName.includes('maker')) {
        categoryBullets = [
          'Food-Grade Build',
          'Perfect Heat',
          'Leak-Proof Lid',
          'Ergonomic Grip',
          'Elegant Design',
          'Double-Wall Vacuum'
        ];
      } else if (lowerName.includes('headphone') || lowerName.includes('earbud') || lowerName.includes('speaker') || lowerName.includes('audio') || lowerName.includes('sound')) {
        categoryBullets = [
          'Immersive Sound',
          'Noise Cancelling',
          'Deep Rich Bass',
          'All-Day Comfort',
          'Wireless Freedom',
          'Premium Audio'
        ];
      } else if (lowerName.includes('watch') || lowerName.includes('smartwatch') || lowerName.includes('tracker')) {
        categoryBullets = [
          'Fitness Tracking',
          'Heart Rate Sensor',
          'Water Resistant',
          'Long Battery Life',
          'Smart Alerts',
          'Sleek AMOLED Face'
        ];
      } else if (lowerName.includes('laptop') || lowerName.includes('computer') || lowerName.includes('macbook') || lowerName.includes('ipad') || lowerName.includes('tablet')) {
        categoryBullets = [
          'Blazing Fast Speed',
          'Ultra Slim Profile',
          'Stunning Screen',
          'All-Day Power',
          'Powerful CPU',
          'Premium Aluminium'
        ];
      } else if (lowerName.includes('phone') || lowerName.includes('smartphone') || lowerName.includes('iphone') || lowerName.includes('mobile')) {
        categoryBullets = [
          'Pro-Grade Camera',
          'Super Retina Screen',
          'All-Day Battery',
          'Lightning Fast 5G',
          'Sleek Glass Body',
          'Fast Face Unlock'
        ];
      }

      const combined = [...extracted];
      for (const fallback of categoryBullets) {
        if (combined.length >= 6) break;
        if (!combined.some(c => c.toLowerCase() === fallback.toLowerCase())) {
          combined.push(fallback);
        }
      }

      while (combined.length < 6) {
        combined.push('Elite Selection');
      }

      return combined;
    };

    const finalBullets = getDynamicBullets(result.product_name, result.product_description);
    const leftBullets = finalBullets.slice(0, 3);
    const rightBullets = finalBullets.slice(3, 6);

    const getDynamicSlogan = (name, apiSlogan) => {
      const lowerSlogan = (apiSlogan || '').toLowerCase();
      if (apiSlogan &&
        !lowerSlogan.includes('sleek and clever') &&
        !lowerSlogan.includes('witty premium') &&
        !lowerSlogan.includes('ignite your vision') &&
        apiSlogan.length > 5) {
        return apiSlogan;
      }

      const lowerName = (name || '').toLowerCase();

      if (lowerName.includes('mug') || lowerName.includes('cup') || lowerName.includes('bottle') || lowerName.includes('kettle') || lowerName.includes('coffee') || lowerName.includes('brew') || lowerName.includes('maker')) {
        const mugSlogans = [
          'Perfect Heat in Every Sip',
          'Sip Smarter, Live Better Today',
          'Your Daily Brew, Elevated Now',
          'Hot Coffee, Perfect Day Always',
          'Engineered For Ultimate Beverage Comfort',
          'Sleek Design Meets Daily Brews'
        ];
        const hash = getHash(name || '');
        return mugSlogans[hash % mugSlogans.length];
      }

      if (lowerName.includes('headphone') || lowerName.includes('earbud') || lowerName.includes('speaker') || lowerName.includes('audio') || lowerName.includes('sound')) {
        const audioSlogans = [
          'Cancel Noise, Discover Sound Now',
          'Immersive Sound, Pure Comfort Today',
          'Hear Every Single Rich Detail',
          'Your Perfect Sound, Untethered Always',
          'Silence The Noise, Hear Excellence',
          'Premium Audio For Ultimate Focus'
        ];
        const hash = getHash(name || '');
        return audioSlogans[hash % audioSlogans.length];
      }

      if (lowerName.includes('watch') || lowerName.includes('smartwatch') || lowerName.includes('tracker')) {
        const watchSlogans = [
          'Track Your Time, Elevate Life',
          'Your Health, On Your Wrist',
          'Sleek Tracking For Modern Living',
          'Stay Connected, Stay Active Today',
          'Time Restructured For Ultimate Performance',
          'Your Daily Companion, Redefined Now'
        ];
        const hash = getHash(name || '');
        return watchSlogans[hash % watchSlogans.length];
      }

      if (lowerName.includes('laptop') || lowerName.includes('computer') || lowerName.includes('macbook') || lowerName.includes('ipad') || lowerName.includes('tablet')) {
        const techSlogans = [
          'Unleash Extreme Portable Power Today',
          'Sleek Performance, Unlimited Creative Freedom',
          'Your Ultimate Workhorse, Redefined Now',
          'Next-Gen Speed, Infinite Creative Possibilities',
          'Designed For Seamless Elite Productivity',
          'Thin Profile, Unmatched Compute Power'
        ];
        const hash = getHash(name || '');
        return techSlogans[hash % techSlogans.length];
      }

      if (lowerName.includes('phone') || lowerName.includes('smartphone') || lowerName.includes('iphone') || lowerName.includes('mobile')) {
        const phoneSlogans = [
          'Capture Every Moment In Style',
          'Sleek Mobility, Ultimate Power Now',
          'The Perfect Screen, Always Ready',
          'Connect Smarter, Live Better Today',
          'Your Complete World, Redefined Always',
          'Next-Generation Performance in Hand'
        ];
        const hash = getHash(name || '');
        return phoneSlogans[hash % phoneSlogans.length];
      }

      return apiSlogan || 'Designed For Premium Modern Living';
    };

    const finalSlogan = getDynamicSlogan(result.product_name, copy.funny_slogan);

    const extractCapacity = (desc) => {
      if (!desc) return null;
      const match = desc.match(/\b\d+(?:\.\d+)?\s*(?:ml|l|litre|litres|gb|tb|mah|cups|cup|bar|kg|oz|lbs|kw|w|oz)\b/i);
      return match ? match[0] : null;
    };
    const capacity = extractCapacity(result.product_description) || 'Standard Size';
    const cleanProdName = (result.product_name || '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const websiteUrl = cleanProdName ? `www.${cleanProdName}shop.com` : 'www.shopbrand.com';

    const prodNameUpper = (result.product_name || 'PRODUCT').toUpperCase();
    const prodNameTitle = (result.product_name || 'Product');
    const point1 = leftBullets[0] || 'Premium Quality';
    const point2 = leftBullets[1] || 'Built to Last';

    const banners = copy.image_banners || [
      {
        badge: `✨ EXCLUSIVE ${prodNameUpper.slice(0, 15)}`,
        title: `ELITE ${prodNameUpper.slice(0, 15)}`,
        bullet1: point1,
        bullet2: point2,
        extra_tag: `Guaranteed ${prodNameTitle.slice(0, 15)}`,
        supporting_message: `A premium, state-of-the-art solution designed to enhance your experience with ${prodNameTitle}.`
      },
      {
        badge: `💎 SPECIAL ${price.discountPercent}% OFF`,
        title: `PREMIUM ${prodNameUpper.slice(0, 15)}`,
        bullet1: `Save ${price.discountPercent}% Today`,
        bullet2: `${prodNameTitle} Special Offer`,
        extra_tag: `Unlock Instant ${prodNameTitle.slice(0, 15)} Deals`,
        supporting_message: `An elegant addition that complements your modern lifestyle and enhances your daily ${prodNameTitle} workflow.`
      }
    ];

    const exportToPDF = () => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Color scheme matching deep luxury aesthetics
      const primaryColor = [30, 27, 75]; // Indigo 900
      const secondaryColor = [79, 70, 229]; // Indigo 600
      const textColor = [15, 23, 42]; // Slate 900
      const mutedTextColor = [100, 116, 139]; // Slate 500
      const lightBgColor = [248, 250, 252]; // Slate 50

      let yPos = 25;
      const margin = 20;
      const contentWidth = 170; // 210 - 20 * 2
      const pageHeight = 297;

      const drawHeaderFooter = (pageNumber) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
        doc.text("AI Marketing Campaign System", margin, pageHeight - 10);
        doc.text(`Page ${pageNumber}`, margin + contentWidth - 15, pageHeight - 10);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 14, margin + contentWidth, pageHeight - 14);
      };

      const checkPageBreak = (neededHeight) => {
        if (yPos + neededHeight > 265) {
          doc.addPage();
          drawHeaderFooter(doc.internal.getNumberOfPages());
          yPos = 25;
          return true;
        }
        return false;
      };

      // Page 1
      drawHeaderFooter(1);

      // Main Campaign Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

      const titleLines = doc.splitTextToSize(result.product_name.toUpperCase(), contentWidth);
      doc.text(titleLines, margin, yPos);
      yPos += titleLines.length * 8 + 4;

      // Campaign Tagline
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`"${copy.headline || 'Premium Marketing Campaign'}"`, margin, yPos);
      yPos += 10;

      // Tone & Target Audience info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(`Campaign Tone: ${result.tone.charAt(0).toUpperCase() + result.tone.slice(1)}   |   Target Audience: ${result.target_audience || 'General B2C'}`, margin, yPos);
      yPos += 5;

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, yPos, margin + contentWidth, yPos);
      yPos += 12;

      // Product Description block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Campaign Description", margin, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const descLines = doc.splitTextToSize(result.product_description || '', contentWidth);
      doc.text(descLines, margin, yPos);
      yPos += descLines.length * 5.5 + 10;

      // Blog Post
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Official Campaign Blog Post", margin, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      const rawBlog = blogPost || '';
      const paragraphs = rawBlog.split('\n');

      paragraphs.forEach((para) => {
        const cleanPara = para.trim();
        if (!cleanPara) return;

        if (cleanPara.startsWith('# ')) {
          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          const headerVal = cleanPara.replace('# ', '').replace(/\*\*/g, '');
          const lines = doc.splitTextToSize(headerVal, contentWidth);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 6 + 4;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        } else if (cleanPara.startsWith('## ') || cleanPara.startsWith('### ')) {
          checkPageBreak(12);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          const headerVal = cleanPara.replace(/^(##|###)\s+/, '').replace(/\*\*/g, '');
          const lines = doc.splitTextToSize(headerVal, contentWidth);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 5.5 + 3;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        } else if (cleanPara.startsWith('* ') || cleanPara.startsWith('- ')) {
          checkPageBreak(8);
          const bulletVal = cleanPara.substring(2).replace(/\*\*/g, '');
          const lines = doc.splitTextToSize(`•  ${bulletVal}`, contentWidth - 4);
          doc.text(lines, margin + 4, yPos);
          yPos += lines.length * 5 + 2;
        } else if (cleanPara === '---' || cleanPara === '***') {
          checkPageBreak(6);
          doc.setDrawColor(241, 245, 249);
          doc.line(margin, yPos, margin + contentWidth, yPos);
          yPos += 6;
        } else {
          const lines = doc.splitTextToSize(cleanPara.replace(/\*\*/g, ''), contentWidth);
          checkPageBreak(lines.length * 5 + 4);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 5 + 3;
        }
      });
      yPos += 8;

      // Tweets
      checkPageBreak(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Promotional Social Media Tweets", margin, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);

      const tweetsList = tweets || [];
      tweetsList.forEach((tweet, index) => {
        const prodNameClean = (result.product_name || 'Brand').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
        const cleanedTweet = tweet.includes('#')
          ? tweet
          : `${tweet} #${prodNameClean} #Innovation`;

        const lines = doc.splitTextToSize(cleanedTweet, contentWidth - 10);
        const blockHeight = lines.length * 5 + 10;

        checkPageBreak(blockHeight);

        doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
        doc.rect(margin, yPos - 4, contentWidth, blockHeight - 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, yPos - 4, contentWidth, blockHeight - 2, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(`Variant ${index + 1}:`, margin + 5, yPos + 1);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(lines, margin + 5, yPos + 7);
        yPos += blockHeight + 4;
      });
      yPos += 6;

      // SEO Tags
      if (copy.seo_tags && copy.seo_tags.length > 0) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("SEO Optimization Tags", margin, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        const tagsString = copy.seo_tags.map(tag => `#${tag}`).join('    ');
        const tagLines = doc.splitTextToSize(tagsString, contentWidth);
        doc.text(tagLines, margin, yPos);
        yPos += tagLines.length * 5.5 + 12;
      }

      // Images Page
      if (assetUrls && assetUrls.length > 0) {
        doc.addPage();
        drawHeaderFooter(doc.internal.getNumberOfPages());
        yPos = 25;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("Promotional AI-Generated Graphics", margin, yPos);
        yPos += 10;

        const finalAssetUrls = [
          customImage1 || assetUrls[0],
          customImage2 || assetUrls[1]
        ].filter(Boolean);
        finalAssetUrls.forEach((url, index) => {
          checkPageBreak(95);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.text(`Promotional Graphic #${index + 1}`, margin, yPos);
          yPos += 6;

          try {
            const format = url.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(url, format, margin, yPos, 80, 80);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            const bannerInfo = banners[index] || {};
            const textX = margin + 85;
            let textY = yPos + 10;

            doc.text("Banner Overlay Copy:", textX, textY);
            textY += 6;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);

            doc.text(`Badge: ${bannerInfo.badge || '✨ EXCLUSIVE'}`, textX, textY);
            textY += 5;
            doc.text(`Title: ${bannerInfo.title || 'PREMIUM'}`, textX, textY);
            textY += 5;
            doc.text(`Feature 1: ${bannerInfo.bullet1 || ''}`, textX, textY);
            textY += 5;
            doc.text(`Feature 2: ${bannerInfo.bullet2 || ''}`, textX, textY);
            textY += 5;
            doc.text(`Tag: ${bannerInfo.extra_tag || ''}`, textX, textY);
            textY += 6;

            doc.setFont('helvetica', 'italic');
            const supportingMessageLines = doc.splitTextToSize(bannerInfo.supporting_message || '', contentWidth - 85);
            doc.text(supportingMessageLines, textX, textY);

          } catch (imgError) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9.5);
            doc.setTextColor(239, 68, 68);
            doc.text(`[Unable to embed image: ${imgError.message}]`, margin, yPos + 10);
          }
          yPos += 88;
        });
      }

      const slug = result.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      doc.save(`campaign-${slug}.pdf`);
    };

    return (
      <div className="premium-panel result-card" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Warnings Banner */}
        {result.warnings && result.warnings.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            color: '#d97706',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.92rem',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Configuration Notice</strong>
              {result.warnings.map((warning, idx) => (
                <p key={idx} style={{ margin: 0 }}>{warning}</p>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="result-header" style={{ marginBottom: 0 }}>
          <h2 className="result-title">{copy.headline || 'Your Marketing Campaign Package'}</h2>
        </div>

        {/* Blog Post Section */}
        <div className="result-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--accent)' }}>
              <FileText size={20} />
              Official Blog Post
            </h3>
            <button
              onClick={exportToPDF}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.75rem',
                transition: 'background-color 0.2s ease',
                fontFamily: 'var(--font-body)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
            >
              <Download size={12} /> Export PDF
            </button>
          </div>
          <div className="result-body" style={{ marginBottom: 0, padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
            {isRegeneratingBlog && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
              </div>
            )}
            
            {/* Top Toolbar INSIDE Blog Card */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              {isEditingBlog ? (
                <>
                  <button
                    onClick={() => { setBlogPost(tempBlogPost); setIsEditingBlog(false); }}
                    style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    <Save size={12} /> Save
                  </button>
                  <button
                    onClick={() => setIsEditingBlog(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    <X size={12} /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setIsEditingBlog(true); setTempBlogPost(blogPost); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard(blogPost, 'blog')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {copiedStatus['blog'] ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                    {copiedStatus['blog'] ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleRegenerate('blog_post')}
                    disabled={isRegeneratingBlog}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: isRegeneratingBlog ? 0.6 : 1 }}
                  >
                    <RotateCw size={12} className={isRegeneratingBlog ? 'animate-spin' : ''} />
                    {isRegeneratingBlog ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={() => setShowRefineBlog(!showRefineBlog)}
                    style={{ background: 'none', border: 'none', color: showRefineBlog ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    <Sparkles size={12} /> Refine
                  </button>
                </>
              )}
            </div>

            {showRefineBlog && !isEditingBlog && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <input
                  type="text"
                  placeholder="Ask AI to modify this blog post... (e.g. 'Make it shorter', 'Write in Steve Jobs style')"
                  value={refineInstructionBlog}
                  onChange={(e) => setRefineInstructionBlog(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && refineInstructionBlog.trim()) {
                      handleRegenerate('blog_post', refineInstructionBlog, blogPost);
                      setRefineInstructionBlog('');
                      setShowRefineBlog(false);
                    }
                  }}
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }}
                />
                <button
                  onClick={() => {
                    if (refineInstructionBlog.trim()) {
                      handleRegenerate('blog_post', refineInstructionBlog, blogPost);
                      setRefineInstructionBlog('');
                      setShowRefineBlog(false);
                    }
                  }}
                  style={{ padding: '0.4rem 0.85rem', backgroundColor: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Apply
                </button>
              </div>
            )}

            {isEditingBlog ? (
              <textarea
                value={tempBlogPost}
                onChange={(e) => setTempBlogPost(e.target.value)}
                style={{ width: '100%', minHeight: '300px', padding: '1rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: '1.6', resize: 'vertical', outline: 'none' }}
              />
            ) : (
              <div className="result-text" style={{ marginBottom: 0 }}>
                {renderBlogPost(blogPost)}
              </div>
            )}
          </div>
        </div>

        {/* 3 Tweet Variants Section */}
        <div className="result-section" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1da1f2' }}>
              <Twitter size={20} />
              3 Tweet Variants
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {tweets.map((tweet, index) => {
              const cleanedTweet = tweet.includes('#')
                ? tweet
                : `${tweet} #${(result.product_name || 'Brand').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Brand'} #Innovation #NewArrival`;

              let formattedTweet = cleanedTweet;
              const hashtagRegex = /(\s*(#[a-zA-Z0-9_\u0900-\u097F]+\s*)+)$/;
              const match = cleanedTweet.match(hashtagRegex);
              if (match && match.index > 0) {
                const mainText = cleanedTweet.substring(0, match.index).trim();
                const hashtags = match[0].trim();
                formattedTweet = `${mainText}\n${hashtags}`;
              }

              const isEditingThisTweet = editingTweetIdx === index;

              return (
                <div key={index} style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative' }}>
                  {regeneratingTweetIdx === index && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
                      <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                    </div>
                  )}
                  <Twitter size={24} style={{ color: '#1da1f2', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Variant {index + 1}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {isEditingThisTweet ? (
                          <>
                            <button
                              onClick={() => {
                                const newTweets = [...tweets];
                                newTweets[index] = tempTweetText;
                                setTweets(newTweets);
                                setEditingTweetIdx(null);
                              }}
                              style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <Save size={12} /> Save
                            </button>
                            <button
                              onClick={() => setEditingTweetIdx(null)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <X size={12} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingTweetIdx(index);
                                setTempTweetText(tweet);
                              }}
                              disabled={regeneratingTweetIdx !== null}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: (regeneratingTweetIdx !== null) ? 0.5 : 1 }}
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleCopyToClipboard(cleanedTweet, `tweet_${index}`)}
                              disabled={regeneratingTweetIdx !== null}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: (regeneratingTweetIdx !== null) ? 0.5 : 1 }}
                            >
                              {copiedStatus[`tweet_${index}`] ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                              {copiedStatus[`tweet_${index}`] ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                              onClick={() => handleRegenerate(`tweet_${index + 1}`)}
                              disabled={regeneratingTweetIdx !== null}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: (regeneratingTweetIdx !== null) ? 0.5 : 1 }}
                            >
                              <RotateCw size={12} className={regeneratingTweetIdx === index ? 'animate-spin' : ''} />
                              {regeneratingTweetIdx === index ? 'Regenerating...' : 'Regenerate'}
                            </button>
                            <button
                              onClick={() => {
                                if (showRefineTweetIdx === index) {
                                  setShowRefineTweetIdx(null);
                                } else {
                                  setShowRefineTweetIdx(index);
                                  setRefineInstructionTweet('');
                                }
                              }}
                              disabled={regeneratingTweetIdx !== null}
                              style={{ background: 'none', border: 'none', color: showRefineTweetIdx === index ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: (regeneratingTweetIdx !== null) ? 0.5 : 1 }}
                            >
                              <Sparkles size={12} /> Refine
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {showRefineTweetIdx === index && !isEditingThisTweet && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <input
                          type="text"
                          placeholder="Ask AI to modify this tweet... (e.g. 'Make it shorter', 'Add emojis')"
                          value={refineInstructionTweet}
                          onChange={(e) => setRefineInstructionTweet(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && refineInstructionTweet.trim()) {
                              handleRegenerate(`tweet_${index + 1}`, refineInstructionTweet, tweet);
                              setRefineInstructionTweet('');
                              setShowRefineTweetIdx(null);
                            }
                          }}
                          style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-main)', outline: 'none' }}
                        />
                        <button
                          onClick={() => {
                            if (refineInstructionTweet.trim()) {
                              handleRegenerate(`tweet_${index + 1}`, refineInstructionTweet, tweet);
                              setRefineInstructionTweet('');
                              setShowRefineTweetIdx(null);
                            }
                          }}
                          style={{ padding: '0.3rem 0.6rem', backgroundColor: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {isEditingThisTweet ? (
                      <textarea
                        value={tempTweetText}
                        onChange={(e) => setTempTweetText(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', lineHeight: '1.4', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)' }}
                      />
                    ) : (
                      <p style={{ fontSize: '1rem', color: 'var(--text-main)', whiteSpace: 'pre-line', margin: 0 }}>{formattedTweet}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEO Keywords & Metadata Tags Section */}
        {seoTags && seoTags.length > 0 && (
          <div className="result-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--accent)' }}>
                <Tag size={20} />
                SEO Keywords & Metadata Tags
              </h3>
            </div>
            
            <div className="result-body" style={{ marginBottom: 0, padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
              {isRegeneratingSeo && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                </div>
              )}
              
              {/* Top Toolbar INSIDE SEO Card */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                {isEditingSeo ? (
                  <>
                    <button
                      onClick={() => {
                        const parsed = tempSeoTagsText.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
                        setSeoTags(parsed);
                        setIsEditingSeo(false);
                      }}
                      style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      <Save size={12} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditingSeo(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      <X size={12} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setIsEditingSeo(true); setTempSeoTagsText(seoTags.join(', ')); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleCopyToClipboard(seoTags.map(t => `#${t}`).join(', '), 'seo')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      {copiedStatus['seo'] ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                      {copiedStatus['seo'] ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleRegenerate('seo_tags')}
                      disabled={isRegeneratingSeo}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: isRegeneratingSeo ? 0.6 : 1 }}
                    >
                      <RotateCw size={12} className={isRegeneratingSeo ? 'animate-spin' : ''} />
                      {isRegeneratingSeo ? 'Regenerating...' : 'Regenerate'}
                    </button>
                    <button
                      onClick={() => setShowRefineSeo(!showRefineSeo)}
                      style={{ background: 'none', border: 'none', color: showRefineSeo ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      <Sparkles size={12} /> Refine
                    </button>
                  </>
                )}
              </div>

              {showRefineSeo && !isEditingSeo && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <input
                    type="text"
                    placeholder="Ask AI to refine keywords... (e.g. 'Add e-commerce terms', 'Make it more technical')"
                    value={refineInstructionSeo}
                    onChange={(e) => setRefineInstructionSeo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && refineInstructionSeo.trim()) {
                        handleRegenerate('seo_tags', refineInstructionSeo, seoTags.join(', '));
                        setRefineInstructionSeo('');
                        setShowRefineSeo(false);
                      }
                    }}
                    style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-main)', outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      if (refineInstructionSeo.trim()) {
                        handleRegenerate('seo_tags', refineInstructionSeo, seoTags.join(', '));
                        setRefineInstructionSeo('');
                        setShowRefineSeo(false);
                      }
                    }}
                    style={{ padding: '0.4rem 0.85rem', backgroundColor: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Apply
                  </button>
                </div>
              )}

              {isEditingSeo ? (
                <textarea
                  value={tempSeoTagsText}
                  onChange={(e) => setTempSeoTagsText(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', lineHeight: '1.4', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)' }}
                />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {seoTags.map((tag, idx) => (
                    <span key={idx} style={{
                      padding: '0.45rem 0.9rem',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '30px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2 AI Promotional Images Section */}
        {(assetUrls.length > 0 || status === 'PROGRESS') && (
          <div className="result-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>
              <ImageIcon size={20} />
              2 AI Promotional Images
            </h3>
            {assetUrls.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {assetUrls.map((url, index) => {
                  const rawBanner = banners[index] || banners[0];
                  const banner = {
                    ...rawBanner,
                    badge: (rawBanner.badge || '').replace(/20%/g, `${price.discountPercent}%`),
                    bullet1: (rawBanner.bullet1 || '').replace(/20%/g, `${price.discountPercent}%`),
                    bullet2: (rawBanner.bullet2 || '').replace(/20%/g, `${price.discountPercent}%`),
                  };

                  if (index === 0) {
                    return (
                      <div key={index} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div className="result-media" style={{ marginBottom: 0, position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                          {/* Top Header Bar */}
                          <div style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              data-html2canvas-ignore="true"
                              onClick={() => handleRegenerate('image_1')}
                              disabled={isRegeneratingImage1}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.8rem',
                                background: 'var(--primary)',
                                border: 'none',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s ease',
                                opacity: isRegeneratingImage1 ? 0.6 : 1
                              }}
                            >
                              <RotateCw size={12} className={isRegeneratingImage1 ? 'animate-spin' : ''} />
                              {isRegeneratingImage1 ? 'Regenerating...' : 'Regenerate'}
                            </button>
                            <button
                              data-html2canvas-ignore="true"
                              onClick={() => setShowRefineImage1(!showRefineImage1)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.8rem',
                                background: showRefineImage1 ? 'var(--primary-hover)' : 'var(--primary)',
                                border: 'none',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s ease',
                                opacity: isRegeneratingImage1 ? 0.6 : 1
                              }}
                            >
                              <Sparkles size={12} /> Refine
                            </button>
                            <button
                              data-html2canvas-ignore="true"
                              onClick={() => downloadImage(imageRef1, `${result.product_name || 'Product'} - ad1.jpg`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.8rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-sm)',
                                fontSize: '0.8rem',
                                transition: 'background-color 0.2s ease',
                                fontFamily: 'var(--font-body)'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                            >
                              <Download size={12} /> Download JPG
                            </button>
                          </div>

                          {showRefineImage1 && (
                            <div data-html2canvas-ignore="true" style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                              <input
                                type="text"
                                placeholder="Ask AI to refine this image... (e.g. 'Add a cyberpunk background', 'Make lighting warm')"
                                value={refineInstructionImage1}
                                onChange={(e) => setRefineInstructionImage1(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && refineInstructionImage1.trim()) {
                                    handleRegenerate('image_1', refineInstructionImage1);
                                    setRefineInstructionImage1('');
                                    setShowRefineImage1(false);
                                  }
                                }}
                                style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-main)', outline: 'none' }}
                              />
                              <button
                                onClick={() => {
                                  if (refineInstructionImage1.trim()) {
                                    handleRegenerate('image_1', refineInstructionImage1);
                                    setRefineInstructionImage1('');
                                    setShowRefineImage1(false);
                                  }
                                }}
                                style={{ padding: '0.3rem 0.6rem', backgroundColor: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Apply
                              </button>
                            </div>
                          )}

                          {/* Image Container with Elegant direct-overlay layout */}
                          <div ref={imageRef1} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', display: 'block', backgroundColor: '#0f172a' }}>
                            {isRegeneratingImage1 && (
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                              </div>
                            )}
                            {/* Corner Ribbon inside Image Container (Clipped cleanly by container overflow hidden) */}
                            <div style={{
                              position: 'absolute',
                              top: '25px',
                              left: '-28px',
                              width: '130px',
                              zIndex: 15,
                              transform: 'rotate(-45deg)',
                              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)',
                              color: 'white',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              letterSpacing: '1px',
                              padding: '5px 0',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                              textTransform: 'uppercase',
                              fontFamily: 'var(--font-heading)',
                              lineHeight: '1.2',
                              pointerEvents: 'none'
                            }}>
                              NEW PRODUCT
                            </div>

                            {/* Top Right Social Follow Widget */}
                            <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              {/* Twitter (Light Blue Circle) */}
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <Twitter size={10} style={{ color: 'white', fill: 'white' }} />
                              </div>
                              {/* Instagram (Gradient Circle) */}
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <Instagram size={10} style={{ color: 'white' }} />
                              </div>
                              {/* Facebook (Dark Blue Circle) */}
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <Facebook size={10} style={{ color: 'white', fill: 'white' }} />
                              </div>
                            </div>

                            {/* Pristine Background Image */}
                            <img src={customImage1 || url} crossOrigin={(customImage1 || url).startsWith('data:') ? undefined : 'anonymous'} alt={`Promotional Asset ${index + 1}`} className="result-image" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />

                            {/* Direct Text Overlay Content (Slogan at top, features on left & right sides of centered product) */}
                            <div>
                              {/* Short Headline at the Top Center */}
                              <div style={{ position: 'absolute', top: '4.5rem', left: '1.5rem', right: '1.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', color: theme1.accent, pointerEvents: 'none' }}>
                                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', color: theme1.accent, letterSpacing: '1px', textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.95)', margin: 0 }}>
                                  {copy.headline || banner.title || 'ULTRA PREMIUM BUILD'}
                                </h1>
                              </div>

                              {/* Left Column Features (Float middle-left of center product, with soft backing edge vignette) */}
                              <div style={{ position: 'absolute', left: 0, top: '25%', bottom: '15%', width: '180px', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem', paddingLeft: '1.5rem', paddingRight: '2rem', background: 'linear-gradient(to right, rgba(15, 23, 42, 0.8) 20%, rgba(15, 23, 42, 0) 100%)', pointerEvents: 'none', transform: 'translateY(35px)' }}>
                                {leftBullets.map((bullet, idx) => (
                                  <div key={idx} style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
                                    {getFeatureIcon(bullet, idx, 22, theme1.accent)}
                                    <span>{bullet}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Right Column Features (Float middle-right of center product, with soft backing edge vignette) */}
                              <div style={{ position: 'absolute', right: 0, top: '25%', bottom: '15%', width: '180px', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', paddingRight: '1.5rem', paddingLeft: '2rem', background: 'linear-gradient(to left, rgba(15, 23, 42, 0.8) 20%, rgba(15, 23, 42, 0) 100%)', pointerEvents: 'none', transform: 'translateY(35px)' }}>
                                {rightBullets.map((bullet, idx) => (
                                  <div key={idx} style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
                                    {getFeatureIcon(bullet, idx + 3, 22, theme1.accent)}
                                    <span>{bullet}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Bottom Control Bar Overlay */}
                              <div style={{ position: 'absolute', bottom: '1.25rem', left: '3.5rem', right: '1.5rem', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                                {/* Left side: Website & User-Provided QR Code */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '350px', flexShrink: 0, minWidth: 0 }}>
                                  {/* Exact QR Code SVG matching user's upload */}
                                  <div style={{ padding: '5px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', width: '54px', height: '54px', flexShrink: 0 }}>
                                    <svg width="44" height="44" viewBox="0 0 21 21" fill="none" style={{ display: 'block' }}>
                                      <rect width="21" height="21" fill="white" />

                                      {/* Top Left Finder */}
                                      <path d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2z" fill="black" fillRule="evenodd" />

                                      {/* Top Right Finder */}
                                      <path d="M14 0h7v7h-7zm1 1v5h5V1zm1 1h3v3h-3z" fill="black" fillRule="evenodd" />

                                      {/* Bottom Left Finder */}
                                      <path d="M0 14h7v7H0zm1 1v5h5v-5zm1 1h3v3H2z" fill="black" fillRule="evenodd" />

                                      {/* Scattered QR code pixels matching user's image */}
                                      <rect x="8" y="2" width="1" height="1" fill="black" />
                                      <rect x="10" y="0" width="1" height="2" fill="black" />
                                      <rect x="9" y="3" width="2" height="1" fill="black" />
                                      <rect x="11" y="1" width="1" height="1" fill="black" />
                                      <rect x="12" y="2" width="1" height="2" fill="black" />
                                      <rect x="8" y="5" width="2" height="1" fill="black" />
                                      <rect x="9" y="4" width="1" height="1" fill="black" />
                                      <rect x="11" y="4" width="2" height="1" fill="black" />
                                      <rect x="10" y="6" width="1" height="1" fill="black" />
                                      <rect x="12" y="5" width="1" height="2" fill="black" />

                                      <rect x="0" y="8" width="2" height="1" fill="black" />
                                      <rect x="3" y="8" width="1" height="1" fill="black" />
                                      <rect x="5" y="8" width="3" height="1" fill="black" />
                                      <rect x="9" y="8" width="2" height="1" fill="black" />
                                      <rect x="12" y="8" width="2" height="1" fill="black" />
                                      <rect x="16" y="8" width="1" height="1" fill="black" />
                                      <rect x="18" y="8" width="3" height="1" fill="black" />

                                      <rect x="0" y="9" width="1" height="2" fill="black" />
                                      <rect x="2" y="10" width="2" height="1" fill="black" />
                                      <rect x="5" y="10" width="1" height="2" fill="black" />
                                      <rect x="7" y="11" width="2" height="1" fill="black" />
                                      <rect x="9" y="9" width="2" height="2" fill="black" />
                                      <rect x="12" y="10" width="1" height="1" fill="black" />
                                      <rect x="14" y="9" width="2" height="1" fill="black" />
                                      <rect x="17" y="10" width="1" height="2" fill="black" />
                                      <rect x="19" y="9" width="2" height="3" fill="black" />

                                      <rect x="8" y="12" width="2" height="1" fill="black" />
                                      <rect x="11" y="12" width="2" height="1" fill="black" />
                                      <rect x="14" y="12" width="2" height="1" fill="black" />
                                      <rect x="17" y="12" width="1" height="1" fill="black" />

                                      <rect x="8" y="13" width="1" height="2" fill="black" />
                                      <rect x="10" y="14" width="2" height="1" fill="black" />
                                      <rect x="13" y="13" width="1" height="2" fill="black" />
                                      <rect x="15" y="14" width="1" height="1" fill="black" />
                                      <rect x="17" y="14" width="2" height="1" fill="black" />
                                      <rect x="20" y="13" width="1" height="2" fill="black" />

                                      <rect x="8" y="16" width="1" height="1" fill="black" />
                                      <rect x="11" y="15" width="2" height="1" fill="black" />
                                      <rect x="14" y="16" width="1" height="2" fill="black" />
                                      <rect x="16" y="15" width="2" height="1" fill="black" />
                                      <rect x="19" y="16" width="1" height="1" fill="black" />

                                      <rect x="9" y="18" width="1" height="3" fill="black" />
                                      <rect x="11" y="18" width="2" height="1" fill="black" />
                                      <rect x="14" y="18" width="1" height="1" fill="black" />
                                      <rect x="16" y="18" width="2" height="2" fill="black" />
                                      <rect x="19" y="18" width="2" height="1" fill="black" />

                                      <rect x="11" y="20" width="3" height="1" fill="black" />
                                      <rect x="15" y="20" width="2" height="1" fill="black" />
                                      <rect x="18" y="20" width="1" height="1" fill="black" />
                                    </svg>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.4rem 0.8rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px', whiteSpace: 'normal', wordBreak: 'break-all', display: 'block', lineHeight: 1.15, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                      {websiteUrl}
                                    </span>
                                  </div>
                                </div>

                                {/* Right side: Shop Now CTA Button */}
                                <div
                                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px ' + theme1.btnHoverGlow; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px ' + theme1.btnGlow; }}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.15rem', background: theme1.primaryGradient, color: 'white', borderRadius: theme1.btnRadius, fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 4px 12px ' + theme1.btnGlow, pointerEvents: 'auto', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.2s ease' }}
                                >
                                  Explore Now <ArrowRight size={14} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Asset #2 (Sleek Value & Discount Overlay - Direct layout, No Card Containers or Buttons)
                  return (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="result-media" style={{ marginBottom: 0, position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                        {/* Top Header Bar */}
                        <div style={{ padding: '0.6rem 1.25rem', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            data-html2canvas-ignore="true"
                            onClick={() => handleRegenerate('image_2')}
                            disabled={isRegeneratingImage2}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.4rem 0.8rem',
                              background: 'var(--primary)',
                              border: 'none',
                              color: 'white',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s ease',
                              opacity: isRegeneratingImage2 ? 0.6 : 1
                            }}
                          >
                            <RotateCw size={12} className={isRegeneratingImage2 ? 'animate-spin' : ''} />
                            {isRegeneratingImage2 ? 'Regenerating...' : 'Regenerate'}
                          </button>
                          <button
                            data-html2canvas-ignore="true"
                            onClick={() => setShowRefineImage2(!showRefineImage2)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.4rem 0.8rem',
                              background: showRefineImage2 ? 'var(--primary-hover)' : 'var(--primary)',
                              border: 'none',
                              color: 'white',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s ease',
                              opacity: isRegeneratingImage2 ? 0.6 : 1
                            }}
                          >
                            <Sparkles size={12} /> Refine
                          </button>
                          <button
                            data-html2canvas-ignore="true"
                            onClick={() => downloadImage(imageRef2, `${result.product_name || 'Product'} - ad2.jpg`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.4rem 0.8rem',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow-sm)',
                              fontSize: '0.8rem',
                              transition: 'background-color 0.2s ease',
                              fontFamily: 'var(--font-body)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                          >
                            <Download size={12} /> Download JPG
                          </button>
                        </div>

                        {showRefineImage2 && (
                          <div data-html2canvas-ignore="true" style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                            <input
                              type="text"
                              placeholder="Ask AI to refine this image... (e.g. 'Add a cyberpunk background', 'Make lighting warm')"
                              value={refineInstructionImage2}
                              onChange={(e) => setRefineInstructionImage2(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && refineInstructionImage2.trim()) {
                                  handleRegenerate('image_2', refineInstructionImage2);
                                  setRefineInstructionImage2('');
                                  setShowRefineImage2(false);
                                }
                              }}
                              style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-main)', outline: 'none' }}
                            />
                            <button
                              onClick={() => {
                                  if (refineInstructionImage2.trim()) {
                                    handleRegenerate('image_2', refineInstructionImage2);
                                    setRefineInstructionImage2('');
                                    setShowRefineImage2(false);
                                  }
                              }}
                              style={{ padding: '0.3rem 0.6rem', backgroundColor: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Apply
                            </button>
                          </div>
                        )}

                        {/* Image Container with Direct Layout */}
                        <div ref={imageRef2} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', display: 'block', backgroundColor: '#0f172a' }}>
                          {isRegeneratingImage2 && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                            </div>
                          )}
                          {/* No dark vignette covering the image, ensuring product remains 100% bright and visible */}

                          {/* Top Left Discount Tag Based on Price - Swallowtail Red Ribbon Banner Design */}
                          <div style={{ position: 'absolute', top: 0, left: '1.5rem', zIndex: 15, width: '56px', height: '72px', backgroundColor: '#dc2626', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '10px', clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                              {Math.round(((price.original - price.discounted) / price.original) * 100)}%
                            </span>
                            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'white', marginTop: '3px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                              DISCOUNT
                            </span>
                          </div>

                          {/* Top Brand Story / Unique Dynamic Slogan */}
                          <div style={{ position: 'absolute', top: '7.5rem', left: '1.5rem', right: '1.5rem', zIndex: 10, color: theme2.accent, pointerEvents: 'none' }}>
                            <div style={{ fontSize: '1.15rem', fontStyle: 'italic', color: theme2.accent, fontWeight: 700, lineHeight: 1.45, textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.95)', letterSpacing: '0.5px' }}>
                              "{finalSlogan}"
                            </div>
                          </div>

                          {/* Top Right Social Follow Widget */}
                          <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            {/* Twitter (Light Blue Circle) */}
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              <Twitter size={10} style={{ color: 'white', fill: 'white' }} />
                            </div>
                            {/* Instagram (Gradient Circle) */}
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              <Instagram size={10} style={{ color: 'white' }} />
                            </div>
                            {/* Facebook (Dark Blue Circle) */}
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                              <Facebook size={10} style={{ color: 'white', fill: 'white' }} />
                            </div>
                          </div>

                          {/* Direct Overlay (Leaves center & top 100% visible, no container boxes) */}
                          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'white', pointerEvents: 'none' }}>
                            {/* Discount Offer Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
                              <div style={{ color: theme2.accent, fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                                {banner.badge}
                              </div>
                              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: theme2.accent, lineHeight: 1.1 }}>
                                {banner.title}
                              </h1>

                              {/* Dynamic Pricing Tag */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.2rem 0', fontSize: '1.2rem', fontWeight: 700 }}>
                                <span style={{ color: '#ef4444', textDecoration: 'line-through', opacity: 0.85 }}>₹{price.original}</span>
                                <span style={{ color: '#10b981' }}>₹{price.discounted}</span>
                              </div>

                              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                                {banner.extra_tag}
                              </div>
                            </div>

                            {/* CTA Shop Now Button Badge and Promo Code Container */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                              {/* Dynamic Promo Code Badge */}
                              <div style={{ padding: '0.35rem 0.7rem', border: '1px dashed #10b981', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.95)', whiteSpace: 'nowrap' }}>
                                CODE: {promoCode}
                              </div>

                              {/* Shop Now CTA Button */}
                              <div
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px ' + theme2.btnHoverGlow; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px ' + theme2.btnGlow; }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: theme2.primaryGradient, color: 'white', borderRadius: theme2.btnRadius, fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 4px 12px ' + theme2.btnGlow, pointerEvents: 'auto', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                              >
                                Shop Now <ArrowRight size={16} />
                              </div>
                            </div>
                          </div>

                          {/* Pristine Background Image (Perfecty clean and visible without any overlays) */}
                          <img src={customImage2 || url} crossOrigin={(customImage2 || url).startsWith('data:') ? undefined : 'anonymous'} alt={`Promotional Asset ${index + 1}`} className="result-image" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-main)', gap: '1rem' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Generating premium advertising graphics... ({progressStep || 'Starting'})
                </span>
              </div>
            )}
          </div>
        )}


      </div>
    );
  }

  return null;
}
