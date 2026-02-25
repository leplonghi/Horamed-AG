
import os
import re
from pathlib import Path

# Configuração
ROOT_DIR = Path("c:/Antigravity/horamed/horamed/src")
SAFE_DATE_IMPORT = 'import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";\n'

FILES_TO_FIX = {
    # Arquivos que requerem correções manuais/regex específicos que o script geral perdeu
    "components/MedicalEventsCalendar.tsx": [
        (r"format\(new Date\(event\.date\.seconds \* 1000\)", "format(safeDateParse(event.date)"),
    ],
    "pages/MedicalEventDetails.tsx": [
        (r"format\(new Date\(event\.date\.seconds \* 1000\)", "format(safeDateParse(event.date)"),
    ],
    "components/MedicalEventsHub.tsx": [
        (r"new Date\(event\.date\.seconds \* 1000\)\.toLocaleDateString\(\)", "safeDateParse(event.date).toLocaleDateString()"),
    ],
    "hooks/useStockProjection.ts": [
        (r"new Date\(d\.takenAt \|\| d\.dueAt\)", "safeDateParse(d.takenAt || d.dueAt)"),
    ],
    "hooks/useWeightInsights.ts": [
        (r"new Date\(weightRelatedMeds\[0\]\.treatment_start_date \|\| weightRelatedMeds\[0\]\.created_at\)", "safeDateParse(weightRelatedMeds[0].treatment_start_date || weightRelatedMeds[0].created_at)"),
    ],
    "lib/pdfExport.ts": [
        (r"data\.items\.map", "data.items?.map"),
        (r"data\.items\.length", "data.items?.length"),
        (r"data\.items &&", "data.items &&"), # Mantém checagem de existência
        (r"data\.items\.forEach", "data.items?.forEach"),
    ],
    "pages/MyDoses.tsx": [
        (r"dose\.items\.name", "dose.items?.name || \"Medicamento\""),
        (r"new Date\(d\.dueAt\) > new Date\(\)", "safeDateParse(d.dueAt) > new Date()"),
         (r"startDate = new Date\(Date\.now\(\) - 30 \* 24 \* 60 \* 60 \* 1000\);", "startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Safe internal calc"),
    ],
    "services/NotificationService.ts": [
        (r"scheduledAt: n\.schedule\?\.at \? new Date\(n\.schedule\.at\) : new Date\(\),", "scheduledAt: n.schedule?.at ? safeDateParse(n.schedule.at) : new Date(),"),
    ],
     "pages/DataExport.tsx": [
         (r"data\.items\.map", "data.items?.map"),
         (r"data\.items\.length", "data.items?.length"),
    ],
    "pages/WeightHistory.tsx": [
         (r"firstDate = new Date\(chartData\[0\]\.fullDate\);", "firstDate = safeDateParse(chartData[0].fullDate);"),
         (r"lastDate = new Date\(chartData\[chartData\.length - 1\]\.fullDate\);", "lastDate = safeDateParse(chartData[chartData.length - 1].fullDate);"),
         (r"markerDate = new Date\(marker\.startDate\);", "markerDate = safeDateParse(marker.startDate);"),
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
    print("🧹 INICIANDO LIMPEZA CIRÚRGICA (NÍVEL 2) 🧹")
    fixed_count = 0
    
    for relative_path, replacements in FILES_TO_FIX.items():
        # Tenta achar o arquivo recursivamente se o path for curto, ou usa full path
        found = False
        target_path = None
        
        # Check direct path
        p = ROOT_DIR / relative_path
        if p.exists():
            target_path = p
        else:
            # Search
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

    print(f"\n🎉 Limpeza Nível 2 concluída! {fixed_count} arquivos refinados.")

if __name__ == "__main__":
    main()
