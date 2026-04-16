#!/usr/bin/env python3
"""
fix_unsafe_dates.py — Substitui new Date(variavel) por safeDateParse(variavel)
em todos os arquivos .ts/.tsx de src/.
Preserva: new Date() sem args, new Date(Date.now()), new Date("2024-..."), new Date(2024, ...).
"""
import os, re, sys

SRC_DIR = os.path.join(os.path.dirname(__file__), '..', 'src')
IMPORT_LINE = 'import { safeDateParse } from "@/lib/safeDateUtils";'

# Padrão: new Date( seguido de algo que não seja: ), Date.now, dígito, string literal
UNSAFE_PATTERN = re.compile(
    r'new Date\((?!'                  # new Date(
    r'\s*\)'                           # ) — sem argumento
    r'|Date\.now'                      # Date.now()
    r'|["\']'                          # string literal
    r'|\d'                             # número literal
    r'|new\s'                          # new Date(new ...)
    r')'
    r'([^)]+)\)',                       # captura o argumento
    re.MULTILINE
)

fixed_files = []

for root, dirs, files in os.walk(SRC_DIR):
    # Ignora pastas de teste e node_modules
    dirs[:] = [d for d in dirs if d not in ['node_modules', '__tests__', 'tests']]
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')) or fname.endswith('.test.ts'):
            continue
        path = os.path.join(root, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = UNSAFE_PATTERN.sub(r'safeDateParse(\1)', content)

        if new_content != content:
            # Adiciona import se necessário
            if IMPORT_LINE not in new_content and 'safeDateUtils' not in new_content:
                # Encontra a última linha de import e adiciona depois
                lines = new_content.split('\n')
                last_import = 0
                for i, line in enumerate(lines):
                    if line.startswith('import '):
                        last_import = i
                lines.insert(last_import + 1, IMPORT_LINE)
                new_content = '\n'.join(lines)

            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            fixed_files.append(path.replace(SRC_DIR, 'src'))

print(f"OK {len(fixed_files)} arquivos corrigidos:")
for f in fixed_files:
    print(f"  {f}")
