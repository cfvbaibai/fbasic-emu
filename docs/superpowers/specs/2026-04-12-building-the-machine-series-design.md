# "Building the Machine" — Dev Story Series Design

**Series:** Building the Machine
**Episodes:** 5
**Format:** Dev stories in `dev-stories/YYYY-MM/` following existing conventions
**Audience:** Other developers interested in AI-assisted development, agent orchestration, and automation
**Publication:** GitHub Wiki pages (one page per episode)
**Core Thesis:** Find scenarios from your real experience — management patterns that work with humans also work with AI agents.

## Series Overview

A Development Director with 10+ years of team management experience builds an autonomous software factory inside a `.claude` folder. Each episode covers a major evolutionary leap, driven by patterns borrowed from real-world team management applied to AI tooling.

### Through-line

Every episode demonstrates a principle: **real-world management experience translates directly to AI agent orchestration.** The WeChat tech group serves as the recurring catalyst — each major shift is triggered by something shared in that group.

### Cold Open

Episode 1 opens with a flash-forward to the 822-run moment from Episode 5 — the most visually striking image of the entire series (an autonomous machine cranking out issues and PRs while the human watches). After 2-3 paragraphs, the narrative rewinds: "How did I get here?" This gives readers a reason to invest in the journey before the chronological story begins.

## Chat History Reference

