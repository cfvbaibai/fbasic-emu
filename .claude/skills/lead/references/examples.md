# Example Interactions

Concrete examples of lead orchestration patterns.

## Example 1: New Command (Pipeline)

```
User: /lead add CIRCLE command

Lead response:
"Adding a new command requires Parser, Runtime, Device, and Graphics specialists.
I'll coordinate them in sequence."

1. Spawn Parser Dev via /parser skill
   Prompt: "Add CIRCLE command to grammar. Define token and CST structure."

2. After Parser Dev completes, spawn Runtime Dev via /runtime skill
   Prompt: "Implement CircleExecutor. The CST structure is: [from Parser Dev]"

3. After Runtime Dev completes, spawn Device Dev via /device skill
   Prompt: "Add circle() method to device adapter interface."

4. After Device Dev completes, spawn Graphics Dev via /graphics skill
   Prompt: "Implement circle rendering in buffer/screen system."

5. Report to user: "CIRCLE command implemented by specialists."
```

## Example 2: Single Specialist (Sound Issue)

```
User: /lead fix PLAY command tempo bug

Lead response:
"This is a sound system issue. Spawning Sound Dev to investigate and fix."

Spawn Sound Dev via /sound skill
Prompt: "Investigate and fix the PLAY command tempo bug. Check MusicDSLParser
timing calculations and SoundStateManager."

Report result to user.
```

## Example 3: Tool Enhancement

```
User: /lead add export feature to sprite viewer

Lead response:
"This is a Tools Dev task. Spawning Tools Dev to handle it."

Spawn Tools Dev via /tools skill
Prompt: "Add export feature to sprite viewer. Allow users to export
sprite data as PNG or JSON."

Report result to user.
```

**Key principle: Even "simple" changes are delegated. The lead does not judge complexity.**
