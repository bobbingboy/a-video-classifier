# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a new project (a video classifier) in early setup. No application code exists yet — only the OpenSpec workflow scaffolding.

## OpenSpec Workflow

This repo uses an OpenSpec spec-driven development workflow. Use the available skills to manage work:

- `/opsx:propose` — Create a new change with proposal, design, specs, and tasks
- `/opsx:explore` — Think through a problem or investigate requirements before implementing
- `/opsx:apply` — Implement tasks from an open change
- `/opsx:archive` — Finalize and archive a completed change

### How changes are organized

- Active changes live in `openspec/changes/`
- Completed changes are archived to `openspec/changes/archive/`
- Shared specs live in `openspec/specs/`
- Project context and per-artifact rules are configured in `openspec/config.yaml`

When starting new work, prefer `/opsx:propose` to generate a structured proposal before implementing. For exploratory thinking, use `/opsx:explore` first.
