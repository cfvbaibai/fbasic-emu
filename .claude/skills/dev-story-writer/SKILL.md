---
name: dev-story-writer
description: "Write an engaging developer diary story about a real development experience using a collaborative writer-editor workflow. Use when the user asks to write a dev story, dev-story, engineering diary, or retrospective narrative. TRIGGER when: the user mentions writing a dev story, dev-story, engineering diary, or wants to document a development experience as an interesting narrative. DO NOT TRIGGER when: the user asks for technical documentation, README, changelog, or how-to guide."
---

# Dev Story Writer

Write development experience stories through a **writer-editor collaborative workflow** - a writer subagent drafts the story, an editor subagent reviews it against editorial criteria, and they iterate until the editor is satisfied.

These are **not** tutorials, technical references, or changelogs. They are stories about the human experience of building software - with an AI collaborator.

## Workflow Overview

```
Research -> Draft -> Review -> Revise -> Review -> ... -> Final Story
   |          |        |        |        |
  human     writer   editor   writer   editor
```

1. **Research** - The lead agent gathers context (git log, code changes, open issues) and presents the story topic to the user for confirmation
2. **Draft** - Writer subagent writes the first draft following the writing guidelines below
3. **Review** - Editor subagent evaluates against the editorial rubric and provides visible feedback
4. **Revise** - Writer subagent improves the draft based on editorial feedback
5. **Loop** - Steps 3-4 repeat until the editor approves or 10 rounds are reached
6. **Finalize** - Approved story is saved to `dev-stories/YYYY-MM/title.md`

### Editorial Notes Visibility

Every editor review is displayed to the user. The user sees:
- Which criteria passed/need revision
- Specific, actionable feedback for each criterion that needs work
- The editor's overall assessment and whether another round is needed

This is a **transparent process** - the user can intervene at any point to provide direction, override editorial decisions, or accept a draft early.

## Step 1: Research and Topic Confirmation

Before spawning any subagents, gather the raw material:

1. Run `git log --oneline -30` to find recent activity
2. Ask the user what development experience they want to document (a specific PR, debugging session, feature implementation, etc.)
3. Once the topic is confirmed, gather deeper context:
   - Relevant PRs and their descriptions (`gh pr view`)
   - Changed files and diffs for the story's scope
   - Related issues or discussions
   - Any relevant metrics or numbers

Present a brief summary to the user: *topic, key events, expected story angle*. Get confirmation before proceeding.

## Step 2: Spawn the Writer Subagent

Spawn a **general-purpose** agent as the writer with:

- **Name:** `writer`
- **Mode:** `bypassPermissions` (needs to write files)
- **Context in prompt:** The research summary, the writing guidelines below, and the file path for the draft

### Writer Prompt Template

```
You are a dev story writer. Write a draft dev story based on the following research.

## Topic
{research summary}

## Output
Write the draft to: {draft-file-path}
Follow all writing guidelines from the SKILL.md content provided below.

## Writing Guidelines
{full content of this SKILL.md's "Writing Guidelines" section}

## Research Data
{git log, PR descriptions, diffs, metrics, etc.}

Write the complete draft now. Do not ask questions - make your best editorial judgment.
```

## Step 3: Spawn the Editor Subagent

After the writer produces a draft, spawn a **general-purpose** agent as the editor with:

- **Name:** `editor`
- **Context in prompt:** The editorial rubric and the draft content

### Editor Prompt Template

```
You are a dev story editor. Review the following draft against the editorial rubric.

## Draft
{content of the draft file}

## Editorial Rubric
Read the rubric at: {path-to-editorial-rubric.md}

## Your Task
1. Read the rubric carefully
2. Evaluate the draft against ALL 6 criteria
3. For each criterion, respond with:
   - PASS or REVISE
   - If REVISE: specific, actionable feedback with examples from the draft
4. Provide an overall verdict: APPROVE or REQUEST_REVISION
5. If REQUEST_REVISION: prioritize the top 2-3 changes that would have the most impact

Be harsh but fair. A story that passes on first review is rare. Vague feedback like "make it more engaging" is not acceptable - point to specific passages and suggest concrete improvements.

Output your review as a structured report. Do NOT edit the draft yourself.
```

## Step 4: Iteration Loop

