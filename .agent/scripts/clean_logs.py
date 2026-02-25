"""
Script para remover console.log de debug em produção
Mantém apenas console.error e console.warn
"""
import os
import re
from pathlib import Path

# Diretórios para processar
DIRS_TO_CLEAN = [
    "src/hooks",
    "src/services",
    "src/contexts",
    "src/components"
]

# Padrões a remover (debug logs)
DEBUG_PATTERNS = [
    r'^\s*console\.log\([^)]*\);\s*$',  # console.log completo em linha única
    r'^\s*console\.log\(',  # início de console.log multilinha
]

# Padrões a MANTER (logs críticos)
KEEP_PATTERNS = [
    'console.error',
    'console.warn',
]

def should_keep_line(line: str) -> bool:
    """Verifica se a linha deve ser mantida"""
    for pattern in KEEP_PATTERNS:
        if pattern in line:
            return True
    return False

def clean_file(filepath: Path) -> tuple[int, int]:
    """
    Remove console.log de debug de um arquivo
    Retorna (linhas_removidas, linhas_totais)
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        original_count = len(lines)
        cleaned_lines = []
        in_multiline_log = False
        removed_count = 0
        
        for line in lines:
            # Se está em log multilinha, pula até fechar
            if in_multiline_log:
                if ');' in line:
                    in_multiline_log = False
                    removed_count += 1
                continue
            
            # Verifica se deve manter (error/warn)
            if should_keep_line(line):
                cleaned_lines.append(line)
                continue
            
            # Verifica se é console.log de linha única
            if re.match(DEBUG_PATTERNS[0], line):
                removed_count += 1
                continue
            
            # Verifica se inicia console.log multilinha
            if re.match(DEBUG_PATTERNS[1], line):
                if ');' not in line:
                    in_multiline_log = True
                removed_count += 1
                continue
            
            # Linha normal, mantém
            cleaned_lines.append(line)
        
        # Só escreve se houve mudanças
        if removed_count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(cleaned_lines)
        
        return (removed_count, original_count)
    
    except Exception as e:
        print(f"❌ Erro ao processar {filepath}: {e}")
        return (0, 0)

def main():
    """Executa limpeza em todos os diretórios"""
    total_removed = 0
    total_files = 0
    
    print("🧹 Iniciando limpeza de console.log...\n")
    
    for dir_path in DIRS_TO_CLEAN:
        full_path = Path(dir_path)
        if not full_path.exists():
            print(f"⚠️  Diretório não encontrado: {dir_path}")
            continue
        
        print(f"📁 Processando {dir_path}...")
        
        for file_path in full_path.rglob("*.ts*"):
            if file_path.suffix in ['.ts', '.tsx']:
                removed, total = clean_file(file_path)
                if removed > 0:
                    total_removed += removed
                    total_files += 1
                    print(f"  ✓ {file_path.name}: {removed} logs removidos")
    
    print(f"\n✅ Limpeza concluída!")
    print(f"   Arquivos modificados: {total_files}")
    print(f"   Logs removidos: {total_removed}")

if __name__ == "__main__":
    main()
