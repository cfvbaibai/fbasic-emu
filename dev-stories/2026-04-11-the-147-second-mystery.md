# The 147-Second Mystery

**Date:** April 11, 2026
**Duration:** Most of a Saturday
**Result:** Pipeline wall clock cut from 147s to 87s (-41%)

---

## The Waiting Game

I've developed a habit over the past few months. After every push to master, I open the GitHub Actions tab, watch the CI pipeline light up with green dots, and... wait. And wait. And wait.

The Test job was always the last to finish. 147 seconds. Every. Single. Time.

Two and a half minutes doesn't sound like much. But when you're iterating quickly — pushing a fix, checking CI, pushing another fix — those 147 seconds compound. Five pushes in an afternoon is over 12 minutes of just staring at a progress bar. I could make coffee in the time it took to run 3,344 tests.

The absurd part? I knew the tests themselves were fast. I'd run them locally and they'd finish in under a second. The full suite — 237 files, 3,344 test cases — completed in roughly 164 milliseconds of actual test code.

**164 milliseconds of work, wrapped in 147 seconds of infrastructure.**

That's 99.9% overhead. Something was very, very wrong.

---

## Following the Breadcrumbs

The first step was to understand where the time was actually going. GitHub Actions tells you how long each step takes, but not what's happening inside. I needed to look deeper.

I dove into the Vitest config and started pulling threads.

### Thread 1: The Wrong Pool

The config was using `pool: 'forks'` — each test file gets its own Node.js process. Forking is expensive. Each fork duplicates the entire module graph, including the Chevrotain parser's `performSelfAnalysis()` — a heavyweight operation that analyzes the grammar and builds parse tables.

Switching to `pool: 'threads'` was a one-line change. Threads share memory. No more duplicating the module graph. Expected improvement: ~12%.

But the real surprise was the CLI syntax. We'd recently upgraded to Vitest 4, and the pool configuration flags had changed. The old `--poolOptions.forks.maxForks=8` was silently rejected. It took a few minutes of confusion before I found the new syntax: `--maxWorkers=8`.

**Lesson: When an upgrade breaks your config, it doesn't always tell you.**

### Thread 2: The jsdom Tax

This was the big one.

Our Vitest config had `environment: 'jsdom'` set globally. Every single test file — all 237 of them — got a full jsdom environment. jsdom simulates an entire browser: document, window, navigator, event system, the works.

The setup cost? **157 seconds of CPU time** across all workers.

Here's the thing: 199 of those 237 files (84%) never touch a single DOM API. They're pure TypeScript — parser tests, executor tests, evaluator tests. They run in Node.js. They don't need a fake browser.

The fix was elegant: default to `environment: 'node'`, and add `// @vitest-environment jsdom` as a comment at the top of the 38 files that actually need DOM. A one-line comment. That's it.

Finding those 38 files was the fun part. I ran the entire suite with `--environment=node` and captured every failure. Each failure was a file that needed jsdom. Automate the discovery, then add the comments.

**Result: Environment phase dropped from 157s to 31s. An 80% reduction.**

The import phase went up slightly (89s to 105s) — a trade-off of the threads pool — but the net was a massive win.

### Thread 3: The Ghost Files

While investigating, I discovered that `pnpm vitest run` was finding **711 test files** instead of 237. Where were the extra 474?

They were hiding in `.automation/worktrees/` — stale worktree copies from previous CI runs. Vitest's default glob was picking them up.

Adding an explicit `include: ['test/**/*.test.ts']` to the config fixed this instantly. Not a performance improvement per se, but it meant the test count was accurate and local runs weren't polluted.

---

## First Victory: 147s → 93s

After these three changes, I pushed and watched the CI run.

93 seconds.

A 36% reduction. The Test job was no longer the pipeline bottleneck. Build (39s), E2E (78s), and Built-Preview (66s) were now the slowest jobs.

I leaned back and felt the satisfaction. But then I looked at those E2E numbers and a thought crept in...

*Two separate E2E jobs? That's a lot of duplicated work.*

---

## The E2E Chronicles

The project had two E2E Playwright configs:

1. **`playwright.config.ts`** — Tests the production build served by `serve -s dist`
2. **`playwright.config.preview.ts`** — Tests the production build served by `vite preview` (important because it mirrors GitHub Pages' base path handling)

Two configs, two CI jobs, and between them: **144 seconds of CI minutes per run.**

But only 22 seconds (15%) was actual test execution. The rest was duplicated infrastructure — checkout, pnpm setup, Node.js setup, dependency installation, Playwright browser download, and a full production build.

Both jobs did the exact same setup. Both built the app. Both installed Chromium. The only difference was the server command.

### The Merge

Playwright supports `webServer` as an array and per-project `testMatch`. This meant I could merge both configs into one:

```typescript
projects: [
  {
    name: 'serve',
    testMatch: '**/ide-*.pw.ts',
    use: { baseURL: `http://localhost:4317` },
  },
  {
    name: 'vite-preview',
    testMatch: '**/built-preview-smoke.pw.ts',
    use: { baseURL: `http://localhost:4318` },
  },
],
webServer: [
  { command: 'pnpm preview:spa', url: 'http://localhost:4317' },
  { command: 'pnpm preview:vite', url: 'http://localhost:4318' },
],
```

One config. Two servers. Tests automatically routed to the right one based on file name pattern.

The tricky part was the first local run. With 6 parallel workers (my machine's default), the `ide-run-stop.pw.ts` test timed out. The stop button never became enabled — too many parallel tests hitting the same server, causing resource contention.

With 2 workers (our CI setting), everything passed. The lesson: **parallelism is great until it isn't.** Know your bottlenecks.

### The Cache

I also added a GitHub Actions cache for Playwright browsers:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
```

