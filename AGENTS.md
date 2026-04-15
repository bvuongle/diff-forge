# diff-forge — Agent Configuration

This file is read by Antigravity and other multi-agent tools to understand the project structure and agent roles.

## Project
Visual dependency graph composer for C++ embedded software modules. TypeScript + Electron + React + MUI. Hexagonal architecture.

## Context file (read this first, always)
`../thesis-agent/context/thesis-context.json`

## Agent roles in this repo

### Claude (Primary — decision maker)
- Architectural decisions, code style, pattern choices
- Writing specs and task briefs in `../thesis-agent/handoff/`
- Reviewing all Gemini output before it gets committed
- Anything blocked or ambiguous goes to Claude, not Gemini

### Gemini 2.5 Pro (Executor — runs when Claude is at limit)
- Reads `../thesis-agent/handoff/current-task.md` and executes it exactly
- Writes code and tests following Claude's decisions — no deviations
- Does NOT make architectural decisions, pick new libraries, or change patterns
- If the brief is ambiguous → writes questions to `../thesis-agent/handoff/questions.md`, stops, waits
- Prompt file: `../thesis-agent/prompts/GEMINI_DEV.md`

## Skills (available to all agents)
Located in `.agents/skills/` — loaded automatically by Antigravity:
- `vercel-react-best-practices` — 40+ React performance rules
- `vercel-composition-patterns` — compound components, state lifting
- `web-design-guidelines` — UI/UX rules
- `react-flow-architect` — graph canvas patterns
- `zustand-store-ts` — Zustand store patterns
- `typescript-expert` — strict TypeScript patterns
- `playwright-skill` — e2e testing
- `electron-development` — IPC, preload, security
- `tdd-workflow` — test-driven development cycle
- `unit-testing-test-generate` — unit test generation
- `testing-patterns` — test structure and patterns

## Code rules (both agents must follow)
- TypeScript strict mode, no `any`
- Max 200 lines per file
- Comments explain WHY not WHAT — never "of course", "importantly", "this handles"
- Domain layer has zero framework imports
- Zustand stores own all interaction logic — components just render
- No over-engineering. No factory-of-factory.

## Commands
```bash
pnpm dev          # Start dev server
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright e2e
pnpm typecheck    # tsc --noEmit
```
