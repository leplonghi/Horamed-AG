
import os
import re
from pathlib import Path

# Configuração
ROOT_DIR = Path("c:/Antigravity/horamed/horamed/src")
EXCLUDE_FILES = ["safeDateUtils.ts", "fix_security_audit.py", "audit_security.py"]

def add_import_if_needed(content: str) -> str:
    """Add safeDateParse import if not present"""
    if "safeDateParse" in content or "safeGetTime" in content:
        return content
    
    # Find last import statement
    import_pattern = r'(import .+ from ["\'].+["\'];?\n)'
    imports = list(re.finditer(import_pattern, content))
    
    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        new_import = 'import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";\n'
        return content[:insert_pos] + new_import + content[insert_pos:]
    
    return content

def fix_file_content(content: str, filename: str) -> str:
    original_content = content
    
    # 1. Fix new Date(variable) -> safeDateParse(variable)
    # Ignora new Date() vazio e new Date(número fixo)
    patterns = [
        # pattern normal: new Date(exame.data)
        (r'new Date\(([a-zA-Z_][a-zA-Z0-9_.]*)\)', r'safeDateParse(\1)'),
        
        # pattern com getTime: new Date(x).getTime() -> safeGetTime(x)
        (r'new Date\(([a-zA-Z_][a-zA-Z0-9_.]*)\)\.getTime\(\)', r'safeGetTime(\1)'),

        # pattern format: format(new Date(x), ...) -> format(safeDateParse(x), ...)
        (r'format\(new Date\(([a-zA-Z_][a-zA-Z0-9_.]*)\)', r'format(safeDateParse(\1)'),
    ]

    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)

    # 2. Fix dose.items.name -> dose.items?.name
    if "dose.items.name" in content:
        content = content.replace("dose.items.name", 'dose.items?.name || "Medicamento"')

    # 3. Add import if file was modified with safe functions
    if content != original_content:
        if "safeDateParse" in content or "safeGetTime" in content:
            content = add_import_if_needed(content)

    return content

def main():
    print("🧹 INICIANDO LIMPEZA PROFUNDA DE SEGURANÇA 🧹")
    fixed_count = 0
    
    for root, _, files in os.walk(ROOT_DIR):
        for file in files:
            if not file.endswith((".ts", ".tsx")):
                continue
                
            if file in EXCLUDE_FILES:
                continue

            file_path = Path(root) / file
            
            try:
                content = file_path.read_text(encoding="utf-8")
                new_content = fix_file_content(content, file)
                
                if new_content != content:
                    file_path.write_text(new_content, encoding="utf-8")
                    print(f"✅ Corrigido: {file}")
                    fixed_count += 1
                    
            except Exception as e:
                print(f"❌ Erro em {file}: {e}")

    print(f"\n🎉 Limpeza concluída! {fixed_count} arquivos blindados.")

if __name__ == "__main__":
    main()