Chromium is ~280MB. Downloading it on every CI run took 23 seconds. With caching, the browser download is skipped and only system dependencies are installed (~8s).

**Result: E2E CI minutes dropped from 144s to ~70s. One job instead of two.**

---

## The CI Pipeline Surgery

With E2E optimized, I turned my attention to the remaining jobs. The pipeline had 6 jobs running in parallel, and I noticed something infuriating:

**Three of them were building the app independently.**

- **Build job**: Runs `vue-tsc && vite build` (23s)
- **Build Warning Gate**: Runs its own `vite build` internally to check for circular chunks (15s)
- **Verify (master)**: Runs `verify:build-no-unresolved-assets`, which... runs its own `vite build` internally (15s)

Three separate CI runners, three separate builds, three sets of setup overhead. On cold runners with no shared Vite cache, that's 47 seconds of redundant building plus 42 seconds of duplicated setup.

### First Incision: Merge Build + Build Warning Gate

The simplest merge. Both jobs check out the same code, run on the same branch. The Build job runs `pnpm build`, then the warning check runs `pnpm verify:build-warnings` (which spawns its own `vite build` internally).

I hoped Vite's internal cache would make the second build faster. On my local machine, it didn't — both builds took ~17s regardless. But on CI (cold file cache), the second build was slightly faster since source files were already in the OS page cache.

Savings: 9s. Modest, but it eliminated one job and set up the pattern for bigger merges.

### Second Incision: Absorb the Verify Jobs

The `verify-master` job had a clever feature: on pull requests, it checked out the **master base SHA** instead of the PR head. This catches cases where someone's PR is based on a broken master branch.

But here's the thing: on master pushes, verify-master checks the same SHA as the Build job. And on PRs, the Build job checks the PR head. The only unique behavior was the master-base check on PRs — a safety net, but not critical since master pushes have their own CI.

The `verify-pr` job was even more redundant. It checked the PR head — the exact same code the Build job checks.

I merged both into the Build job. All validation checks (syntax, entrypoints, unresolved assets, build warnings) now run in sequence after the initial build. The Build job went from 55s to 70s, but we eliminated two entire jobs.

**Savings: 20s CI minutes per push, 50s per PR. Two fewer jobs to maintain.**

### The Parallel Lint Trick

The Lint job ran three checks sequentially: ESLint (16s), Stylelint (5s), and vue-tsc type-check (9s). Total: 30 seconds of sequential work.

But these three tools don't depend on each other. They can run simultaneously:

```yaml
- name: Run lint and type checks in parallel
  run: |
    pnpm exec eslint . &
    pnpm lint:style &
    pnpm type-check &
    wait
```

Background processes + `wait`. Simple shell scripting. The job time dropped from 47s to 41s. Not a huge savings — CI runners have limited cores — but every second counts when you're watching a progress bar.

---

## The Final Boss: Test Sharding

After all the optimizations, the pipeline looked like this:

| Job | Time |
|-----|------|
| Test | 107s |
| Build | 70s |
| E2E | 75s |
| Lint | 41s |

The Test job was back to being the bottleneck. 107 seconds of watching `vitest run` churn through 237 test files on a single CI runner.

Vitest has a built-in sharding feature: `--shard=N/M` splits test files across M runners. Each runner runs a fraction of the tests.

```yaml
test:
  name: Test (${{ matrix.shard }})
  strategy:
    matrix:
      shard: [1/2, 2/2]
```

Two parallel runners, each handling ~half the test files. The total work is the same, but it's split across two machines.

The local test was revealing:

```
Shard 1/2: 119 files, 1671 tests — 50s
Shard 2/2: 118 files, 1673 tests — 72s
```

Shard 2 was slower because it happened to get the heavier headless program tests. On CI, both runners have identical hardware, so the wall clock would be `max(50, 72) ≈ 72s` instead of `107s`.

**Pipeline wall clock: 107s → 87s. The bottleneck shifted from Test to E2E.**

---

## The Aftermath

Let me put it all together:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Pipeline wall clock | 147s | 87s | **-41%** |
| CI jobs | 7 | 5 | **-29%** |
| CI minutes/run | ~450s | ~284s | **-37%** |
| Test env setup | 157s CPU | 31s CPU | **-80%** |
| E2E jobs | 2 | 1 | **-50%** |

The pipeline went from a 2.5-minute wait to under 1.5 minutes. Five pushes in an afternoon used to cost 12+ minutes of waiting. Now it's about 7 minutes.

### What I Learned

1. **Measure before optimizing.** The 99.9% overhead stat was the key insight. Without it, I might have tried to optimize test code instead of infrastructure.

2. **Default to the cheapest option.** Switching from jsdom to node as the default environment was the single biggest win, and it required no code changes — just a config flip and 38 one-line comments.

3. **Look for duplicated work.** Three jobs building the same app, two jobs setting up Playwright — duplication hides in plain sight when jobs are organized by "what they check" rather than "what they need."

4. **Small steps, verify each one.** Every optimization was pushed separately and measured. A few times the results were worse than expected (the Vite cache didn't help cross-process, parallel linting saved less than hoped). Measuring prevented compounding surprises.

5. **Know when to stop.** After test sharding, the remaining opportunities were marginal (a few seconds here and there). The pipeline wall clock is now dominated by E2E and Build — both fast and well-optimized. Chasing the last few seconds isn't worth the complexity.

### What's Left

The Test job's import phase (105s CPU) is still dominated by Chevrotain parser initialization. A lazy-init pattern could help, but it would require a code architecture change in the parser. I've deferred it for now — the current pipeline is fast enough.

The next time CI feels slow, I'll know where to look.

---

*147 seconds. That's how long it takes to make a cup of coffee, find a clean mug, and take the first sip. Now my CI finishes before the coffee is ready.*
