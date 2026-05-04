"""
NLP utilities for AutoStream agent.

Covers:
- Entity extraction: identifies names, emails, platforms, plan mentions
- Sentiment analysis: classifies user emotional tone
- Intent confidence scoring
"""

import re
from dataclasses import dataclass, field
from typing import Optional


# ─────────────────────────────────────────────
# DATA CLASSES
# ─────────────────────────────────────────────

@dataclass
class ExtractedEntities:
    """Entities extracted from a user message."""
    email: Optional[str] = None
    platform: Optional[str] = None
    plan_mentioned: Optional[str] = None         # "basic" | "pro" | None
    name_candidate: Optional[str] = None         # Raw text that could be a name


@dataclass
class SentimentResult:
    """Result of sentiment analysis on a user message."""
    label: str = "neutral"                       # "positive" | "negative" | "neutral" | "frustrated"
    score: float = 0.5                           # 0.0 (very negative) → 1.0 (very positive)
    signals: list = field(default_factory=list)  # Keywords that drove the classification


# ─────────────────────────────────────────────
# ENTITY EXTRACTION
# ─────────────────────────────────────────────

KNOWN_PLATFORMS = [
    "youtube", "instagram", "tiktok", "facebook", "linkedin",
    "twitter", "x", "twitch", "snapchat", "pinterest", "reddit"
]

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


def extract_entities(message: str) -> ExtractedEntities:
    """
    Extract structured entities from a user message.

    Detects:
    - Email addresses via regex
    - Social media platform names
    - Plan mentions (Basic / Pro)
    - Potential name (short capitalized phrase, not a keyword)

    Args:
        message: Raw user message text

    Returns:
        ExtractedEntities dataclass
    """
    entities = ExtractedEntities()
    msg_lower = message.lower().strip()

    # Email
    email_match = EMAIL_REGEX.search(message)
    if email_match:
        entities.email = email_match.group()

    # Platform
    for platform in KNOWN_PLATFORMS:
        if platform in msg_lower:
            entities.platform = platform.capitalize()
            break

    # Plan mention
    if "pro" in msg_lower and "plan" in msg_lower or "pro plan" in msg_lower:
        entities.plan_mentioned = "pro"
    elif "basic" in msg_lower:
        entities.plan_mentioned = "basic"
    elif "pro" in msg_lower:
        entities.plan_mentioned = "pro"

    # Name candidate: short message (≤5 words), no @, no digits, starts with capital
    words = message.strip().split()
    if (
        1 <= len(words) <= 5
        and "@" not in message
        and not any(char.isdigit() for char in message)
        and words[0][0].isupper()
    ):
        # Filter out known keywords
        non_name_words = {
            "yes", "no", "ok", "okay", "sure", "thanks", "thank", "you",
            "hi", "hello", "hey", "great", "good", "fine", "i", "me",
            "youtube", "instagram", "tiktok", "facebook", "twitter"
        }
        if not any(w.lower() in non_name_words for w in words):
            entities.name_candidate = message.strip()

    return entities


# ─────────────────────────────────────────────
# SENTIMENT ANALYSIS
# ─────────────────────────────────────────────

POSITIVE_SIGNALS = [
    "great", "awesome", "love", "perfect", "excellent", "amazing", "fantastic",
    "wonderful", "super", "happy", "excited", "yes", "sure", "definitely",
    "interested", "sounds good", "that's great", "thank", "helpful", "nice"
]

NEGATIVE_SIGNALS = [
    "expensive", "too much", "pricey", "costly", "can't afford", "not worth",
    "disappointing", "bad", "terrible", "awful", "hate", "waste", "useless",
    "no refund", "scam", "rip off", "cancel", "quit", "leave", "unsubscribe"
]

FRUSTRATED_SIGNALS = [
    "why", "still", "again", "doesn't work", "not working", "broken",
    "issue", "problem", "bug", "error", "stuck", "confused", "unclear",
    "don't understand", "what do you mean", "tried", "keeps", "failing"
]


def analyze_sentiment(message: str) -> SentimentResult:
    """
    Classify the emotional tone of a user message.

    Uses keyword heuristics for speed. In production, this could be
    replaced with a fine-tuned classifier or LLM-based scoring.

    Args:
        message: Raw user message text

    Returns:
        SentimentResult with label and score
    """
    msg_lower = message.lower()
    result = SentimentResult()

    pos_hits = [s for s in POSITIVE_SIGNALS if s in msg_lower]
    neg_hits = [s for s in NEGATIVE_SIGNALS if s in msg_lower]
    fru_hits = [s for s in FRUSTRATED_SIGNALS if s in msg_lower]

    if fru_hits:
        result.label = "frustrated"
        result.score = max(0.1, 0.4 - 0.05 * len(fru_hits))
        result.signals = fru_hits
    elif neg_hits:
        result.label = "negative"
        result.score = max(0.1, 0.35 - 0.05 * len(neg_hits))
        result.signals = neg_hits
    elif pos_hits:
        result.label = "positive"
        result.score = min(0.95, 0.65 + 0.05 * len(pos_hits))
        result.signals = pos_hits
    else:
        result.label = "neutral"
        result.score = 0.5
        result.signals = []

    return result
