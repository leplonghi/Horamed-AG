#!/usr/bin/env python3
"""
Script para substituir textos soltos e alts hardcoded por chaves de tradução
"""

import re
import sys
from pathlib import Path

# Mapeamento de mensagens hardcoded para chaves de tradução
# Formato: (regex_do_valor, chave_de_traducao)
REPLACEMENTS = [
    # Alt Texts
    (r'alt="HoraMed"', 'alt="HoraMed"'), # Nome próprio, manteve
    (r'alt="Clara"', 'alt="Clara"'), # Nome próprio, manteve
    (r'alt="Preview"', 'alt={t("alt.preview")}'),
    (r'alt="Preview do documento"', 'alt={t("alt.documentPreview")}'),
    (r'alt="Document preview"', 'alt={t("alt.documentPreview")}'),
    (r'alt="Avatar"', 'alt={t("alt.avatar")}'),
    
    # Textos Soltos (cuidado com regex aqui, para não pegar coisa errada)
    (r'>Minhas Recompensas<', '>{t("gamification.myRewards")}<'),
    
    # Placeholders que podem ter escapado (versão aspas simples)
    (r"placeholder='Ex: 70\.5'", "placeholder={t('placeholder.weight')}"),
     # ... adicione mais se necessário
]

def replace_in_file(file_path: Path) -> bool:
    """Replace hardcoded strings with translation keys"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Replace each mapping
        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        # Only write if changes were made
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            print(f"✅ Updated: {file_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    if len(sys.argv) > 1:
        target_dir = Path(sys.argv[1])
    else:
        target_dir = Path("src")
    
    if not target_dir.exists():
        print(f"❌ Directory does not exist: {target_dir}")
        return
    
    files = list(target_dir.rglob("*.tsx")) + list(target_dir.rglob("*.ts"))
    print(f"🔍 Found {len(files)} files to check in {target_dir}\n")
    
    updated_count = 0
    for file_path in files:
        if replace_in_file(file_path):
            updated_count += 1
    
    print(f"\n✨ Done! Updated {updated_count} files.")

if __name__ == "__main__":
    main()
