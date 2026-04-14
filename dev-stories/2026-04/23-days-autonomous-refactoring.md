# 23 Days of Autonomous Refactoring: What Happened When I Let an AI Run the Codebase

**Date:** April 14, 2026
**Duration:** March 22 - April 13, 2026 (23 days)
**Result:** 448 commits across 23 days, ~200 PRs merged, test count grew from ~1,504 to ~3,560 (2.4x), 88.9% source file test coverage

---

## Day Zero: The Decision

On March 21st, I stared at the GitHub issue list for F-BASIC IDE and felt something I hadn't felt in weeks: curiosity. The automation pipeline I'd been building — `/discover-issues`, `/implement-issue`, `/review-prs`, the whole stack — had reached a point where it could run without me in the loop for more than a few minutes. The self-improvement protocol was patching its own edge cases. The PR review process had a 90% catch rate. The issue cap was holding at 20.

I thought: what if I just... let it run?

Not forever. Not unattended. But what if, instead of manually triggering each step and reviewing every output, I set the pipeline loose and only intervened when it actually needed me? What would 23 days of that look like?

I want to be clear about something: this is not a story about how AI is going to replace developers. This is a story about what happens when you build a machine and then turn it on. The good parts, the stupid parts, and the parts where I had to grab the steering wheel and yank.

## The First Week: Everything Is on Fire (In a Good Way)

March 22nd started with infrastructure fixes — hash-based routing for GitHub Pages, build warning gates, smoke tests. Boring, necessary stuff. But by March 23rd, the pipeline had found its rhythm and started hitting actual code.

The i18n localization effort landed on the 23rd. Over the next week, 100+ hardcoded strings got extracted into locale files across four languages: English, Japanese, Simplified Chinese, and Traditional Chinese. That wasn't something I'd planned. The automation discovered the hardcoded strings, created the issues, and the implementation agents just... did it. I reviewed the PRs, merged them, and watched the locale files grow.

But the real shock came from something else entirely. The parser was 1,734 lines in a single file — `FBasicChevrotainParser.ts`. The 500-line cap had been staring at it for weeks. On March 23rd, Claude split it into eight focused modules. I remember opening the PR, seeing the file breakdown, and thinking, "Okay, this is actually going to work."

Then came the bugs.

## The Bugs That Mattered

### STICK/STRIG: The Joystick That Couldn't Diagonal

Issue #377. When a player pressed two joystick directions simultaneously — up-right, say — the second press would overwrite the first instead of combining them. Every game with diagonal movement was broken. The fix was elegant: bitwise OR for setting bits, bitwise AND for clearing them. Three lines changed. Every joystick test passed.

But here's the thing: I didn't know this bug existed. Claude found it by reading the F-BASIC reference documentation and comparing it against the implementation. I would have found it eventually, when someone tried to play a game that needed diagonals. Eventually.

### FOR I=10 TO 1: The Loop That Shouldn't Run

Issue #223. In F-BASIC, `FOR I=10 TO 1` should execute zero times — the step is positive (default 1), so 10 is already past 1. The runtime computed a `shouldExecute` flag correctly, then never actually checked it. The loop body ran once anyway.

This is the kind of bug that makes you laugh bitterly. The right answer was right there, computed and ready, and nobody asked for it. Claude found it by tracing the FOR loop execution path end-to-end and noticing the disconnect. The fix was adding a single conditional check.

### 5 < "10": The Comparison That Lied

Issue #238. F-BASIC's `<` operator was comparing `"5" < "10"` as strings, which is `false` in lexicographic order (because `"5"` > `"1"`). The language is supposed to treat numeric strings as numbers in comparisons. The fix added an `isNumericString()` helper that checked both sides before falling back to string comparison.

### The Audio Tab That Went Silent

Issue #364. When you switched browser tabs while F-BASIC was playing music, the `setTimeout`-based audio scheduler would get throttled by the browser. Notes would drop, timing would drift, and eventually the music would just stop. The fix replaced the scheduling with Web Audio API timing, which isn't subject to tab throttling.

