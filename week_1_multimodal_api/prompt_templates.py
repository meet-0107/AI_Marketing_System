"""
Prompt templates and tone configuration for the AI Marketing System.
This module defines the mapping between marketing text tones and matching visual styles,
ensuring that the generated image style matches the requested text tone.
"""

from typing import Dict, Any

# Map marketing tones to their text generation instructions and visual style modifiers.
TONE_CONFIG: Dict[str, Dict[str, str]] = {
    "professional": {
        "text_system_instruction": (
            "You are a sophisticated, professional copywriter specializing in high-end B2B and corporate marketing. "
            "Your writing is clear, authoritative, trustworthy, and analytical. "
            "Avoid hype, exclamation marks, and emojis. Focus on value propositions, professionalism, and industry credibility."
        ),
        "image_style_modifier": (
            "professional corporate branding aesthetic, elegant corporate design, office studio lighting, "
            "neutral color palette, clean backdrop, sharp focus, high-end DSLR product photography, 8k resolution"
        )
    },
    "playful": {
        "text_system_instruction": (
            "You are a friendly, enthusiastic, and highly engaging copywriter for consumer brands and creative products. "
            "Your writing is energetic, conversational, and lighthearted. "
            "Use relatable analogies, active verbs, and a few well-placed emojis to create a sense of fun and excitement."
        ),
        "image_style_modifier": (
            "vibrant and playful aesthetic, whimsical illustration style, bright pastel color palette, "
            "cheerful studio lighting, 3D claymation style, friendly design, high-quality digital render, colorful composition"
        )
    },
    "minimalist": {
        "text_system_instruction": (
            "You are a minimalist copywriter who believes in 'less is more'. "
            "Your writing is understated, elegant, calm, and direct. "
            "Focus on simplicity, mindfulness, and premium quality. Use short, impactful sentences and avoid unnecessary jargon or hype."
        ),
        "image_style_modifier": (
            "minimalist aesthetic, clean composition, soft natural lighting, pastel and earthy color tones, "
            "clean line art, high-end design catalog photography, simple background, calming atmosphere, hyper-minimalist"
        )
    },
    "futuristic": {
        "text_system_instruction": (
            "You are a visionary tech copywriter writing about cutting-edge innovation, AI, and futuristic concepts. "
            "Your writing is bold, inspiring, revolutionary, and slightly mysterious. "
            "Emphasize breakthrough technology, evolution, and shaping the future."
        ),
        "image_style_modifier": (
            "futuristic tech aesthetic, cyberpunk concept art, dark background with neon blue and purple accents, "
            "holographic elements, volumetric lighting, high tech interface, cinematic atmosphere, octane render, 3D digital art"
        )
    }
}

def get_system_instruction(tone: str) -> str:
    """
    Retrieve the text generation system instruction for a given tone.
    Defaults to 'professional' if the tone is not recognized.
    """
    tone = tone.lower().strip()
    config = TONE_CONFIG.get(tone, TONE_CONFIG["professional"])
    return config["text_system_instruction"]

def get_style_modifier(tone: str) -> str:
    """
    Retrieve the image generation style modifier for a given tone.
    Defaults to 'professional' if the tone is not recognized.
    """
    tone = tone.lower().strip()
    config = TONE_CONFIG.get(tone, TONE_CONFIG["professional"])
    return config["image_style_modifier"]

def format_copy_prompt(product_name: str, product_description: str, target_audience: str = None) -> str:
    """
    Format the user prompt for generating structured marketing copy (blog post + 3 tweet variants).
    """
    audience_clause = f" for the target audience: {target_audience}" if target_audience else ""
    return (
        f"Generate a comprehensive marketing package for a product named '{product_name}'{audience_clause}.\n"
        f"Product Description: {product_description}\n\n"
        "Please structure your response precisely in the following JSON format:\n"
        "{\n"
        '  "headline": "A short, catchy, attention-grabbing campaign headline.",\n'
        '  "blog_post": "A complete, engaging blog post (3-4 paragraphs) highlighting the problem, solution, features, and value proposition.",\n'
        '  "tweets": [\n'
        '    "Tweet 1: A punchy, attention-grabbing tweet highlighting a key benefit.",\n'
        '    "Tweet 2: An engaging question or problem-solution tweet with a strong hook.",\n'
        '    "Tweet 3: A direct call-to-action tweet emphasizing value and urgency."\n'
        '  ]\n'
        "}\n\n"
        "Return ONLY the raw JSON object, without markdown formatting or code blocks."
    )

def format_image_prompt(base_prompt: str, tone: str) -> str:
    """
    Combine a base image description prompt with the tone-aligned style modifier.
    """
    style_modifier = get_style_modifier(tone)
    clean_base = base_prompt.strip().rstrip(",")
    return f"{clean_base}, {style_modifier}"
