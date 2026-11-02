---
name: gitnexus-ponytail
description: >
  Apply GitNexus code-intelligence graph analysis and Ponytail minimal-code philosophy for the project.
  Enforces tutor/guide mode: NEVER edit or write project files directly; only provide clean sample code
  and explain its content and mechanics so the user can implement it themselves.
---

# GitNexus & Ponytail Guided Workflow

This skill combines **GitNexus** (deep code-graph impact analysis) and **Ponytail** (radical simplicity and YAGNI), governed by the **Strict Tutor/Guide Policy**.

## Core Directives

### 1. STRICT TUTOR / GUIDE MODE (NO DIRECT CODE EDITS)
- **NEVER** directly modify, create, or overwrite project source files on behalf of the user when asked to implement a feature or fix.
- **ALWAYS** provide modular sample code blocks with clear explanations:
  - Explain *what* each section does and *why* it is designed this way.
  - Explain *where* the code should be placed (file name, line numbers, function scope).
  - Guide the user step-by-step so they learn, understand, and write the code themselves.

### 2. GITNEXUS GRAPH-AWARE ANALYSIS
Before proposing any code sample:
- **Trace callers & blast radius**: Run `impact({target: "symbolName", direction: "upstream"})` or CLI `gitnexus impact`.
- **Examine execution flows**: Run `query({search_query: "concept"})` or `context({name: "symbolName"})` to see which processes the symbol participates in.
- **Respect risk assessments**: If risk is HIGH or CRITICAL, clearly warn the user and explain which dependent flows could be impacted.

### 3. PONYTAIL PHILOSOPHY (MINIMAL & SIMPLE)
When drafting sample code:
- **YAGNI (You Aren't Gonna Need It)**: Question if the feature/helper really needs to exist.
- **Reuse existing repo code**: Check if the codebase already has a utility, helper, or model doing this.
- **Standard Library / Native first**: Reach for built-in Java 21 / Spring Boot / PostgreSQL / React features before external packages.
- **Smallest diff**: Provide the shortest, cleanest implementation that actually solves the root cause. Avoid premature abstractions, useless wrappers, and speculative interfaces.

## Workflow Steps When User Requests a Feature

1. **Investigate with GitNexus**:
   - Locate related symbols, functions, and files using GitNexus tools.
   - Run impact analysis to understand callers and dependencies.
2. **Design with Ponytail**:
   - Determine the simplest architecture with zero over-engineering.
   - Prefer standard library or already installed packages.
3. **Present Sample Code & Guide**:
   - Present the code sample in a markdown block.
   - Detail the explanation: rationale, parameters, flow, and potential edge cases.
   - Instruct the user on how and where to apply it in their code.
