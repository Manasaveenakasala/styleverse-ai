
import hashlib
import re


GARMENT_KEYWORDS = {
    "Dress": ["dress", "gown", "maxi", "sundress"],
    "Jacket": ["jacket", "blazer", "coat", "hoodie"],
    "Shirt": ["shirt", "blouse", "top", "t-shirt"],
    "Skirt": ["skirt"],
    "Pants": ["pants", "trousers", "jeans", "leggings"],
}

FABRIC_KEYWORDS = {
    "Silk": ["silk", "satin"],
    "Denim": ["denim", "jeans"],
    "Leather": ["leather", "suede"],
    "Cotton": ["cotton", "linen"],
}

COLORS = {
    "burgundy": "#800020",
    "navy blue": "#1B365D",
    "lavender": "#B57EDC",
    "beige": "#D6C2A1",
    "gold": "#D4AF37",
    "teal": "#008080",
    "red": "#B22222",
    "blue": "#4779C7",
    "green": "#42856A",
    "black": "#29252B",
    "white": "#F4F0EB",
    "pink": "#A53D78",
    "rose": "#A53D78",
    "yellow": "#E5B93D",
    "purple": "#8054A8",
    "orange": "#E27D38",
    "brown": "#8B5A3C",
    "gray": "#808080",
    "grey": "#808080",
}

OCCASIONS = {
    "wedding": "a wedding celebration",
    "party": "a stylish party",
    "office": "a professional office setting",
    "work": "a polished workday look",
    "summer": "a relaxed summer outing",
    "winter": "a cozy winter occasion",
    "evening": "an elegant evening event",
    "formal": "a formal gathering",
    "casual": "a casual day out",
    "date": "a special date night",
}

STYLES = {
    "vintage": "vintage-inspired",
    "minimalist": "minimalist",
    "modern": "modern",
    "elegant": "elegant",
    "sporty": "sporty",
    "bohemian": "bohemian",
    "boho": "bohemian",
    "classic": "classic",
    "luxury": "luxurious",
    "chic": "chic",
}


def contains_keyword(text: str, keyword: str) -> bool:
    pattern = rf"\b{re.escape(keyword)}\b"
    return re.search(pattern, text) is not None


def detect_option(
    prompt: str,
    options: dict[str, list[str]],
    default: str,
) -> str:
    for option, keywords in options.items():
        if any(
            contains_keyword(prompt, keyword)
            for keyword in keywords
        ):
            return option

    return default


def detect_color(prompt: str) -> tuple[str, str]:
    for name, hex_value in COLORS.items():
        if contains_keyword(prompt, name):
            return name, hex_value

    return "rose", "#A53D78"


def detect_label(
    prompt: str,
    options: dict[str, str],
    default: str,
) -> str:
    for keyword, value in options.items():
        if contains_keyword(prompt, keyword):
            return value

    return default


def generate_fashion_suggestion(
    user_description: str,
) -> dict[str, str]:
    prompt = user_description.strip().lower()

    garment = detect_option(
        prompt,
        GARMENT_KEYWORDS,
        "Dress",
    )

    fabric = detect_option(
        prompt,
        FABRIC_KEYWORDS,
        "Cotton",
    )

    color_name, color = detect_color(prompt)

    occasion = detect_label(
        prompt,
        OCCASIONS,
        "everyday fashion",
    )

    style = detect_label(
        prompt,
        STYLES,
        "contemporary",
    )

    descriptions = [
        (
            f"A {style} {color_name} {fabric.lower()} "
            f"{garment.lower()} created for {occasion}. "
            f"The design features a refined silhouette "
            f"and thoughtfully balanced details."
        ),
        (
            f"This {color_name} {garment.lower()} "
            f"combines {fabric.lower()} fabric with "
            f"a {style} aesthetic. "
            f"Designed for {occasion}, it brings "
            f"comfort and personality together."
        ),
        (
            f"Discover a {style} approach to "
            f"{occasion} with this {color_name} "
            f"{fabric.lower()} {garment.lower()}. "
            f"Its clean proportions create "
            f"a versatile fashion statement."
        ),
    ]

    # Pick a consistent variation based on the prompt.
    # This avoids random changes during repeated tests.
    digest = hashlib.sha256(prompt.encode("utf-8")).digest()
    index = int.from_bytes(digest[:4], "big") % len(descriptions)

    description = descriptions[index]

    return {
        "garment": garment,
        "color": color,
        "fabric": fabric,
        "description": description,
    }
