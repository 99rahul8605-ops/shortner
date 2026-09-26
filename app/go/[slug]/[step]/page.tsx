#!/usr/bin/env python3
"""Patch missing required VisitorPopup props in every route page in this checkout.

Run from repository root: python3 fix-bingolink-popup-props.py
Only changes app/go/[slug]/[step]/page.tsx paths that need this exact fix.
"""
from pathlib import Path
import re
import sys

root = Path.cwd()
files = sorted(
    p for p in root.rglob('page.tsx')
    if p.parts[-5:] == ('app', 'go', '[slug]', '[step]', 'page.tsx')
    and not any(x in p.parts for x in ('.next', 'node_modules', '.git'))
)
if not files:
    print('No matching app/go/[slug]/[step]/page.tsx found. Check your project directory.')
    sys.exit(1)

changed = 0
already_correct = 0
for path in files:
    content = path.read_text(encoding='utf-8')
    all_tags = re.findall(r'<VisitorPopup\b[^>]*>', content, flags=re.DOTALL)
    if not all_tags:
        print(f'No VisitorPopup tag in {path.relative_to(root)}')
        continue
    new_content = content
    for tag in all_tags:
        if all(re.search(r'\b'+name+r'\s*=', tag) for name in ('slug', 'step', 'required')):
            already_correct += 1
            continue
        if 'directUrl={directUrl}' not in tag:
            print(f'Skipping unfamiliar VisitorPopup call in {path.relative_to(root)}')
            continue
        fixed = tag
        extras = [('slug', '{slug}'), ('step', '{step}'), ('required', '{progress.startedAt === 0}')]
        insert = ''.join(f' {name}={value}' for name,value in extras if not re.search(r'\b'+name+r'\s*=', tag))
        fixed = fixed.replace('directUrl={directUrl}', 'directUrl={directUrl}'+insert, 1)
        new_content = new_content.replace(tag, fixed, 1)
    if new_content != content:
        path.write_text(new_content, encoding='utf-8')
        changed += 1
        print(f'FIXED: {path.relative_to(root)}')
    else:
        print(f'UNCHANGED: {path.relative_to(root)}')

print(f'Changed files: {changed}; already-correct popup calls: {already_correct}')
if not changed and not already_correct:
    sys.exit(2)
print('Next: git diff, git add, git commit, git push; verify Vercel deploys the NEW commit.')
