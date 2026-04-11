---
name: dev-story-writer
description: Write an engaging developer diary story about a real development experience. Use when the user asks to write a dev story, development diary, engineering story, or retrospective narrative. TRIGGER when: the user mentions writing a dev story, dev-story, engineering diary, or wants to document a development experience as an interesting narrative. DO NOT TRIGGER when: the user asks for technical documentation, README, changelog, or how-to guide.
---

# Dev Story Writer

Write development experience stories that are engaging, emotionally honest, and inspire engineers on how to collaborate with AI. These are **not** tutorials, technical references, or changelogs. They are stories about the human experience of building software — with an AI collaborator.

## File Structure

```
dev-stories/
└── YYYY-MM/
    └── kebab-case-title.md
```

- Subfolder: `YYYY-MM` (year-month of the event)
- Filename: kebab-case, **no date prefix** (date lives in frontmatter)
- Path: `dev-stories/{YYYY-MM}/{title}.md`

## Frontmatter

```markdown
# {Title}

**Date:** {Month DD, YYYY}
**Duration:** {Human-readable duration, e.g. "Most of a Saturday", "Two evenings"}
**Result:** {One-line summary with key metric, e.g. "Pipeline wall clock cut from 147s to 87s (-41%)"}
```

## Perspective and Voice

- **"I" = the human developer.** The story is told from the human's point of view. Their frustrations, surprises, satisfactions, and decisions.
- **Claude is a named collaborator.** Refer to Claude as "Claude" (not "the AI" or "it"). Claude found things, proposed solutions, implemented changes. The human directed, decided, and verified.
- **Language:** English.
- **Tone:** Adventure/dev diary. Casual, personal, with moments of humor and vulnerability. Imagine writing a blog post you'd actually enjoy reading.
- **Length:** Flexible. "Interesting" is the only length criterion. A rich story can be long; a focused story can be short. Never pad or truncate to hit a target length.

## Emotional Depth

This is the most important quality differentiator. The story should feel **lived**, not reported.

### What to include

- **Inner monologue** — The human's real-time reactions: surprise, frustration, amusement, doubt, satisfaction, embarrassment ("I felt like an idiot for not noticing this sooner"), pride, the urge to keep going vs knowing when to stop
- **Decision moments** — Not just what was decided, but *why*, including the hesitation and trade-off reasoning. "I hesitated. Dropping a safety check feels wrong. But..."
- **Sensory details** — "I opened the CI tab," "I laughed out loud," "I held my breath and pushed"
- **Honest failures** — Things that didn't work as expected, wrong assumptions, the local test that failed for a surprising reason
- **The satisfaction of results** — But keep it grounded. "I let myself feel good about it for about ten seconds. Then I looked at the remaining jobs..."

### What to avoid

- **Tutorial tone** — Don't explain concepts the reader likely already knows. Technical details serve the narrative, not education.
- **Post-mortem detachment** — Don't write like you're analyzing the event from a distance. Write like it's happening to you right now.
- **Bragging** — Show, don't tell. Let the results speak. Include moments of doubt and failure to balance the wins.
- **Laundry lists** — Don't enumerate every change. Group them into narrative beats. Only include technical details when they're essential to the story.

## Story Structure

A good dev story follows an arc:

1. **Hook** — The frustration, curiosity, or situation that started it. Make the reader feel it.
2. **Investigation** — The discovery phase. What was surprising? What was the "aha" moment?
3. **Struggle** — Things that didn't go as expected. Trade-offs. Dead ends. Decisions.
4. **Resolution** — The results, with real numbers. The moment of seeing CI go green (or red).
5. **Reflection** — What made the collaboration work. The broader lesson. But keep it earned, not preachy.

Within this arc, organize by **narrative beats** (dramatic moments), not by chronological task completion. Group related changes into scenes. Skip the boring parts.

## Technical Content

- Include specific numbers and metrics — they make the story concrete and credible
- Show code snippets only when the code itself is part of the story (e.g., a clever config trick)
- Include timing tables when they demonstrate a dramatic change
- Name real files, tools, and technologies — no hand-waving

## The Collaboration Angle

The story should naturally convey how human-AI collaboration works in practice. This is the subtext, not the thesis. Show it through:

- **Who found what** — Claude found the 99.9% overhead stat; the human noticed the duplicate builds
- **Who decided what** — Claude proposed sharing build artifacts; the human rejected it because it would shift the bottleneck
- **Who verified what** — The human ran local tests and pushed; Claude analyzed remote CI results
- **The rhythm** — Investigate → Plan → Execute → Verify → Decide, repeated in cycles

Do NOT include a "What I Learned" section that reads like a blog post conclusion. Instead, weave the lessons into the narrative or put them in a brief, personal reflection at the end.
