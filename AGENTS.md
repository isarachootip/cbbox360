# CusBox360 (CB360) — Agent SDLC Harness & Engineering Rules

> **Core Philosophy**: Quality, modularity, and maintainability over speed. Never behave as a "Slop Cannon". Fast models (like Gemini 3.8 Flash) MUST be harnessed by strict engineering discipline.

---

## 1. The Anti-Slop Directives (Stop The Slop)

1. **Never Blind-Code**:
   - For any non-trivial task (more than 1 file, architectural changes, new features, or refactors), **DO NOT jump straight into writing implementation code**.
   - If requirements or designs have ambiguities, use the Socratic approach (`/grill-me` mindset): ask 2–4 clarifying questions to eliminate risks before writing code.

2. **Mandatory Planning Before Execution (Micro-Planning)**:
   - Always produce an **Implementation Plan Artifact** before making code changes.
   - Break every plan down into **Micro-Tasks (2–5 minutes per step)**.
   - Detail the exact files to create, modify, or delete, and identify which components or utilities will be split out.
   - Pause for user feedback/approval on the plan when appropriate.

---

## 2. Modularity & Code Hygiene Standards

1. **Single Responsibility Principle (SRP)**:
   - **Never dump multiple unrelated responsibilities into a single file.**
   - Split UI into atomic components (`src/components/...`), pages (`src/pages/...`), hooks (`src/hooks/...`), and business logic / data helpers (`src/utils/...`, `src/services/...`).
   - If any file exceeds **200 lines of code**, proactively refactor and extract sub-components, helper functions, or custom hooks.

2. **Strict TypeScript Standards**:
   - **Strict Typing**: Do NOT use `any` unless absolutely unavoidable (and explain why in a comment).
   - Use explicit interfaces/types for all component Props, API payloads, and state models.
   - Export shared types in dedicated files (e.g. `src/types/...`).

3. **Preserve Existing Code Architecture**:
   - Maintain documentation integrity and keep existing comments/docstrings intact.
   - Use surgical, localized modifications (`replace_file_content`) instead of overwriting entire files whenever possible.

---

## 3. Test-Driven & Verification Gates

1. **Verify Before Declaring Done**:
   - Never say "I have finished" without compiling or testing the code.
   - Run compilation checks (`npm run build` or `npx tsc --noEmit`) to verify that there are zero TypeScript compiler errors or broken imports.
   - Check for console errors or runtime exceptions.

2. **Test-Driven Mentality (TDD)**:
   - For business-critical logic, state machines, math/pricing calculations, or core workflows:
     1. Define or update the test specification first.
     2. Implement the minimal clean code to make tests pass.
     3. Refactor for modularity and readability without breaking the test suite.

---

## 4. UI & Design System Compliance (CB360 Standards)

1. **Clean UI & Status Indicators**:
   - Strictly follow the `cb360` UI guide: **NO colored background pills/boxes** for status tags.
   - Use **Transparent background + Dot indicator (`●`) + Colored text** (e.g., `text-blue-600` with `bg-blue-500` dot).
   - Ensure clean typography, consistent spacing, and standard Tailwind color palettes.

---

## 5. Terminal & Git Guardrails (Safety)

1. **No Destructive Commands**:
   - **NEVER** run destructive commands without explicit user instruction:
     - `git reset --hard`
     - `git push --force`
     - `rm -rf` / `Remove-Item -Recurse -Force` on project directories
     - Dropping database tables or migrations without confirmation
   - Verify environment variables and sensitive configuration files (`.env`) are never overwritten or committed.

2. **Automatic Git Commit & Push on Completion**:
   - **ALWAYS** automatically commit (`git add .` and semantic commit message) and push (`git push origin main`) immediately upon completing and verifying any task (`npm run build`). Do NOT ask the user for permission to push to git.
