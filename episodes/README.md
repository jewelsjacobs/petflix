# Episodes Directory

This directory holds **approved episode packages** produced by the
Creative Director project and consumed by the Engineering project
(Claude Code).

## Naming Convention

`[series-slug]-e[number].md`

Examples:
- `throne-e01.md` — The Throne, Episode 1
- `betrayed-e01.md` — Betrayed, Episode 1
- `rise-e03.md` — Rise to Power, Episode 3

## Workflow

1. Creative Director project produces an episode package
2. Julia reviews and approves it
3. Approved package is saved here with the naming convention above
4. Claude Code reads the package and drives the generation pipeline

## For Claude Code

When asked to generate an episode, read the package file in this
directory. Extract:
- `IMAGECREATOR_PROMPT` for each scene → pass to ImageCreator API
- `DURATION` → set scene timing in AVFoundation composition
- `KEN_BURNS_DIRECTION` + `KEN_BURNS_SPEED` → configure Core Animation
- `TRANSITION_IN` / `TRANSITION_OUT` → set AVFoundation transitions
- `NARRATION` → generate TTS audio via AVSpeechSynthesis
- `MUSIC_CUE` → map to bundled audio tracks
- `TEXT_OVERLAY` → render with AVMutableComposition text layers

Do NOT improvise story content. The Creative Director already made
all creative decisions. Engineering just executes.
