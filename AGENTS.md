# Agents Instructions

## Key Principles

1. Well-defined boundaries
2. Composability
3. Independence
4. Individual scale
5. Explicit communication
6. Replaceability
7. Deployment independence
8. State isolation ⚠️
9. Observability
10. Fail independence

---

## General Rules

### Context7 MCP

Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use
the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

---

## Spec Driven Flow

### Planning vs. execution — hard boundary

**Planning agents MUST stop after the Tasks phase.** Do not implement, edit application code, run builds, or create commits in the same session that produced the plan.
