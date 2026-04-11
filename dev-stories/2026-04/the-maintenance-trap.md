# The Maintenance Trap

**Date:** April 11, 2026
**Duration:** Three weeks of frustration, ten minutes of breakthrough
**Result:** 5 new feature issues (#534–#538) after 822 discover-issues runs produced nothing but maintenance work

---

## The Loop

I have a command called `/discover-issues`. It scans the codebase for problems — hardcoded strings, missing tests, TODO comments, files approaching the 500-line limit, code quality patterns — and creates GitHub issues for whatever it finds. It's thorough. It's well-engineered. It has a five-area rotation system, a self-improvement protocol, and a finding synthesis phase that deduplicates and ranks results.

Over the past three weeks, I ran it. And ran it. And ran it.

822 times.

It found plenty. 106 issues created, every single one a maintenance task — extract this, refactor that, parameterize the other thing. The codebase got cleaner. Tests got better. Constants were extracted, helpers were shared, duplicated patterns were consolidated. April's merged PRs tell the story plainly:

| Type | Count | Share |
|------|-------|-------|
| Refactor | 20 | 63% |
| Test | 9 | 28% |
| Fix | 3 | 9% |
| Feature | 0 | 0% |

**Zero new features.** Thirty-two merged pull requests. Every single one was maintenance.

I'd sit down, run `/discover-issues`, watch it produce three perfectly reasonable issues — "extract shared palette reset helper," "normalize vitest import spacing," "parameterize coordinate assertions" — review them, approve them, watch agents implement them, review the PRs, merge them. Then I'd run it again.

Each cycle was maybe an hour or two. Each issue was real, valid, useful. The code was genuinely getting better. And yet, after reviewing and merging the latest PR, I'd close the laptop. Not to go do something else — just close it. Sit there. Open it again ten minutes later, pull up the GitHub issues tab, see the same 21 p3s staring back, and close it again.

---

## The Signs

The roadmap had been saying "No active work. All planned commands are implemented" since March 1st. Over a month of "nothing to do." The issue backlog had grown to 21 open issues, almost all p3 — the lowest priority. Ninety percent of April's PRs were maintenance.

The project wasn't dying. It was well-maintained. And that was the problem.

A well-maintained project with no new features is a project that's standing still. The parser was complete. The runtime was complete. The sprite system, the animation system, the sound system, the BG editor — all done. Fifty-five commands and functions, fully implemented. The automation was finding fewer and fewer real issues, producing increasingly marginal improvements.

I kept running the command because I kept hoping that *this time* it would find something exciting. Something that would make me want to open the IDE and build something new. But a scanner that looks for problems will only ever find problems. And a codebase with fewer problems produces fewer findings. I was using a magnifying glass to look for mountains.

---

## The Breakthrough

Yesterday I'd merged PR #531 — another refactoring, extracting a timeout constant — and caught myself staring at the terminal for a full minute afterward, cursor blinking, nothing to type. That stare was the trigger. I was waiting for the command to give me something it wasn't built to give.

Today I opened Claude and said something different. Not `/discover-issues`. Not "check for problems." Instead:

> "Brainstorm on the current codebase and check what we can do next."

Claude started exploring. It read the roadmap, checked recent commits, listed open issues, analyzed the codebase structure. It came back with a summary that was honest without being cruel:

> "The project is in a **mature maintenance/refinement phase**."

I read that line twice. My fingers hovered over the keyboard — I'd started drafting a reply, something defensive about all the progress, about how 176 PRs in a month isn't nothing. I deleted it. Claude wasn't wrong. But then it asked me a question I hadn't been asked in weeks:

> "What direction interests you most?"

It offered options. And not "extract constants" or "normalize imports." Real options:

- **Step Debugger** — breakpoints, step execution, live variable watch
- **Shareable Programs via URL** — encode programs in the URL, no backend needed
- **CRT/NTSC Authentic Rendering Filter** — scanlines, phosphor glow, instant nostalgia
- **Music Composer** — visual piano-roll sequencer that generates PLAY statements

I leaned forward in my chair. Opened a new editor tab, pulled up `src/features/`, and started scanning the feature directories — already thinking about where a CRT filter would hook in, which component would own the shareable URL logic. Three weeks of closing the laptop, and now I was involuntarily planning architecture. These were ideas. Actual, creative, "I want to build that" ideas. Not maintenance tasks dressed up as work.

I picked all of them. Well, except the step debugger — that one didn't resonate. But the others? Shareable URLs, CRT filter, music composer, plus two more: standalone HTML export and an interactive tutorial system. Five features, each with clear motivation, architecture, and a path to implementation.

---

## The Moment of Clarity

After we settled on the five features, Claude did something that made the whole three weeks click into place. It created the GitHub issues — detailed, well-structured, with affected files and implementation notes. As I watched them appear one by one in the GitHub issues tab, I realized the difference.

The issues from `/discover-issues` all follow the same pattern. They describe something that's *wrong*:

- "extract shared helper for duplicated loops"
- "remove redundant label field from test data"
- "fix missing space in vitest import"

They're reactive. They respond to the code as it exists. They make the code better, but they don't change what the code *does*.

The issues from brainstorming describe something that *doesn't exist yet*:

- "add visual music composer / sequencer"
- "add shareable programs via URL"
- "add interactive tutorial system for learning F-BASIC"

They're creative. They imagine what the code could become. They change what the project *is*.

**You can't discover new features by looking for old problems.**

It's embarrassingly obvious in retrospect. The discover-issues command is a brilliant tool for what it does — finding imperfections in existing code. But imperfection-finding is the opposite of ideation. One looks backward at what's wrong. The other looks forward at what could be.

I'd spent three weeks asking a microscope to suggest my next vacation destination.

---

## The Issues

Within minutes, five issues materialized:

| Issue | Feature | Why it matters |
|-------|---------|----------------|
| #534 | CRT/NTSC Filter | ~100 lines, instant nostalgia, everything after it looks better |
| #535 | Shareable URLs | Growth multiplier — every other feature benefits from shareability |
| #536 | Music Composer | Unique in the F-BASIC ecosystem, visual creativity tool |
| #537 | Tutorial System | Turns IDE into educational platform, drives adoption |
| #538 | Standalone HTML Export | Programs become portable artifacts |

Each one came with implementation notes, affected files, effort estimates, and triage recommendations. The kind of issues that make you want to open your editor and start coding.

For contrast, here's what discover-issues had been producing in the same period:

> refactor: simplify overly defensive triple fallback in fillCanvasWithBackdrop
> refactor: parameterize repeated sprite assertion pattern in printable-area test
> style: fix missing space in vitest import in printable-area.test.ts
> refactor: extract PAUSE timing constants in PauseDemo test
> refactor: extract LONG_STABLE_TIMEOUT_MS constant in sprite-control test

Valid work. Useful work. The kind of work that keeps a codebase healthy. But not the kind of work that makes you leap out of your chair.

---

## The 822-Run Lesson

822 runs. 106 issues. Zero new features. Three weeks of staring at a blinking cursor with nothing to type.

Then ten minutes of "hey, what should we build next?" and I was already scanning feature directories, mentally sketching component trees.

The lesson isn't that discover-issues is bad — it's excellent at its job. The lesson is that **maintenance and innovation require different modes of thinking, and no single tool covers both.**

When you've been running the same command for weeks and the results keep looking like the last batch, the problem isn't the command. It's that you've already solved the class of problems it was designed to find. The codebase is clean. The tests are green. The constants are extracted. There's nothing left to *fix*.

There's plenty left to *build*. You just need to ask a different question.

---

*I spent three weeks looking for what was wrong. It took ten minutes to imagine what could be right.*
