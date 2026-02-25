import json
import subprocess

out = subprocess.run(["python", ".agent/skills/seo-fundamentals/scripts/seo_checker.py", "src"], capture_output=True, text=True)

# The python format is weird, it prints a summary. We just need to know which page has which specific issue.
# Wait, I'll just write my own little parser here to find H1s and empty alts.

import re
import os
from pathlib import Path

pages = list(Path("src/pages").glob("**/*.tsx"))
for p in pages:
    content = p.read_text(encoding="utf-8")
    
    # H1
    h1s = re.findall(r'<h1[^>]*>', content, re.I)
    if len(h1s) > 1:
        print(f"{p} has {len(h1s)} H1 tags")

    # empty alt
    imgs = re.findall(r'<img[^>]+>', content, re.I)
    for i, img in enumerate(imgs):
        if 'alt=""' in img or "alt=''" in img:
            print(f"{p} has empty alt in img {i}")