**Source:** `C:\Users\Tony\code\private\wechat-history\` — exported WeChat chat history.

The writer **MUST proactively search the chat history** for real dialog when writing any episode. The WeChat group ("陆家嘴金融巨子吃饭群") is the primary source; other relevant groups include "科技讨论小茶馆" and "摩根校友会 （一群）- ms alumnus".

### How to use

1. **Before drafting each episode**, search the chat history for the episode's time range using relevant keywords (Chinese and English)
2. **Use real dialog verbatim** (or near-verbatim with minor cleanup for readability) — never fabricate conversations
3. **Key groups to search:**
   - `groups/陆家嘴金融巨子吃饭群/messages.md` — primary tech discussion group, has all major tool discussions
   - `groups/科技讨论小茶馆/messages.md` — secondary tech discussions
   - `groups/摩根校友会 （一群）- ms alumnus/messages.md` — Morgan Stanley alumni, work-related AI adoption
   - `groups/🙄啧🙄啧🙄啧/messages.md` — additional Cursor/Claude/OpenClaw mentions
4. **Search command:** `grep -C 5 -i "keyword" "path/to/groups/Group Name/messages.md"`

### Dialog scenes found (Jan 2025 – Apr 2026)

The following real dialog moments have been identified. Timestamps reference `陆家嘴金融巨子吃饭群` unless noted.

#### Episode 1 material
- **Jan 6:** wzy: "我们公司除了中国的都在用Claude code" — the initial Claude Code introduction
- **Jan 6:** Eugene: "不光是模型API，Claude Code和自己的MCP集成得好。那个命令行工具很强大。不推荐vs code插件和Claude desktop，这两个感觉设计的不好，体验不佳。"
- **Jan 10:** me: "原来已经这么聪明了啊。我用Cursor加Opus能达到同样效果么？" — first Cursor mention
- **Jan 21:** The four-tool shootout — me: "昨天我同时用Gemini CLI（Gemini 3 high）、Claude Code（Sonnet）、Antigravity（Gemini 3 high）、Cursor（Auto）修同一个实际的UI低代码拖拽布局bug，感觉速度从快到慢是Cursor、Claude Code、Gemini CLI、Antigravity；质量从高到低是Claude Code、Cursor、Gemini CLI、Antigravity。"
- **Jan 21:** Eugene: "Claude Code真的能troubleshooting处理很多环境依赖的问题，能力之强令人瞠目结舌"

#### Episode 2 material
- **Jan 21 (THE key moment):** me: "Claude Code确实强，现在Code Review都靠它了[捂脸]" + "就是token用的太快，Review一个小型MR，加2轮回复，已经用掉31%的本日用量了" + **"现在都不舍得用Claude写代码……就让Cursor写、Claude来审"** — the birth of the dual-tool pattern
- **Jan 23:** Eugene: "code review用Claude有点奢侈了。Claude能力很强，用于一些复杂任务吧。处理复杂任务交给Claude。"
- **Jan 23:** Eugene: "网上有个CC接GLM，小任务可以交给GLM。复杂的交给CC Opus。" — early GLM mention
- **Jan 23:** wzy: "我买了个300🔪的Claude code额度" — the subscription struggle

#### Episode 3 material
- **Feb 12:** me: "我本来的practice是开了一堆team member skills。然后建一个leader skill。让leader skill去spawn其它skill的subagent。" — the org chart reveal
- **Feb 12:** wzy: "托老师提前布局agent team"
- **Feb 12:** me: "不过目前纯靠skill效果时灵时不灵" — honest about early failures

#### Episode 4 material
- **Feb 5:** me: "我发现OpenClaw可以接QQ" — first OpenClaw mention
- **Feb 5:** Eugene: "windows跑openclaw不稳定，特别是socks代理不行"
- **Mar 3:** me: "我试过在windows上配了个schedule task调用claude code检查代码库并自动发送要做的任务到任务管理系统" — early automation attempt
- **Mar 5** (摩根校友会): wzy: "我们内部使用非常明显，opus 4.6上了之后，一下子大量的工作流自动化了，明显上了一个台阶" — AI adoption at enterprise scale
- **Mar 8:** me: "让Codex Automation自动扫描我的开源项目，然后提Issue。然后再做另一个Automation，自动完成issue。" — the pipeline reveal
- **Mar 9:** wzy: "给openclaw提了一个PR，这项目质量太差了" + me: "openclaw那纯vibe出来的代码库能看得懂么[捂脸]" + wzy: "用魔法打败魔法" — vibe coding's limits
- **Mar 9:** wzy: "openclaw未来会成为vibe coding的返例"

#### Episode 5 material
- **Mar 9:** me: "我GLM5+Codex5.4算是夹中间了[奸笑]"
- **Apr 9:** me: "我现在主力coding用turbo了" + long GLM-5 Turbo technical explanation (AI-generated, shared to educate the group)

## Episode Outlines

### Episode 1: "From Tab Completion to Senior Mentor"
**Era:** Oct 2025 – Jan 2026
**Key events:**
- Project starts with VSCode Copilot tab completion (4 commits/month Oct 2025)
- Nov-Dec 2025: 11 commits/month building the interpreter core
- Jan 6: WeChat group — wzy says his company uses Claude Code; Eugene evangelizes the CLI tool
- #dialog-scene: Jan 21 four-tool shootout — Gemini CLI vs Claude Code vs Antigravity vs Cursor on the same bug
- Suddenly reviewing code instead of writing it: "senior mentor" to Cursor's "junior dev"
- 76 commits/month explosion (Jan 2026)
- Pro subscription, then 3x Pro as quota runs dry
- Brief Gemini CLI experiment (doesn't stick)

**Emotional core:** The promotion. Going from writing every line to guiding direction.

**Technical details:** Commit velocity chart (4 → 11 → 76). Early project structure.

**Real-world parallel:** A junior developer promoted to tech lead — same skills, different role.

### Episode 2: "The Dual-Tool Dance"
**Era:** Jan 18 – Feb 2026
**Key events:**
- Jan 18: First CLAUDE.md appears — `.claude/skills/` with fbasic-reference, vue-best-practices
- #dialog-scene: Jan 21 — "Claude Code确实强，现在Code Review都靠它了[捂脸]" + "现在都不舍得用Claude写代码……就让Cursor写、Claude来审" — **the birth of the dual-tool pattern**
- #dialog-scene: Jan 23 — Eugene: "code review用Claude有点奢侈了。处理复杂任务交给Claude。"
- Try Claude Code — sticker shock (expensive plan, 5-hour quota)
- Can't use it for real coding — becomes the **reviewer**
- Dual-tool workflow: Cursor writes, Claude reviews
- Feb 3: AGENTS.md + OpenCode skills experiment (commit, pre-commit, team skills)
- Feb 12: AGENTS.md deleted — fully replaced by `.claude/` system
- GLM Coding Plan arrives (~$60/quarter MAX, no quota limits, Claude Code compatible)
- Full migration begins

**Emotional core:** Constraint breeds creativity. The quota limitation forced a dual-tool pattern that actually worked well. The affordable plan didn't just save money — it unlocked an entirely new way of working.

**Technical details:** `.cursor/commands/commit-code.md` (18 lines) → `.claude/commands/commit-code.md` (94 lines). The AGENTS.md experiment. MCP servers shared between Cursor and Claude (context7, github).

**Real-world parallel:** Using the right tool for the right job. A senior architect who delegates implementation but insists on reviewing every PR.

### Episode 3: "The Org Chart"
**Era:** Feb 1–13, 2026
**Key events:**
- Project grows large enough that Claude loses focus on complex tasks
- 10 years of team management instinct: "a real dev can't understand all details of a big project"
- Build 8 domain specialists: parser, runtime, sound, device, graphics, IDE, tools, fbasic-programmer
- Lead orchestrator — forbidden from writing code, only delegates
- References folder with architecture diagrams
- Feb 13: Skill files renamed to SKILL.md, descriptions enhanced
- First time the specialist team works — a specialist nails something generalist Claude would have missed
- #dialog-scene: Feb 12 — me: "我本来的practice是开了一堆team member skills" + wzy: "托老师提前布局agent team" + me: "不过目前纯靠skill效果时灵时不灵" — sharing the idea with the group, including honest admission of early failures

**Emotional core:** Trusting delegation. The discipline of saying "I won't implement this myself" even when you could.

**Technical details:** Specialist skill structure (name, domain, directories, trigger scenarios). Lead decision framework. Team monitor system.

**Real-world parallel:** Organizing a dev team by domain expertise. The tech lead who delegates instead of micromanaging.

### Episode 4: "The Proactive Awakening"
**Era:** Feb 17 – Mar 27, 2026
**Key events:**
- #dialog-scene: Feb 5 — me: "我发现OpenClaw可以接QQ" + Eugene: "windows跑openclaw不稳定" — first OpenClaw encounter
- Feb 17: OpenClaw goes viral in WeChat group — "AI can run proactively!"
- Feb 2: Codex Desktop App launches with multi-agent automation feature
- Buy 1 month Codex subscription, build the issue pipeline there: discover → triage → implement → review
- Pain point: two different skill/command/subagent systems — Claude skills transfer to Codex but not fully
- #dialog-scene: Mar 8 — me: "让Codex Automation自动扫描我的开源项目，然后提Issue。然后再做另一个Automation，自动完成issue。" — the pipeline reveal
- #dialog-scene: Mar 9 — wzy: "给openclaw提了一个PR，这项目质量太差了" + me: "openclaw那纯vibe出来的代码库能看得懂么" + wzy: "用魔法打败魔法" — vibe coding's limits
- Mar 7: Claude Code `/loop` released (v2.1.71) — recurring scheduled tasks
- Same day: `chore: add Codex skills folder to .gitignore` — migration begins
- Mar 22: First `.claude/commands/` appear in git
- Mar 24: Self-improvement protocol added — "Why can't the AI grow?"
- Session 1 (Mar 22): Runs 001–010, each teaching the pipeline something new
- Session 2 (Mar 24): Runs 60–70, diminishing returns detected, deep analysis added
- Session 3 (Mar 26): Runs 83–126, false positive problem, quality over correctness
- Session 4 (Mar 27): UX quality review finds real issues pattern-matching missed

**Emotional core:** Three tools, three philosophies. OpenClaw showed the possibility, Codex proved the practice, Claude Code became the home. The self-improvement log is the diary of a system learning to fix itself.

**Technical details:** Self-improvement protocol (review → improve → commit → record). The improvements.md log entries as narrative beats. Run numbers as chapter markers. Concurrent instance coordination. Post-merge integrity checks.

**Real-world parallel:** Junior devs grow with guidance. The self-improvement protocol is performance reviews for AI.

### Episode 5: "822 Runs"
**Era:** April 2026
**Key events:**
- Machine runs autonomously: 822 discover-issues runs, 106 issues created
- 32 PRs merged in April: 63% refactor, 28% test, 9% fix, 0% feature
- The maintenance trap closes — well-maintained but standing still
- Roadmap: "No active work" since March 1
- The breakthrough: "Brainstorm on the current codebase and check what we can do next"
- Five new feature issues created in minutes (#534–#538)
- The lesson: "You can't discover new features by looking for old problems"

**Emotional core:** The seductive trap of automated productivity. A perfectly running machine that produces nothing new. The breakthrough that required asking a completely different question.

**Cross-reference:** Incorporate/enhance existing `dev-stories/2026-04/the-maintenance-trap.md`.

**Real-world parallel:** A well-oiled maintenance team that never ships anything new. The difference between continuous improvement and innovation.

### Episode 5 Sidebar: "Don't Step on Each Other's Toes"
*April 12, 2026 (same day as the maintenance trap breakthrough)*

A minor but telling evolution: concurrent instance coordination. When running multiple `/implement-issue` loops simultaneously, two instances could grab the same issue. The fix: each instance extracts its conversation GUID (`SESSION_ID`), writes it to `config.md` alongside the claimed worktree, and checks other sessions' claims before picking. Cleanup only removes your own entries — never another session's.

**Why it matters:** This is the "team coordination" pattern reaching its final form. In Episode 3, you built specialists that don't step on each other's domains. In Episode 4, the pipeline learned to fix its own mistakes. Now multiple pipeline instances coordinate like colleagues who check the shared task board before starting work.

**Fit:** This can be woven into Episode 4 (as the latest evolution of the self-improving pipeline) or Episode 5 (as a sign of the machine maturing past the maintenance trap). Recommendation: brief mention in Episode 4's coda, showing the pipeline's final form.

## Existing Stories

- `dev-stories/2026-04/the-147-second-mystery.md` — Stands alone (CI optimization story). Can be referenced but not part of this series.
- `dev-stories/2026-04/the-maintenance-trap.md` — Foundation for Episode 5. Should be rewritten/incorporated into the series for consistency.

## Series-Level Design Decisions

1. **Each episode is standalone-readable** but richer as part of the series
2. **WeChat group as Greek chorus** — appears in every episode as the catalyst for new ideas
3. **Real-world management parallels** woven into narrative, not lectured
4. **Technical details serve the story** — file paths, commit messages, run numbers included when they're part of the narrative, not as documentation
5. **Emotional honesty** — include frustrations, wrong turns, dead ends alongside the wins
6. **No "What I Learned" sections** — lessons woven into narrative per dev-story-writer guidelines
7. **Commit velocity chart** — the 4→11→76→103→222→172 progression appears in Episode 1 and is referenced throughout
8. **Cold open** — Episode 1 opens with the 822-run moment (Episode 5's climax), then rewinds. Gives readers the most striking image first
9. **Dialog scenes from real chat** — key WeChat moments are dramatized as scenes with verbatim (or near-verbatim) dialog. Writer must search the chat history (`C:\Users\Tony\code\private\wechat-history\`) before drafting each episode. See "Chat History Reference" section above for source paths, search commands, and pre-identified dialog moments
10. **Management parallel thesis retained** — this differentiates the series from generic "I used AI to code" stories. Do not swap for a "factory documentary" angle

## Episode Length

Episodes can vary in length to match the density of their subject matter. Episode 4 (the proactive awakening) covers the most ground and may naturally be the longest. No artificial length constraints.

## Writing Order

Episodes should be written in chronological order (1→5) since each builds on the previous. Episode 5 can leverage the existing `the-maintenance-trap.md` draft.

## Publication

Final stories are published as GitHub Wiki pages. Drafts live in `dev-stories/YYYY-MM/` during writing.