I remember reading that PR and thinking, "This is a real bug that affects real users, and it was found by a machine reading source code." That was the moment I stopped thinking of the pipeline as a refactoring tool and started thinking of it as a code reviewer that never gets tired.

## The 500-Line Cap: Whack-a-Mole

If there was one theme that defined the entire 23 days, it was the 500-line file size cap. It was the number one source of issues across the entire period. The automation would split a file, the tests would pass, the PR would merge, and then — sometimes days later — the file would creep back over the line.

`WebWorkerDeviceAdapter.ts` was the worst offender. It got split twice. Hit 497 lines on March 31st — technically under the 500-line cap, but the pipeline flags files at 490 to give a buffer before they breach the limit. Then someone — and I'm using the passive voice deliberately, because I genuinely don't remember if it was me or the pipeline — added some code and it landed at 512. Split again.

`TestDeviceAdapter.ts`: 512 lines on April 6th. `Screen.vue`: hovered at 480-492 for weeks, taunting everyone. `IdePage.vue` needed `useIdeCommandPalette.ts` extracted on April 11th. The go-to strategy was almost always CSS extraction — pull the styles into a separate file, watch the line count drop. It worked, but it felt like mowing the lawn. Satisfying in the moment, and you know you'll be back next week.

There's something almost comical about watching a machine tirelessly enforce a rule that a human would have given up on after the third split. But that's kind of the point. The machine doesn't get bored. It doesn't decide "close enough." It sees 501 lines and opens an issue. Every time.

## The Rename Cascade

On March 28th, someone renamed `rejectAllInputRequests` to `rejectAllPendingRequests`. Sounds simple. One rename, one PR, done.