```
editor verdict == APPROVE -> save final story, done
editor verdict == REQUEST_REVISION -> send feedback to writer -> writer revises -> back to editor
round >= 10 -> save current draft with note, done
```

When the editor requests revision:
1. Display the editorial review to the user
2. Send the editorial feedback to the writer subagent with instructions to revise
3. Writer revises the draft in place
4. Send the revised draft back to the editor
5. Repeat

**Maximum 10 revision cycles.** After 10 rounds, accept the current draft and save it.

## Step 5: Finalize

Once approved:
1. Display the final editorial verdict to the user
2. Copy the approved draft to `dev-stories/YYYY-MM/{kebab-case-title}.md`
3. Report the file path to the user

## Writing Guidelines

These guidelines are for the writer subagent. They define what makes a good dev story.

### File Structure

```
dev-stories/
  YYYY-MM/
    kebab-case-title.md
```

- Subfolder: `YYYY-MM` (year-month of the event)
- Filename: kebab-case, **no date prefix** (date lives in frontmatter)

### Frontmatter

```markdown
# {Title}

**Date:** {Month DD, YYYY}
**Duration:** {Human-readable duration, e.g. "Most of a Saturday", "Two evenings"}
**Result:** {One-line summary with key metric, e.g. "Pipeline wall clock cut from 147s to 87s (-41%)"}
```

### Perspective and Voice

- **"I" = the human developer.** The story is told from the human's point of view. Their frustrations, surprises, satisfactions, and decisions.
- **Claude is a named collaborator.** Refer to Claude as "Claude" (not "the AI" or "it"). Claude found things, proposed solutions, implemented changes. The human directed, decided, and verified.
- **Language:** English.
- **Tone:** Adventure/dev diary. Casual, personal, with moments of humor and vulnerability. Imagine writing a blog post you'd actually enjoy reading.
- **Length:** Flexible. "Interesting" is the only length criterion. Never pad or truncate to hit a target length.

### Emotional Depth

This is the most important quality differentiator. The story should feel **lived**, not reported.

**Include:**
- **Inner monologue** - The human's real-time reactions: surprise, frustration, amusement, doubt, satisfaction, embarrassment
- **Decision moments** - Not just what was decided, but *why*, including hesitation and trade-off reasoning
- **Sensory details** - "I opened the CI tab," "I laughed out loud," "I held my breath and pushed"
- **Honest failures** - Things that didn't work, wrong assumptions, surprising test failures
- **Grounded satisfaction** - "I let myself feel good about it for about ten seconds. Then I looked at the remaining jobs..."

**Avoid:**
- **Tutorial tone** - Technical details serve the narrative, not education
- **Post-mortem detachment** - Write like it's happening to you right now, not analyzing from a distance
- **Bragging** - Show, don't tell. Let results speak. Include doubt and failure to balance wins
- **Laundry lists** - Group changes into narrative beats. Only include technical details essential to the story

### Story Structure

1. **Hook** - The frustration, curiosity, or situation that started it. Make the reader feel it.
2. **Investigation** - The discovery phase. What was surprising? What was the "aha" moment?
3. **Struggle** - Things that didn't go as expected. Trade-offs. Dead ends. Decisions.
4. **Resolution** - The results, with real numbers. The moment of seeing CI go green (or red).
5. **Reflection** - What made the collaboration work. The broader lesson. Earned, not preachy.

Organize by **narrative beats** (dramatic moments), not chronological task completion. Skip the boring parts.

### Technical Content

- Include specific numbers and metrics - they make the story concrete and credible
- Show code snippets only when the code itself is part of the story
- Include timing tables when they demonstrate a dramatic change
- Name real files, tools, and technologies - no hand-waving

### The Collaboration Angle

The subtext, not the thesis. Show it through:
- **Who found what** - Claude found the 99.9% overhead stat; the human noticed the duplicate builds
- **Who decided what** - Claude proposed sharing build artifacts; the human rejected it
- **Who verified what** - The human ran local tests; Claude analyzed remote CI results
- **The rhythm** - Investigate -> Plan -> Execute -> Verify -> Decide, repeated in cycles

Do NOT include a "What I Learned" section that reads like a blog post conclusion. Weave lessons into the narrative or put them in a brief, personal reflection.
