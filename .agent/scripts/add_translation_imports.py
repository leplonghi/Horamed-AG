#!/usr/bin/env python3
"""
Script para adicionar imports do useTranslation em arquivos que usam t()
"""

import re
import sys
from pathlib import Path

def add_translation_import(file_path: Path) -> bool:
    """Add useTranslation import if file uses t() but doesn't have the import"""
    try:
        content = file_path.read_text(encoding='utf-8')
        
        # Check if file uses t( function
        if not re.search(r'\bt\(["\']', content):
            return False
        
        # Check if already has the import
        if 'useTranslation' in content or 'useLanguage' in content:
            return False
        
        # Find the last import statement
        import_pattern = r'^import\s+.*?;?\s*$'
        imports = list(re.finditer(import_pattern, content, re.MULTILINE))
        
        if not imports:
            print(f"⚠️  No imports found in {file_path}")
            return False
        
        last_import = imports[-1]
        insert_pos = last_import.end()
        
        # Add the import
        new_import = '\nimport { useTranslation } from "@/contexts/LanguageContext";'
        content = content[:insert_pos] + new_import + content[insert_pos:]
        
        # Find the component function and add the hook
        # Look for: export default function ComponentName() {
        component_pattern = r'(export default function \w+\([^)]*\)\s*\{)'
        match = re.search(component_pattern, content)
        
        if match:
            # Check if already has const { t }
            function_start = match.end()
            # Look ahead in the function to see if t is already declared
            next_100_chars = content[function_start:function_start+200]
            if 'const { t }' not in next_100_chars and 'const t =' not in next_100_chars:
                # Add the hook declaration
                hook_declaration = '\n  const { t } = useTranslation();'
                content = content[:function_start] + hook_declaration + content[function_start:]
        
        file_path.write_text(content, encoding='utf-8')
        print(f"✅ Added import to: {file_path}")
        return True
        
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
        if add_translation_import(file_path):
            updated_count += 1
    
    print(f"\n✨ Done! Added imports to {updated_count} files.")

if __name__ == "__main__":
    main()