It required seven follow-up PRs (#318, #322, #323, #325, #326, #327, #328) to fix all the places that still referenced the old name. Seven. The missed location was in `WebWorkerInterpreter.ts` line 253 — buried deep enough that neither the initial rename nor the first round of fixes caught it.

This is the classic large-codebase hazard. Rename something, and the places that break are the ones you didn't think to search. Claude's grep-based approach eventually caught them all, but it took a week of incremental fixes. Each PR was tiny — literally a find-and-replace — but each one required a full review cycle.

I let myself feel good about the pipeline catching these. For about ten seconds. Then I remembered that the pipeline had also caused them.

## When the Pipeline Got It Wrong

Not everything was roses. Let me talk about the failures, because they're more instructive than the successes.

Issue #301 was the most embarrassing. The automation diagnosed a problem as "file contents are swapped" — two files had each other's code. Claude created a PR to swap them back. I reviewed it, approved it, merged it. Then I pulled master and realized the files were already correct. The "swapped" contents were the intended state. The PR was reverted, the issue was closed, and I sat there wondering how many eyes had looked at this and missed the obvious.

Run 284 of discover-issues found a pile of "issues" that turned out to be local master being 14 commits behind origin. The pipeline was comparing the working tree against a stale baseline and flagging every difference as a problem. It wasn't wrong, exactly — the files were different — but the diagnosis was completely off.

And then there was the false positive problem. On April 3rd, the automation's own self-improvement protocol noted that "edge case and test coverage agents produced high false-positive rates — need better verification instructions." The pipeline was spending time creating issues for things that weren't actually issues, then spending more time closing them. By late March, discovery scans were finding 10-15 issues per run. By early April, they were finding zero issues for 5-8 consecutive runs. Not because the codebase was perfect, but because the easy problems were gone and the remaining ones required human judgment to identify.

The codebase was consistently described as "clean" — zero TODOs, zero `console.log` calls, zero `any` casts. That felt like a real achievement. But I also knew it meant the low-hanging fruit was exhausted.

## The Home Page in a Day

April 1st was the day I realized the pipeline could do more than maintenance.

I opened my laptop that morning and did a double-take: six merged PRs for the home page redesign (#336), a feature I'd mentally filed under "I'll get to this eventually." The pipeline had decomposed it into sub-issues overnight and shipped all of them — new hero section, updated navigation, localized content, responsive layout. I hadn't delegated it. I hadn't even prioritized it. It just... happened.

For a moment I felt something I hadn't expected: irrelevance.

That feeling passed, but it left a question. The My Programs Library was similar — March 29th-31st, IndexedDB persistence, full UI, import/export, all decomposed and stitched together without my involvement. April 11th was the most ambitious: shareable programs via URL (#548), 1,257 new lines across 13 files, a feature that let users encode an F-BASIC program into a link. Real feature, real value, shipped while I was doing other things.

I reviewed the PRs. I merged them. That was my contribution. Review and merge.

## The Palette Chain: A Masterclass in Incremental Refactoring

If you want to understand how the pipeline works at its best, look at the palette state refactoring chain. Ten PRs across April 7th-12th, each one building on the last.

It started innocuously enough. Step 1 made the `ORIGINAL_*_PALETTES` constants immutable — sensible, unremarkable. Step 2 fixed a bug where stale palette state leaked between program runs. Step 3 eliminated parallel data structures by establishing `RAW_*` as the single source of truth. Each PR was small, clean, obvious. I was clicking merge without much thought.

Then step 6 hit: `PALETTE_REFS` with `it.each()` replacing eight duplicated test blocks in one shot. That got my attention. This wasn't cleanup anymore — the pipeline was finding structural patterns across files and consolidating them. By step 8, which introduced a `PALETTE_STATE_KEY_MAP`, a `PaletteStateValues` type, and a `createPaletteRefTarget()` factory all at once, I realized this wasn't a refactor. It was a complete redesign happening in installments, each piece small enough that it never triggered my "this is too risky to merge" reflex.

Step 10 was the payoff: `ScreenPaletteState` extracted from `ScreenStateManager`, dropping it from 481 to 374 lines. The final result was a palette system that was type-safe, tested, and maintainable. No single PR was risky enough to worry about. But the cumulative effect was a complete overhaul.

This is the pattern that makes the pipeline valuable: not big-bang refactors, but relentless incremental improvement. Each step is small enough to review in your head. Each step is tested. Each step is reversible. And after ten steps, you're somewhere completely different from where you started.

## The Day the Issue Cap Broke

April 12th was the day the system showed its seams.

I'd set a 20-issue cap to prevent the pipeline from creating more work than it could handle. For most of March, this worked perfectly. Issues would creep up to 18-19, the pipeline would slow down discovery, implementation would catch up, and the count would drop back to 12-14. A natural equilibrium.

Then the music composer feature hit. It was a large feature — route, page, composables, components, tests, i18n. The pipeline decomposed it into sub-issues the way it always does. But this time, the decomposition created 34 sub-issues in a single day. The cap didn't just break; it was obliterated. The issue count hit 43.

I watched it happen in real-time and felt a strange mix of pride and alarm. Pride because the decomposition was actually good — each sub-issue was well-scoped and independently implementable. Alarm because the whole point of the cap was to prevent exactly this situation.

The cap wasn't wrong. The feature was just too big for it. I ended up manually adjusting the cap, triaging the sub-issues by priority, and letting the pipeline work through them in batches. It took three days to clear the backlog. The cap worked again after that, but I added a mental note: the cap assumes a certain feature size. Break that assumption and you need a human in the loop.

## The 90% Catch Rate

On April 10th, I did something I'd been putting off: an audit. I took 30 recently merged PRs and manually reviewed them against the original issues, looking for anything the pipeline's review process had missed.

Three findings out of thirty. A 90% catch rate. None were bugs, none were breaking — a minor i18n key inconsistency, a test that could have been more specific, and a slight redundancy. 27 out of 30 PRs were clean. That's the number I keep in my head when people ask whether I still review every PR. Yes. But the 90% that gets caught before I see it — the magic numbers, the missing null checks, the inconsistent naming — that's 90% less noise.

## What I Actually Did

People ask me what I did during those 23 days, and the honest answer is: I reviewed PRs and merged them. That's the job. But it's also more than that, because the reviewing and the merging were where the actual decisions lived.

I set the constraints. The 500-line cap, the 20-issue cap, the review standards, the merge criteria — those were my calls, and every single one of them shaped what the pipeline produced. When the rename cascade hit seven follow-up PRs, I updated the grep instructions so it wouldn't happen again. When false positives spiked, I tightened the discovery thresholds. When the issue cap broke under the music composer feature, I manually triaged 43 sub-issues into priority batches and let the pipeline work through them in order.

The pipeline found the STICK/STRIG bug, but I decided it was worth prioritizing over the fifteen other issues in the queue. The palette chain was entirely the pipeline's idea; the fact that I merged all ten PRs without reverting a single one was my judgment call. Each merge was a small act of trust, and each trust was earned by the quality of what came before it.

The rhythm that emerged was surprisingly natural. Claude investigates, I evaluate. Claude proposes, I decide. Claude implements, I verify. Then we do it again. It's not "AI does everything, human approves." It's closer to having a very fast junior developer who never gets tired and occasionally needs course correction. The question was never whether I was needed. It was whether I was needed at every step. The answer turned out to be: not even close.

## Day 23: Turning It Off

On April 13th, I didn't make a dramatic decision to stop. The pipeline just... ran out of easy things to do. Discovery scans were returning empty. The issue queue was under 20. The files were under 500 lines. The tests were passing. The codebase was clean.

I ran `/discover-issues` one last time. It came back with nothing.

I stared at the empty results for a while. Part of me wanted to keep going — there's always something, right? But the other part of me knew that pushing harder would just generate noise. The pipeline had reached the point where further automation would produce diminishing returns. The remaining improvements needed a human with taste and judgment, not a machine with grep and git.

So I turned it off. Not permanently — the tools are still there, ready to go. But the 23-day run was over.

## Reflection

I keep coming back to the STICK/STRIG bug. A real, user-facing bug that broke every game with diagonal movement. Found by a machine reading documentation and comparing it against code. Fixed with three lines. Verified by tests that will prevent regression forever.

That's the pipeline at its best. Not replacing human judgment, but extending it. Not writing code, but finding the code that needs writing. Not making decisions, but making sure the right decisions get made about the right things.

The 500-line whack-a-mole was tedious. The rename cascade was embarrassing. The false positives were wasteful. The issue cap breakdown was a reminder that systems have limits. But the bugs that got found, the features that got shipped, the test coverage that got built — that's real. That's value that didn't exist before, created by a collaboration between a human who set the direction and a machine that did the walking.

Would I do it again? Yes. But differently. I'd set a tighter issue cap for features. I'd add a human review gate for anything involving renames across multiple files. I'd run the discovery scans less frequently in the later stages, when the easy problems are gone. And I'd stop sooner — maybe after two weeks instead of three.

But those are optimizations. The core experiment worked. For 23 days, an automation pipeline ran on my codebase. It found real bugs, shipped real features, wrote real tests, and caught 90% of its own mistakes. I reviewed the output, merged the good stuff, reverted the bad stuff, and steered when it needed steering.

That's not a replacement for a developer. That's a force multiplier. And force multipliers are worth building.

---

## The Numbers

| Metric | Value |
|--------|-------|
| Total commits | 448 |
| Feature commits | 109 |
| Test commits | 113 |
| Refactor commits | 63 |
| Fix commits | 41 |
| Other commits* | ~122 |
| Test count (Mar 22) | ~1,504 |
| Test count (Apr 13) | ~3,560 |
| Test coverage | 88.9% of source files |
| PRs merged | ~200 |
| Issues created | ~250 |

*The remaining ~122 commits include merge commits, chore commits (dependency updates, config tweaks), documentation changes, and a handful of reverts — the unglamorous plumbing that keeps a repo healthy.

The test count is the number I keep coming back to. ~1,504 to ~3,560 in three weeks — a 2.4x increase. Parser tests, runtime tests, UI tests, edge case tests, and full program execution tests for every sample F-BASIC program in the language reference. That's the foundation everything else sits on.
