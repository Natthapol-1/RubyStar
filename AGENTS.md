# Project agent instructions

For Ruby Star work, start with [docs/ruby-star/README.md](docs/ruby-star/README.md). It is the short game overview and links to separate Markdown references for each topic. Read the details relevant to the task; for art changes, also inspect the visual-style reference and relevant images.

Skip lore documents when getting familiar with the game and during general development work.

When an implementation change meaningfully affects mechanics, balance, controls, enemies, progression, skills, architecture, audio or visual direction, update the relevant topic documents in the same task. Refresh affected visual-reference images when needed. Replace obsolete facts; do not append chat transcripts, version history, task diaries or abandoned designs. Keep the overview concise and avoid duplicating details between documents.

Inspect current source and local changes before editing. Preserve unrelated work. This repository contains only Ruby Star.

Keep all in-game rule sheets concise and easy to understand. Prefer one or two short sentences per card describing what each thing does. Avoid tactical instructions such as telling players to leave before a blast. Avoid adding extra cards or secondary mechanics just because they exist in code. Remove unnecessary details, technical explanations and exhaustive edge cases. Put detailed explanations in reference documentation instead. The full rule sheet layout and writing rules are in [Rule sheets](docs/ruby-star/DEVELOPMENT.md#rule-sheets).
