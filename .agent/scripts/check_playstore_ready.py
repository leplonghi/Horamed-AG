#!/usr/bin/env python3
"""
🔍 Script de Verificação Pré-Publicação - Play Store
Verifica se o projeto está pronto para publicação na Google Play Store
"""

import os
import sys
import json
from pathlib import Path
from typing import List

class Colors:
    """Cores para output no terminal"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

class PlayStoreChecker:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent  # .agent/scripts -> .agent -> project_root
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []
        
    def print_header(self, text: str):
        """Imprime cabeçalho formatado"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")
        
    def print_success(self, text: str):
        """Imprime mensagem de sucesso"""
        print(f"{Colors.GREEN}✅ {text}{Colors.END}")
        self.passed.append(text)
        
    def print_warning(self, text: str):
        """Imprime mensagem de aviso"""
        print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")
        self.warnings.append(text)
        
    def print_error(self, text: str):
        """Imprime mensagem de erro"""
        print(f"{Colors.RED}❌ {text}{Colors.END}")
        self.errors.append(text)
        
    def check_file_exists(self, file_path: Path, description: str) -> bool:
        """Verifica se um arquivo existe"""
        if file_path.exists():
            self.print_success(f"{description}: {file_path.name}")
            return True
        else:
            self.print_error(f"{description} não encontrado: {file_path}")
            return False
            
    def check_capacitor_config(self):
        """Verifica configurações do Capacitor"""
        self.print_header("1. Verificando Capacitor Config")
        
        config_path = self.project_root / "capacitor.config.ts"
        if not self.check_file_exists(config_path, "Capacitor config"):
            return
            
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Verificar se server.url está comentado
        if 'server: {' in content and '// server: {' not in content:
            self.print_error("server.url NÃO está comentado - DEVE estar comentado para produção!")
        else:
            self.print_success("server.url está comentado (produção)")
            
        # Verificar webContentsDebuggingEnabled
        if 'webContentsDebuggingEnabled: false' in content:
            self.print_success("webContentsDebuggingEnabled: false (produção)")
        elif 'webContentsDebuggingEnabled: true' in content:
            self.print_error("webContentsDebuggingEnabled está TRUE - DEVE ser FALSE para Play Store!")
        else:
            self.print_warning("webContentsDebuggingEnabled não encontrado")
            
    def check_build_gradle(self):
        """Verifica configurações do build.gradle"""
        self.print_header("2. Verificando Build Gradle")
        
        gradle_path = self.project_root / "android" / "app" / "build.gradle"
        if not self.check_file_exists(gradle_path, "build.gradle"):
            return
            
        with open(gradle_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extrair versionCode e versionName
        import re
        version_code_match = re.search(r'versionCode\s+(\d+)', content)
        version_name_match = re.search(r'versionName\s+"([^"]+)"', content)
        
        if version_code_match:
            version_code = version_code_match.group(1)
            self.print_success(f"versionCode: {version_code}")
        else:
            self.print_error("versionCode não encontrado")
            
        if version_name_match:
            version_name = version_name_match.group(1)
            self.print_success(f"versionName: {version_name}")
        else:
            self.print_error("versionName não encontrado")
            
        # Verificar signingConfig
        if 'signingConfig signingConfigs.release' in content:
            self.print_success("signingConfig configurado para release")
        else:
            self.print_error("signingConfig NÃO configurado para release")
            
        # Verificar minifyEnabled
        if 'minifyEnabled true' in content:
            self.print_success("minifyEnabled: true (otimização ativada)")
        else:
            self.print_warning("minifyEnabled não está true - considere ativar para reduzir tamanho")
            
    def check_keystore(self):
        """Verifica existência da keystore"""
        self.print_header("3. Verificando Keystore")
        
        keystore_path = self.project_root / "android" / "keystore" / "horamed-release.keystore"
        
        if self.check_file_exists(keystore_path, "Keystore de produção"):
            # Verificar tamanho (keystore deve ter alguns KB)
            size = keystore_path.stat().st_size
            if size > 1000:  # > 1KB
                self.print_success(f"Keystore tem tamanho válido: {size} bytes")
            else:
                self.print_warning(f"Keystore parece muito pequena: {size} bytes")
        else:
            self.print_error("Keystore NÃO encontrada - CRÍTICO!")
            self.print_error("Execute: keytool -genkeypair -v -storetype PKCS12 -keystore android/keystore/horamed-release.keystore ...")
            
        # Verificar variável de ambiente
        keystore_password = os.getenv('HORAMED_KEYSTORE_PASSWORD')
        if keystore_password:
            self.print_success("Variável HORAMED_KEYSTORE_PASSWORD configurada")
        else:
            self.print_error("Variável HORAMED_KEYSTORE_PASSWORD NÃO configurada!")
            self.print_error("Execute: export HORAMED_KEYSTORE_PASSWORD='sua_senha'")
            
    def check_build_output(self):
        """Verifica se o build foi gerado"""
        self.print_header("4. Verificando Build Output")
        
        # Verificar dist/
        dist_path = self.project_root / "dist"
        if dist_path.exists() and (dist_path / "index.html").exists():
            self.print_success("Build web (dist/) existe")
            
            # Contar arquivos
            file_count = len(list(dist_path.rglob('*')))
            self.print_success(f"Build contém {file_count} arquivos")
        else:
            self.print_warning("Build web (dist/) não encontrado - execute 'npm run build'")
            
        # Verificar AAB
        aab_path = self.project_root / "android" / "app" / "build" / "outputs" / "bundle" / "release" / "app-release.aab"
        if aab_path.exists():
            size_mb = aab_path.stat().st_size / (1024 * 1024)
            self.print_success(f"AAB gerado: {size_mb:.2f} MB")
            
            if size_mb > 150:
                self.print_warning(f"AAB muito grande ({size_mb:.2f} MB) - Play Store tem limite de 150MB")
            elif size_mb > 100:
                self.print_warning(f"AAB grande ({size_mb:.2f} MB) - considere otimizar")
        else:
            self.print_warning("AAB não encontrado - execute './gradlew bundleRelease'")
            
    def check_package_json(self):
        """Verifica package.json"""
        self.print_header("5. Verificando Package.json")
        
        package_path = self.project_root / "package.json"
        if not self.check_file_exists(package_path, "package.json"):
            return
            
        with open(package_path, 'r', encoding='utf-8') as f:
            package = json.load(f)
            
        # Verificar nome
        if 'name' in package:
            self.print_success(f"Nome do projeto: {package['name']}")
        else:
            self.print_warning("Nome do projeto não encontrado")
            
        # Verificar versão
        if 'version' in package:
            self.print_success(f"Versão: {package['version']}")
        else:
            self.print_warning("Versão não encontrada")
            
        # Verificar dependências críticas
        critical_deps = ['@capacitor/android', '@capacitor/core', 'firebase']
        if 'dependencies' in package:
            for dep in critical_deps:
                if dep in package['dependencies']:
                    self.print_success(f"{dep}: {package['dependencies'][dep]}")
                else:
                    self.print_warning(f"{dep} não encontrado nas dependências")
                    
    def check_android_resources(self):
        """Verifica recursos Android (ícones, etc)"""
        self.print_header("6. Verificando Recursos Android")
        
        res_path = self.project_root / "android" / "app" / "src" / "main" / "res"
        
        # Verificar ícones
        icon_sizes = ['mipmap-hdpi', 'mipmap-mdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi']
        icons_found = 0
        
        for size in icon_sizes:
            icon_path = res_path / size / "ic_launcher.png"
            if icon_path.exists():
                icons_found += 1
                
        if icons_found == len(icon_sizes):
            self.print_success(f"Todos os ícones encontrados ({icons_found}/{len(icon_sizes)})")
        elif icons_found > 0:
            self.print_warning(f"Alguns ícones faltando ({icons_found}/{len(icon_sizes)})")
        else:
            self.print_error("Nenhum ícone encontrado - use Android Studio Image Asset")
            
    def check_firebase_config(self):
        """Verifica configuração do Firebase"""
        self.print_header("7. Verificando Firebase")
        
        # Verificar google-services.json
        google_services_path = self.project_root / "android" / "app" / "google-services.json"
        
        if self.check_file_exists(google_services_path, "google-services.json"):
            with open(google_services_path, 'r', encoding='utf-8') as f:
                try:
                    config = json.load(f)
                    
                    # Verificar package_name
                    if 'client' in config and len(config['client']) > 0:
                        package_name = config['client'][0].get('client_info', {}).get('android_client_info', {}).get('package_name')
                        if package_name == 'com.horamed.app':
                            self.print_success(f"Package name correto: {package_name}")
                        else:
                            self.print_warning(f"Package name: {package_name} (esperado: com.horamed.app)")
                except json.JSONDecodeError:
                    self.print_error("google-services.json inválido (JSON mal formatado)")
        else:
            self.print_warning("google-services.json não encontrado - Push Notifications podem não funcionar")
            
    def print_summary(self):
        """Imprime resumo final"""
        self.print_header("📊 RESUMO DA VERIFICAÇÃO")
        
        total = len(self.passed) + len(self.warnings) + len(self.errors)
        
        print(f"{Colors.GREEN}✅ Passou: {len(self.passed)}{Colors.END}")
        print(f"{Colors.YELLOW}⚠️  Avisos: {len(self.warnings)}{Colors.END}")
        print(f"{Colors.RED}❌ Erros: {len(self.errors)}{Colors.END}")
        print(f"\n{Colors.BOLD}Total de verificações: {total}{Colors.END}\n")
        
        if self.errors:
            print(f"{Colors.RED}{Colors.BOLD}🚨 ERROS CRÍTICOS - CORRIJA ANTES DE PUBLICAR:{Colors.END}")
            for i, error in enumerate(self.errors, 1):
                print(f"{Colors.RED}   {i}. {error}{Colors.END}")
            print()
            
        if self.warnings:
            print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  AVISOS - RECOMENDADO CORRIGIR:{Colors.END}")
            for i, warning in enumerate(self.warnings, 1):
                print(f"{Colors.YELLOW}   {i}. {warning}{Colors.END}")
            print()
            
        # Status final
        if not self.errors and not self.warnings:
            print(f"{Colors.GREEN}{Colors.BOLD}🎉 TUDO PRONTO PARA PUBLICAÇÃO!{Colors.END}\n")
            return 0
        elif not self.errors:
            print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  PRONTO COM RESSALVAS - Revise os avisos{Colors.END}\n")
            return 0
        else:
            print(f"{Colors.RED}{Colors.BOLD}❌ NÃO PRONTO - Corrija os erros críticos{Colors.END}\n")
            return 1
            
    def run_all_checks(self):
        """Executa todas as verificações"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("╔════════════════════════════════════════════════════════════╗")
        print("║   🔍 VERIFICAÇÃO PRÉ-PUBLICAÇÃO - GOOGLE PLAY STORE       ║")
        print("║   HoraMed - Versão 1.0.5                                   ║")
        print("╚════════════════════════════════════════════════════════════╝")
        print(f"{Colors.END}\n")
        
        self.check_capacitor_config()
        self.check_build_gradle()
        self.check_keystore()
        self.check_build_output()
        self.check_package_json()
        self.check_android_resources()
        self.check_firebase_config()
        
        return self.print_summary()

def main():
    checker = PlayStoreChecker()
    exit_code = checker.run_all_checks()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
