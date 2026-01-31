#!/usr/bin/env python3
"""
Script para encontrar strings hardcoded em arquivos .tsx
"""
import re
import sys
from pathlib import Path

def check_file(file_path: Path):
    try:
        content = file_path.read_text(encoding='utf-8')
        lines = content.splitlines()
        
        found = []
        for i, line in enumerate(lines):
            # Ignorar comentários
            if line.strip().startswith('//') or line.strip().startswith('/*'):
                continue
                
            # Procurar texto entre tags >Texto<
            # Regex simplificado: procura caractere maiúsculo seguido de minúsculos/espaços entre tags
            matches = re.finditer(r'>\s*([A-ZÀ-Ú][a-zA-ZÀ-Úà-ú0-9\s\.,!\?]{2,})\s*<', line)
            
            for match in matches:
                text = match.group(1).strip()
                # Ignorar componentes React (PascalCase sem espaços)
                if ' ' not in text and text[0].isupper() and not any(c in 'À-Úà-ú' for c in text):
                    continue
                    
                # Ignorar variáveis comuns ou chaves de tradução
                if '{' in text or '}' in text or 't(' in text:
                    continue
                    
                found.append((i+1, text))
                
        if found:
            print(f"\n📂 {file_path}")
            for line_num, text in found:
                print(f"  Line {line_num}: {text}")
                
    except Exception as e:
        pass

def main():
    if len(sys.argv) > 1:
        target_dir = Path(sys.argv[1])
    else:
        target_dir = Path("src/pages")
        
    if not target_dir.exists():
        print(f"❌ Directory does not exist: {target_dir}")
        return

    print(f"🔍 Searching for hardcoded strings in {target_dir}...")
    files = list(target_dir.rglob("*.tsx"))
    
    for file_path in files:
        check_file(file_path)

if __name__ == "__main__":
    main()
