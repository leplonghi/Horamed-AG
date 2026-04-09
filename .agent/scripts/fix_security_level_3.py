
import os
import re
from pathlib import Path

# Configuração
ROOT_DIR = Path("c:/Antigravity/horamed/horamed/src")
SAFE_DATE_IMPORT = 'import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";\n'

FILES_TO_FIX = {
    "pages/Rotina.tsx": [
        (r"new Date\(b\.createdAt \|\| 0\)\.getTime\(\)", "safeGetTime(b.createdAt || 0)"),
        (r"new Date\(a\.createdAt \|\| 0\)\.getTime\(\)", "safeGetTime(a.createdAt || 0)")
    ],
    "pages/MyDoses.tsx": [
        (r"showFeedback\('dose-taken', \{ medicationName: selectedDose.items.name \}\);", "showFeedback('dose-taken', { medicationName: selectedDose.items?.name || 'Medicamento' });"),
        (r"startDate = new Date\(Date\.now\(\) - 30 \* 24 \* 60 \* 60 \* 1000\); // Safe internal calc", "startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Safe internal calc"), # Ignore logic if already tagged
    ],
    "pages/AddItem.tsx": [
        (r"new Date\(startDate\.getTime\(\)", "new Date(safeGetTime(startDate)"),
    ],
    "lib/dose.ts": [
         (r"typeof value\.items\.name === 'string'", "typeof value.items?.name === 'string'"),
    ],
    "services/CampaignService.ts": [
        (r"new Date\(Date\.now\(\) \+", "new Date(Date.now() +"), # Ignore safe internal
    ]
}

def add_import(content: str) -> str:
    if "safeDateParse" in content or "safeGetTime" in content:
        return content
    
    import_pattern = r'(import .+ from ["\'].+["\'];?\n)'
    imports = list(re.finditer(import_pattern, content))
    
    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        return content[:insert_pos] + SAFE_DATE_IMPORT + content[insert_pos:]
    return content

def main():
    print("🧹 INICIANDO LIMPEZA CIRÚRGICA (NÍVEL 3) 🧹")
    fixed_count = 0
    
    for relative_path, replacements in FILES_TO_FIX.items():
        target_path = None
        
        # Search file
        for root, _, files in os.walk(ROOT_DIR):
            if Path(relative_path).name in files:
                target_path = Path(root) / Path(relative_path).name
                break
        
        if not target_path:
            print(f"⚠️  Arquivo não encontrado: {relative_path}")
            continue

        try:
            content = target_path.read_text(encoding="utf-8")
            original_content = content
            
            for pattern, replacement in replacements:
                content = re.sub(pattern, replacement, content)
            
            if content != original_content:
                content = add_import(content)
                target_path.write_text(content, encoding="utf-8")
                print(f"✅ Corrigido: {target_path.name}")
                fixed_count += 1
            else:
                 print(f"⏭️  Sem mudanças necessárias em: {target_path.name}")
                 
        except Exception as e:
            print(f"❌ Erro em {target_path.name}: {e}")

    print(f"\n🎉 Limpeza Nível 3 concluída! {fixed_count} arquivos refinados.")

if __name__ == "__main__":
    main()
