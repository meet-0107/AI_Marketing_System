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
            "award-winning commercial product photography, pristine visual hierarchy, no text, no words, no watermarks, "
            "flawless photographic composition, dramatic studio product lighting, magazine-quality promotional imagery, 8k ultra HD"
        )
    },
    "playful": {
        "text_system_instruction": (
            "You are a friendly, enthusiastic, and highly engaging copywriter for consumer brands and creative products. "
            "Your writing is energetic, conversational, and lighthearted. "
            "Use relatable analogies, active verbs, and a few well-placed emojis to create a sense of fun and excitement."
        ),
        "image_style_modifier": (
            "vibrant commercial product photography, dynamic playful atmosphere, no text, no words, no watermarks, "
            "colorful photographic composition, cheerful studio lighting, high-converting promotional marketing imagery, 8k resolution"
        )
    },
    "minimalist": {
        "text_system_instruction": (
            "You are a minimalist copywriter who believes in 'less is more'. "
            "Your writing is understated, elegant, calm, and direct. "
            "Focus on simplicity, mindfulness, and premium quality. Use short, impactful sentences and avoid unnecessary jargon or hype."
        ),
        "image_style_modifier": (
            "ultra-minimalist commercial product photography, pristine clean visual setup, no text, no words, no watermarks, "
            "elegant photographic composition, soft natural studio lighting, high-end catalog promotional imagery, 8k resolution"
        )
    },
    "futuristic": {
        "text_system_instruction": (
            "You are a visionary tech copywriter writing about cutting-edge innovation, AI, and futuristic concepts. "
            "Your writing is bold, inspiring, revolutionary, and slightly mysterious. "
            "Emphasize breakthrough technology, evolution, and shaping the future."
        ),
        "image_style_modifier": (
            "futuristic tech product photography, cyberpunk concept lighting, no text, no words, no watermarks, "
            "cinematic photographic composition, volumetric neon studio lighting, high-tech promotional imagery, 8k ultra HD"
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
    Format the user prompt for generating structured marketing copy (blog post + 3 tweet variants + dynamic image banners).
    """
    audience_clause = f" for the target audience: {target_audience}" if target_audience else ""
    
    desc_section = f"Product Description: {product_description}\n\n" if product_description else (
        f"You must automatically infer and generate a premium, high-end commercial product description "
        f"and key features/specifications for this product based on its name '{product_name}'.\n\n"
    )
    
    return (
        f"Generate a comprehensive marketing package for a product named '{product_name}'{audience_clause}.\n"
        f"{desc_section}"
        "Please structure your response precisely in the following JSON format:\n"
        "{\n"
        '  "product_description": "A premium, high-end commercial product description of 2-3 sentences based on the product name and context.",\n'
        '  "headline": "An extremely attractive, emotional, and catchy advertising slogan/headline of exactly 5 to 6 words (no more, no less) designed to instantly hook customers and create purchase desire.",\n'
        '  "funny_slogan": "A witty, clever, yet professional and catchy advertising slogan of exactly 5 to 6 words tailored to the product. e.g. \'Cancel Noise, Not Your Plans\' (6 words).",\n'
        '  "features": [\n'
        '    "Feature 1: A very short 2-3 word feature/spec of the product. e.g., Active Noise Cancelling",\n'
        '    "Feature 2: A very short 2-3 word feature/spec of the product. e.g., 40-Hour Playtime",\n'
        '    "Feature 3: A very short 2-3 word feature/spec of the product. e.g., Ultra Comfort Fit",\n'
        '    "Feature 4: A very short 2-3 word feature/spec of the product. e.g., Studio Grade Audio",\n'
        '    "Feature 5: A very short 2-3 word feature/spec of the product. e.g., Fast Charging USB-C",\n'
        '    "Feature 6: A very short 2-3 word feature/spec of the product. e.g., Sweat & Water Resistant"\n'
        '  ],\n'
        '  "blog_post": "A complete, engaging blog post that MUST follow this exact Markdown template structure, filled with the product details:\\n\\n# {Product Name}: {Short Catchy Headline}\\n\\n## Introduction\\n\\nLooking for a **{product_category}** that combines **{benefit_1}**, **{benefit_2}**, and **{benefit_3}**? The **{Product Name}** is designed to deliver outstanding performance, premium quality, and exceptional value. Whether you\'re a **{target_audience}**, this product is built to meet your everyday needs.\\n\\n---\\n\\n## Key Features\\n\\n* **{Feature 1}** – {Short description}\\n* **{Feature 2}** – {Short description}\\n* **{Feature 3}** – {Short description}\\n* **{Feature 4}** – {Short description}\\n* **{Feature 5}** – {Short description}\\n\\n---\\n\\n## Why Choose {Product Name}?\\n\\nThe **{Product Name}** stands out with its combination of **{USP_1}**, **{USP_2}**, and **{USP_3}**. Designed using high-quality materials and modern technology, it offers reliability, durability, and a premium user experience.\\n\\n---\\n\\n## Benefits\\n\\n* Improves your daily experience\\n* Built with premium-quality materials\\n* Stylish and modern design\\n* Easy to use and maintain\\n* Excellent value for money\\n\\n---\\n\\n## Customer Experience\\n\\nCustomers appreciate the **{Product Name}** for its **{positive_point_1}**, **{positive_point_2}**, and **{positive_point_3}**. It consistently delivers reliable performance while maintaining a premium look and feel.\\n\\n---\\n\\n## Final Thoughts\\n\\nIf you\'re searching for a **{product_category}** that offers **quality, performance, and value**, the **{Product Name}** is an excellent choice. Experience the perfect combination of innovation, durability, and style.\\n\\n### Call to Action\\n\\n**Upgrade your experience today with the {Product Name}. Order now and enjoy premium quality like never before!**",\n'
        '  "tweets": [\n'
        '    "Tweet 1: A punchy, attention-grabbing tweet highlighting a key benefit. Include 2-3 relevant hashtags.",\n'
        '    "Tweet 2: An engaging question or problem-solution tweet with a strong hook. Include 2-3 relevant hashtags.",\n'
        '    "Tweet 3: A direct call-to-action tweet emphasizing value and urgency. Include 2-3 relevant hashtags."\n'
        '  ],\n'
        '  "image_banners": [\n'
        '    {\n'
        '      "badge": "✨ EXCLUSIVE EDITION",\n'
        '      "title": "A very short, punchy 3-4 word title. e.g., ULTRA PREMIUM BUILD",\n'
        '      "bullet1": "A short 2-3 word benefit from the description. e.g., Flawless Durability",\n'
        '      "bullet2": "A short 2-3 word hook. e.g., Next-Gen Innovation",\n'
        '      "extra_tag": "A short 3-4 word credibility stat or tag. e.g., 98% Customer Satisfaction",\n'
        '      "supporting_message": "An elegant B2C supporting brand narrative sentence showing how this product improves everyday life."\n'
        '    },\n'
        '    {\n'
        '      "badge": "🏆 100% QUALITY INSPECTED",\n'
        '      "title": "A very short, bold 3-4 word headline. e.g., UNMATCHED ELEGANCE",\n'
        '      "bullet1": "A short 2-3 word action prompt. e.g., Claim Your Upgrade",\n'
        '      "bullet2": "A short 2-3 word urgency hook. e.g., Offer Ends Soon",\n'
        '      "extra_tag": "A short 3-4 word exclusivity note. e.g., Limited Time Exclusive",\n'
        '      "supporting_message": "An elegant B2C supporting brand narrative sentence showing how this product improves everyday life."\n'
        '    }\n'
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
