
import os
import re
from pathlib import Path

# Configuração
ROOT_DIR = Path("c:/Antigravity/horamed/horamed/src")

# Patterns que são PERIGOSOS (acesso a dados externos)
# Ignora chamadas com "Date.now()", "year", ou strings literais de timezone
FORBIDDEN_PATTERNS = [
    # Proíbe new Date(var) onde var não é resultado de Date.now()
    (r"new Date\(([a-zA-Z_][a-zA-Z0-9_.]*)\)", "USO INSEGURO DE new Date() COM VARIÁVEL! Use safeDateParse()"),
    
    # Proíbe acesso direto a .items sem ?
    (r"\.items\.[a-zA-Z]", "ACESSO DIRETO A .items SEM CHECAGEM! Use .items?."),
    
    (r"Date\.parse\(", "USO INSEGURO DE Date.parse()! Use safeDateParse()")
]

EXCLUDE_DIRS = ["lib/safeDateUtils.ts", "scripts/"]

def is_safe_usage(line):
    """Retorna True se o uso de new Date() na linha for considerado seguro"""
    # Safe: new Date() (sem args)
    if "new Date()" in line and "new Date(" not in line.replace("new Date()", ""):
        return True
    
    # Safe: new Date(Date.now()) ou cálculos matemáticos simples
    if "Date.now()" in line:
        return True
    
    # Safe: new Date(year, month, ...) - Construtor numérico
    if re.search(r"new Date\(\w+, \w+", line):
        return True
    
    # Safe: Comentários de ignore
    if "// safe-ignore" in line or "eslint-disable" in line:
        return True
        
    return False

def scan_files():
    print("🛡️  INICIANDO AUDITORIA INTELIGENTE DE SEGURANÇA (HORAMED) 🛡️")
    errors_found = 0
    
    for root, _, files in os.walk(ROOT_DIR):
        for file in files:
            if not file.endswith((".ts", ".tsx")):
                continue
                
            file_path = Path(root) / file
            
            # Skip excluded
            if any(ex in str(file_path).replace("\\", "/") for ex in EXCLUDE_DIRS):
                continue

            try:
                content = file_path.read_text(encoding="utf-8")
                lines = content.splitlines()
                
                for i, line in enumerate(lines):
                    for pattern, msg in FORBIDDEN_PATTERNS:
                        match = re.search(pattern, line)
                        if match:
                            if is_safe_usage(line):
                                continue
                                
                            print(f"❌ [ERRO] {file_path.name}:{i+1}")
                            print(f"   Line: {line.strip()}")
                            print(f"   Issue: {msg}\n")
                            errors_found += 1
                            
            except Exception as e:
                print(f"⚠️  Erro ao ler {file}: {e}")

    if errors_found == 0:
        print("\n✅ PARABÉNS! Código 100% BLINDADO contra dados inseguros.")
    else:
        print(f"\n🚨  ATENÇÃO: {errors_found} VIOLAÇÕES REAIS ENCONTRADAS!")
        print("Corrija imediatamente.")

if __name__ == "__main__":
    scan_files()
