"""
Script para aplicar safeParseDoseDate em todos os componentes
Substitui new Date(dose.xxx) por parsing seguro
"""
import re
from pathlib import Path
from typing import Tuple

# Arquivos críticos para refatorar
CRITICAL_FILES = [
    "src/components/DoseCard.tsx",
    "src/components/DoseActionModal.tsx",
    "src/components/NextDoseWidget.tsx",
    "src/components/SwipeableDoseCard.tsx",
    "src/components/ModernWeekCalendar.tsx",
    "src/pages/MyDoses.tsx",
    "src/pages/Charts.tsx",
    "src/hooks/usePushNotifications.ts",
]

def add_import_if_missing(content: str) -> str:
    """Adiciona import do safeParseDoseDate se não existir"""
    if 'safeParseDoseDate' in content:
        return content
    
    # Procura por outros imports de @/types
    types_import_match = re.search(r'import\s+{([^}]+)}\s+from\s+["\']@/types["\'];?', content)
    
    if types_import_match:
        # Adiciona ao import existente
        existing_imports = types_import_match.group(1)
        if 'safeParseDoseDate' not in existing_imports:
            new_imports = existing_imports.strip() + ', safeParseDoseDate'
            content = content.replace(
                types_import_match.group(0),
                f'import {{ {new_imports} }} from "@/types";'
            )
    else:
        # Adiciona novo import após os outros imports
        import_section_end = content.rfind('import ')
        if import_section_end != -1:
            next_line = content.find('\n', import_section_end)
            if next_line != -1:
                content = (
                    content[:next_line + 1] +
                    'import { safeParseDoseDate } from "@/types";\n' +
                    content[next_line + 1:]
                )
    
    return content

def replace_unsafe_date_parsing(content: str) -> Tuple[str, int]:
    """
    Substitui new Date(dose.xxx) por safeParseDoseDate
    Retorna (conteúdo_modificado, número_de_substituições)
    """
    replacements = 0
    
    # Padrão 1: new Date(dose.dueAt) ou new Date(dose.due_at)
    pattern1 = r'new\s+Date\((dose\.(?:dueAt|due_at|takenAt|taken_at))\)'
    
    def replace_fn(match):
        nonlocal replacements
        replacements += 1
        return '(safeParseDoseDate(dose) || new Date())'
    
    content = re.sub(pattern1, replace_fn, content)
    
    return content, replacements

def process_file(filepath: Path) -> Tuple[int, bool]:
    """
    Processa um arquivo
    Retorna (número_de_substituições, sucesso)
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Adiciona import
        content = add_import_if_missing(original_content)
        
        # Substitui parsing inseguro
        content, replacements = replace_unsafe_date_parsing(content)
        
        # Só escreve se houve mudanças
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return (replacements, True)
        
        return (0, True)
        
    except Exception as e:
        print(f"❌ Erro ao processar {filepath}: {e}")
        return (0, False)

def main():
    """Executa refatoração em todos os arquivos críticos"""
    total_replacements = 0
    total_files = 0
    
    print("🛡️ Iniciando blindagem de datas...\n")
    
    for file_path in CRITICAL_FILES:
        full_path = Path(file_path)
        
        if not full_path.exists():
            print(f"⚠️  Arquivo não encontrado: {file_path}")
            continue
        
        replacements, success = process_file(full_path)
        
        if success and replacements > 0:
            total_replacements += replacements
            total_files += 1
            print(f"  ✓ {full_path.name}: {replacements} substituições")
        elif success:
            print(f"  - {full_path.name}: já protegido")
    
    print("\n✅ Blindagem concluída!")
    print(f"   Arquivos modificados: {total_files}")
    print(f"   Substituições: {total_replacements}")
    print("\n⚠️  ATENÇÃO: Revise manualmente os arquivos modificados")
    print("   Alguns casos podem precisar de ajuste manual.")

if __name__ == "__main__":
    main()
