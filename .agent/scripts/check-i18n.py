import os
import re

# Caminhos
PROJECT_ROOT = os.path.join(os.getcwd(), 'src')
LANGUAGE_CONTEXT_PATH = os.path.join(os.getcwd(), 'src', 'contexts', 'LanguageContext.tsx')

def get_defined_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex simplificado para pegar chaves dentro do objeto de tradução
    # Assume formato: 'chave.exemplo': 'Valor',
    keys = set(re.findall(r"^\s*'([\w\.]+)':", content, re.MULTILINE))
    return keys

def get_used_keys(root_dir):
    used_keys = set()
    usage_locations = {}

    # Regex para pegar t('chave') ou t("chave")
    regex = re.compile(r"t\(['\"]([\w\.]+)['\"]\)")

    for subdir, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(subdir, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        content = f.read()
                        matches = regex.findall(content)
                        for match in matches:
                            used_keys.add(match)
                            if match not in usage_locations:
                                usage_locations[match] = []
                            usage_locations[match].append(file_path)
                    except Exception as e:
                        print(f"Erro ao ler {file_path}: {e}")
    return used_keys, usage_locations

def main():
    print("🔍 Iniciando auditoria de internacionalização...")
    
    defined_keys = get_defined_keys(LANGUAGE_CONTEXT_PATH)
    print(f"✅ Encontradas {len(defined_keys)} chaves definidas no LanguageContext.")

    used_keys, locations = get_used_keys(PROJECT_ROOT)
    print(f"🔎 Encontradas {len(used_keys)} chaves sendo usadas no código.")

    missing_keys = used_keys - defined_keys
    
    if missing_keys:
        print(f"\n❌ ERRO: Foram encontradas {len(missing_keys)} chaves em uso que NÃO estão definidas:\n")
        sorted_missing = sorted(list(missing_keys))
        for key in sorted_missing:
            print(f"  - {key}")
            # Mostrar onde está sendo usado (apenas o primeiro arquivo para não poluir)
            first_file = locations[key][0]
            count = len(locations[key])
            print(f"    ↳ Usado em: {os.path.basename(first_file)} (+{count-1} outros)" if count > 1 else f"    ↳ Usado em: {os.path.basename(first_file)}")
    else:
        print("\n✅ Sucesso! Todas as chaves usadas estão definidas.")

if __name__ == "__main__":
    main()
