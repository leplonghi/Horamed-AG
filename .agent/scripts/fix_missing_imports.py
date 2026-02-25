
import os
import re
from pathlib import Path

# Configuração
ROOT_DIR = Path("c:/Antigravity/horamed/horamed/src")
SAFE_DATE_IMPORT = 'import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";\n'

def fix_imports():
    print("🚑 INICIANDO RESGATE DE IMPORTS PERDIDOS 🚑")
    fixed_count = 0
    
    for root, _, files in os.walk(ROOT_DIR):
        for file in files:
            if not file.endswith((".ts", ".tsx")):
                continue
                
            file_path = Path(root) / file
            
            try:
                content = file_path.read_text(encoding="utf-8")
                
                # Check usage
                uses_safe_utils = "safeDateParse" in content or "safeGetTime" in content
                
                # Check import definition (be loose about specific syntax, look for path)
                has_import = "@/lib/safeDateUtils" in content
                
                # Skip validation file itself
                if "safeDateUtils.ts" in file:
                    continue

                if uses_safe_utils and not has_import:
                    print(f"🔧 Consertando import em: {file}")
                    
                    # Find insertion point (after last import or at top)
                    import_pattern = r'(import .+ from ["\'].+["\'];?\n)'
                    imports = list(re.finditer(import_pattern, content))
                    
                    if imports:
                        last_import = imports[-1]
                        insert_pos = last_import.end()
                        new_content = content[:insert_pos] + SAFE_DATE_IMPORT + content[insert_pos:]
                    else:
                        # No imports, add at top
                        new_content = SAFE_DATE_IMPORT + content
                        
                    file_path.write_text(new_content, encoding="utf-8")
                    fixed_count += 1

            except Exception as e:
                print(f"❌ Erro em {file}: {e}")

    print(f"\n🎉 Resgate concluído! {fixed_count} arquivos salvos.")

if __name__ == "__main__":
    fix_imports()
