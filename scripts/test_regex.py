import os, re

SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
print("SRC_DIR:", SRC_DIR)

UNSAFE_PATTERN = re.compile(
    r'new Date\((?!'
    r'\s*\)'
    r'|Date\.now'
    r'|["\']'
    r'|\d'
    r'|new\s'
    r')'
    r'([^)]+)\)',
    re.MULTILINE
)

count = 0
for root, dirs, files in os.walk(SRC_DIR):
    dirs[:] = [d for d in dirs if d not in ['node_modules', '__tests__', 'tests']]
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')) or fname.endswith('.test.ts'):
            continue
        path = os.path.join(root, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        matches = UNSAFE_PATTERN.findall(content)
        if matches:
            count += len(matches)

print(f"Total matches found: {count}")
