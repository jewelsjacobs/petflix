#!/bin/bash
# Git commit and push — April 2, 2026
# Major documentation overhaul: Creative Director pipeline, limitations research,
# revenue alternatives, README, CLAUDE.md pruning, .gitignore update

set -e
cd ~/projects/petflix

echo "=== Current git status ==="
git status

echo ""
echo "=== Adding all tracked and new files ==="
git add -A

echo ""
echo "=== Files staged for commit ==="
git status --short

echo ""
echo "=== Committing ==="
git commit -m "docs: major overhaul — Creative Director pipeline, limitations research, revenue alternatives

- Add creative-director/ with MICRODRAMA_CRAFT_GUIDE.md, EPISODE_PACKAGE_FORMAT.md,
  SERIES_BIBLE.md, PET_PROFILES.md
- Add episodes/ with throne-e01.md (v1 cinematographic, failed on ImageCreator)
  and throne-e01-v2.md (v2 ImageCreator-compatible, pending test)
- Add TECHNICAL_LIMITATIONS.md documenting all approaches tried and results
- Add REVENUE_ALTERNATIVES.md with 6 alternative revenue/pivot options
- Add README.md with complete doc index and project structure
- Rewrite CLAUDE.md: 404→174 lines, remove stale UI rules, add episode
  package pipeline section, remove redundancy
- Update .gitignore for test-outputs, generated-posters, test-photos
- Add deprecation notice to HANDOFF.md
- Add test-full-pipeline-v1.swift (ImageCreator + AVFoundation full pipeline)"

echo ""
echo "=== Pushing to origin ==="
git push origin main

echo ""
echo "=== Done ==="
