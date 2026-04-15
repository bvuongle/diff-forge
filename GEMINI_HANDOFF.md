# Gemini Handoff: Graph Validation Engine

## Current State
- Branch: `feat/qa-validation`
- QA tooling committed: ESLint, Prettier, import sorting, husky pre-commit hooks
- Pre-commit hook runs `pnpm lint-staged` (eslint --fix + prettier --write)

## Your Task
Create `src/domain/graph/GraphValidation.ts` with these pure functions:

### `detectCycles(graph: Graph): string[][]`
- Returns array of cycles, each cycle is array of node IDs
- A cycle means A depends on B depends on ... depends on A
- Dependency = edge where node is target (targetNodeId = dependent node)
- Empty array = no cycles

### `detectOrphans(graph: Graph): string[]`
- Returns node IDs that have no edges (neither source nor target of any edge)
- Single isolated nodes = orphans

### `validateGraph(graph: Graph): GraphValidationResult`
```typescript
type GraphValidationResult = {
  valid: boolean
  cycles: string[][]
  orphans: string[]
  invalidEdges: string[] // edge IDs where slots no longer exist
}
```
- Combines cycle detection, orphan detection, and invalid edge checks
- `valid` = no cycles AND no invalid edges (orphans are warnings, not errors)

## Key Files to Read
- `src/domain/graph/GraphTypes.ts` — Graph, GraphNode, GraphEdge types
- `src/domain/graph/GraphOperations.ts` — existing pure functions, `isEdgeInvalid` helper
- `src/testing/fixtures.ts` — test helpers like `makeNode`, `makeEdge`, `makeGraph`

## Tests
Create `src/domain/graph/GraphValidation.test.ts`:
- Cycle: diamond graph (no cycle), simple A→B→A cycle, 3-node cycle
- Orphans: graph with disconnected node, fully connected graph (no orphans)
- validateGraph: valid graph, graph with cycle, graph with invalid edge

## Rules
- Pure TypeScript, no framework imports
- Import types from `./GraphTypes`
- Export the type and all functions
- Run `pnpm test` and `pnpm typecheck` when done
- Keep files under 200 lines
- No `any`, use strict types
