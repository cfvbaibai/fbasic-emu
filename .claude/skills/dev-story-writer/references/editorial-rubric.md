# Editorial Rubric

Six criteria for evaluating dev story drafts. The editor scores each criterion (pass/revise) and provides **specific, actionable feedback** - no vague suggestions.

## 1. Hook

The first paragraph must create immediate curiosity. It should contain a concrete problem, data point, or tension - not a gentle introduction.

**Pass:** Reader feels compelled to keep reading after the first 2-3 sentences.
**Revise if:** The story opens with background, setup, or throat-clearing before anything interesting happens. Common anti-patterns: "Recently I've been working on..." or "In this post I'll describe..."

**Source pattern:** Stripe engineering blog "How we built it" posts - they open mid-problem, not mid-context.

## 2. Concrete Specifics

Real numbers, real file names, real error messages. No vague abstractions or hand-waving.

**Pass:** The reader could reproduce or verify the story's claims. Metrics, durations, file counts, error messages are present.
**Revise if:** Claims are vague ("it was slow," "the code was messy"). Replace with specifics ("147 seconds per run," "3 files with duplicated patterns").

**Consistency sub-check:** When multiple numbers appear together, verify their relationships make logical sense. "106 issues created, 208 implemented" is a red flag — how can more be implemented than created? Each number may be individually true but imply a false causal chain. If presenting multiple metrics, ensure the reader can understand *why* they differ (e.g., "106 created by automation, 208 total resolved including pre-existing issues") or present only the numbers that directly support the narrative point.

**Source pattern:** Sean Goedecke's writing - every claim is backed by a specific number, screenshot, or artifact.

## 3. Show Don't Tell

Emotions are demonstrated through action and detail, not stated directly.

**Pass:** The reader *feels* the frustration/surprise/satisfaction without being told what to feel. The human's inner experience is revealed through what they *do* and *notice*.
**Revise if:** The story says "I was frustrated" instead of showing frustration through actions, decisions, or sensory details. "I stared at the CI tab for two minutes before closing my laptop" > "I was frustrated."

## 4. Narrative Tension

The story contains real struggle - surprises, dead ends, wrong assumptions, moments of doubt. Not just a success log.

**Pass:** At least 2-3 moments where things didn't go as expected or the outcome was uncertain.
**Revise if:** The story reads as a straight line from problem to solution with no bumps. Every optimization worked. Every guess was right. If real dead ends didn't happen, the story needs a different angle or shouldn't be written yet.

**Source pattern:** Hacker News top posts consistently feature "I tried X, it failed because Y, then I discovered Z" structures.

## 5. Pacing

Every section earns its place. No boring sections. Short paragraphs. Varied rhythm.

**Pass:** No section feels like filler. The reader never skims. Long sections are broken by short punchy lines.
**Revise if:** There's a section that could be removed without losing anything. There are long explanatory paragraphs that serve the reader's education rather than the story's momentum.

**Source pattern:** Simon Willison's writing - short, punchy, every paragraph justified.

## 6. Collaboration Dynamic

Human and AI have distinct, visible roles with clear agency. Neither is a passive tool.

**Pass:** It's clear who found what, who decided what, who pushed back on what. The collaboration has a rhythm, not a one-directional command structure.
**Revise if:** The story reads like "I told AI to do X, and it did X." Or the reverse - "AI did everything and I watched." The human's judgment and the AI's contributions should both be visible.
