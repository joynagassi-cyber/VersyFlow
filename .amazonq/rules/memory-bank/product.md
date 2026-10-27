# VersyFlow — Product Overview

## Purpose & Value Proposition

VersyFlow is a mobile application for **biblical verse memorization** combining cognitive science (spaced repetition) with spiritual practice. It delivers an elegant, offline-first experience powered by a Rust-based FSRS engine compiled to WebAssembly.

**Core value**: Maximize long-term retention of Bible verses through scientifically-proven spaced repetition, with zero dependency on internet connectivity.

## Key Features

### MVP (V0.1) — Implemented
- **Multilingual onboarding** — UI language selection independent of Bible translation
- **Biblical navigation** — Books → Chapters → Verses hierarchy
- **Interactive memorization sessions** — Multiple recall patterns (fill-in-blank, full recall, comparison)
- **FSRS engine** — Free Spaced Repetition Scheduler via Rust/WASM for precise scheduling
- **FSRS-driven reviews** — Smart review queue based on memory state
- **Progress tracking** — Per-verse mastery levels and session analytics
- **"Rose & Fresh" design system** — Consistent visual language

### V1+ Roadmap
- Multi-translation support (LSG, KJV, NIV, NASB)
- Cloud synchronization
- Smart notifications
- Social/family features
- Audio mode
- Custom themes
- AI coaching

## Target Users

- **Primary**: French-speaking Christians seeking structured Bible memorization
- **Secondary**: Multilingual believers (English, Arabic RTL, German, Chinese)
- **Family use**: Parent-child memorization with family group features

## Use Cases

1. **Daily review** — FSRS schedules due verses; user rates recall quality (1–4)
2. **New verse learning** — Navigate Bible, add verse to memorization queue
3. **Session practice** — Comparison engine checks typed input against reference text
4. **Progress monitoring** — View mastery stats, streaks, retention curves
5. **Family groups** — Share progress, invite members, role-based permissions

## Differentiators

- FSRS (not SM-2) for superior scheduling accuracy
- Offline-first: all data local via SQLite/AsyncStorage
- UI language ≠ Bible translation (fully independent)
- Rust/WASM engine for performance-critical scheduling
- Clean Architecture ensuring long-term maintainability
