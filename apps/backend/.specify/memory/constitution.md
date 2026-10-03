# HackYeah Krakow Project Constitution

## Core Principles

### I. Clean, Maintainable Code
Code MUST be readable, consistently formatted, and easy for a new contributor to
understand and change. Names MUST describe intent. Functions and modules MUST have
a single clear responsibility. Comments MUST explain why, not what.
Rationale: the code is read far more often than written, and several people share
this repository.

### II. Modular Design
Code MUST be split into small, focused modules with explicit boundaries (for the
backend: routers, schemas, services, and configuration kept separate rather than
in a single file). Modules MUST depend on each other through narrow, documented
interfaces so they can be understood, tested, and replaced independently.
Rationale: modularity keeps changes local and lets the team work in parallel.

### III. Simplicity First
The simplest solution that satisfies the requirement MUST be chosen. Features,
abstractions, and dependencies MUST NOT be added for hypothetical future needs.
Any added complexity MUST be justified in the spec, plan, or PR description.
Rationale: complicated code is harder to maintain and slows the team down.

### IV. Research Before Implementing
Before implementing a feature, the relevant best practices (framework
documentation, community conventions, security guidance) MUST be researched and
the chosen approach recorded in the plan. Implementation MUST follow the
researched practices.
Rationale: deciding up front avoids rework and inconsistent patterns.

### V. Ask When Unsure
When requirements, scope, or the right approach are unclear, contributors and AI
agents MUST ask for clarification instead of guessing. Assumptions that must be
made MUST be stated explicitly.
Rationale: a short question is cheaper than building the wrong thing.

## Security & Secrets

- API keys, tokens, passwords, and other credentials MUST NOT be committed to the
  repository, including in history, tests, docs, or examples.
- Configuration secrets MUST be read from environment variables; only
  placeholder-valued `.env.example` files MAY be committed, and real `.env` files
  MUST be git-ignored.
- A leaked secret MUST be treated as compromised and rotated immediately.
- Backend stack: Python 3.11+, FastAPI, Uvicorn, managed with `uv`.

## Development Workflow

- Work MUST happen on branches named with a type prefix (e.g. `feature/...`,
  `fix/...`, `docs/...`, `chore/...`); direct commits to `main` MUST NOT be made.
- Commit messages MUST use type prefixes (`feat`, `fix`, `chore`, `docs`, etc.).
- Changes MUST land through pull requests with at least a one-sentence
  description, squash-merged, with review by another person when possible.
- Branches SHOULD be committed to at least every ~2 hours and synced often with
  `main` (`git config --global pull.rebase true`).

## Governance

This constitution supersedes other practices for this project. Amendments MUST be
made through a pull request that documents the change and its rationale and is
approved by at least one other contributor. Versioning follows semantic
versioning: MAJOR for removed or redefined principles, MINOR for added principles
or materially expanded guidance, PATCH for clarifications. All PRs and reviews
MUST verify compliance, and unjustified complexity MUST be rejected.

**Version**: 1.0.0 | **Ratified**: 2026-10-03 | **Last Amended**: 2026-10-03
