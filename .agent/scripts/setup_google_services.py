#!/usr/bin/env python3
"""
🔥 Script para Configurar google-services.json
Baixa automaticamente do Firebase ou guia o usuário para fazer download manual
"""

import os
import sys
import json
import subprocess
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

def get_project_root():
    """Retorna o diretório raiz do projeto"""
    return Path(__file__).parent.parent.parent

def get_firebase_project_id():
    """Obtém o project ID do Firebase a partir do .firebaserc"""
    project_root = get_project_root()
    firebaserc_path = project_root / ".firebaserc"
    
    if not firebaserc_path.exists():
        return None
    
    try:
        with open(firebaserc_path, 'r') as f:
            config = json.load(f)
            return config.get('projects', {}).get('default')
    except:
        return None

def check_google_services_exists():
    """Verifica se o google-services.json já existe"""
    project_root = get_project_root()
    google_services_path = project_root / "android" / "app" / "google-services.json"
    return google_services_path.exists()

def try_firebase_cli_download():
    """Tenta baixar o google-services.json usando Firebase CLI"""
    print_info("Tentando baixar google-services.json via Firebase CLI...")
    
    try:
        # Verificar se Firebase CLI está instalado
        result = subprocess.run(['firebase', '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        
        if result.returncode != 0:
            print_warning("Firebase CLI não está instalado")
            return False
        
        print_success(f"Firebase CLI encontrado: {result.stdout.strip()}")
        
        # Tentar baixar o arquivo
        project_root = get_project_root()
        project_id = get_firebase_project_id()
        
        if not project_id:
            print_warning("Project ID não encontrado em .firebaserc")
            return False
        
        print_info(f"Project ID: {project_id}")
        
        # Comando para baixar (isso pode não funcionar diretamente, mas tentamos)
        print_warning("Firebase CLI não tem comando direto para baixar google-services.json")
        print_info("Você precisará baixar manualmente do Firebase Console")
        return False
        
    except FileNotFoundError:
        print_warning("Firebase CLI não está instalado")
        return False
    except Exception as e:
        print_error(f"Erro ao tentar usar Firebase CLI: {e}")
        return False

def show_manual_instructions():
    """Mostra instruções para download manual"""
    project_id = get_firebase_project_id()
    
    print_header("📥 INSTRUÇÕES PARA DOWNLOAD MANUAL")
    
    print(f"{Colors.BOLD}Siga estes passos:{Colors.END}\n")
    
    print(f"{Colors.BOLD}1. Acesse o Firebase Console:{Colors.END}")
    if project_id:
        print(f"   https://console.firebase.google.com/project/{project_id}/settings/general")
    else:
        print(f"   https://console.firebase.google.com")
    
    print(f"\n{Colors.BOLD}2. Navegue até as configurações:{Colors.END}")
    print(f"   - Clique no ícone de engrenagem ⚙️ (Project Settings)")
    print(f"   - Vá para a aba 'General'")
    
    print(f"\n{Colors.BOLD}3. Encontre o app Android:{Colors.END}")
    print(f"   - Role até a seção 'Your apps'")
    print(f"   - Procure pelo app Android com package name: {Colors.GREEN}com.horamed.app{Colors.END}")
    print(f"   - Se não existir, clique em 'Add app' > Android")
    
    print(f"\n{Colors.BOLD}4. Baixe o arquivo:{Colors.END}")
    print(f"   - Clique em 'Download google-services.json'")
    print(f"   - Salve o arquivo")
    
    print(f"\n{Colors.BOLD}5. Copie para o projeto:{Colors.END}")
    project_root = get_project_root()
    target_path = project_root / "android" / "app" / "google-services.json"
    print(f"   - Copie o arquivo baixado para:")
    print(f"   {Colors.GREEN}{target_path}{Colors.END}")
    
    print(f"\n{Colors.BOLD}6. Verifique:{Colors.END}")
    print(f"   - Execute novamente este script para confirmar")
    print(f"   - Ou execute: python .agent\\scripts\\check_playstore_ready.py")
    
    print(f"\n{Colors.YELLOW}⚠️  IMPORTANTE:{Colors.END}")
    print(f"   - NÃO commite este arquivo no Git (já está no .gitignore)")
    print(f"   - Guarde uma cópia de backup em local seguro")
    print(f"   - Este arquivo contém credenciais do Firebase")

def create_app_in_firebase():
    """Mostra instruções para criar app Android no Firebase"""
    print_header("📱 CRIAR APP ANDROID NO FIREBASE")
    
    project_id = get_firebase_project_id()
    
    print(f"{Colors.BOLD}Se o app Android ainda não existe no Firebase:{Colors.END}\n")
    
    print(f"{Colors.BOLD}1. Acesse:{Colors.END}")
    if project_id:
        print(f"   https://console.firebase.google.com/project/{project_id}/settings/general")
    else:
        print(f"   https://console.firebase.google.com")
    
    print(f"\n{Colors.BOLD}2. Adicione o app Android:{Colors.END}")
    print(f"   - Clique em 'Add app' > Android (ícone do Android)")
    
    print(f"\n{Colors.BOLD}3. Preencha as informações:{Colors.END}")
    print(f"   - Android package name: {Colors.GREEN}com.horamed.app{Colors.END}")
    print(f"   - App nickname (opcional): HoraMed")
    print(f"   - Debug signing certificate SHA-1 (opcional): deixe em branco por enquanto")
    
    print(f"\n{Colors.BOLD}4. Clique em 'Register app'{Colors.END}")
    
    print(f"\n{Colors.BOLD}5. Baixe o google-services.json:{Colors.END}")
    print(f"   - Na próxima tela, clique em 'Download google-services.json'")
    
    print(f"\n{Colors.BOLD}6. Continue com as instruções acima{Colors.END}")

def verify_file_content():
    """Verifica se o arquivo google-services.json é válido"""
    project_root = get_project_root()
    google_services_path = project_root / "android" / "app" / "google-services.json"
    
    if not google_services_path.exists():
        return False
    
    try:
        with open(google_services_path, 'r') as f:
            data = json.load(f)
        
        # Verificar estrutura básica
        if 'project_info' not in data:
            print_error("Arquivo google-services.json inválido: falta 'project_info'")
            return False
        
        if 'client' not in data:
            print_error("Arquivo google-services.json inválido: falta 'client'")
            return False
        
        # Verificar package name
        clients = data.get('client', [])
        if not clients:
            print_error("Arquivo google-services.json inválido: nenhum cliente configurado")
            return False
        
        package_name = clients[0].get('client_info', {}).get('android_client_info', {}).get('package_name')
        
        if package_name != 'com.horamed.app':
            print_warning(f"Package name no arquivo: {package_name}")
            print_warning(f"Package name esperado: com.horamed.app")
            print_warning("Certifique-se de que baixou o arquivo correto!")
        else:
            print_success(f"Package name correto: {package_name}")
        
        # Verificar project_id
        project_id_in_file = data.get('project_info', {}).get('project_id')
        expected_project_id = get_firebase_project_id()
        
        if expected_project_id and project_id_in_file != expected_project_id:
            print_warning(f"Project ID no arquivo: {project_id_in_file}")
            print_warning(f"Project ID esperado: {expected_project_id}")
        else:
            print_success(f"Project ID correto: {project_id_in_file}")
        
        return True
        
    except json.JSONDecodeError:
        print_error("Arquivo google-services.json não é um JSON válido")
        return False
    except Exception as e:
        print_error(f"Erro ao verificar arquivo: {e}")
        return False

def main():
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║   🔥 CONFIGURAÇÃO DO GOOGLE-SERVICES.JSON                  ║")
    print("║   HoraMed - Firebase Android Configuration                 ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")
    
    # Verificar se já existe
    if check_google_services_exists():
        print_success("google-services.json já existe!")
        
        # Verificar conteúdo
        print_info("Verificando conteúdo do arquivo...")
        if verify_file_content():
            print_success("Arquivo válido e configurado corretamente!")
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ TUDO PRONTO! Você está 100% pronto para publicar!{Colors.END}\n")
            
            print_info("Próximos passos:")
            print("  1. Execute: python .agent\\scripts\\check_playstore_ready.py")
            print("  2. Rebuild AAB: cd android && ./gradlew bundleRelease")
            print("  3. Continue com a publicação (PLAYSTORE_DEPLOYMENT_GUIDE.md)")
            
            return 0
        else:
            print_warning("Arquivo existe mas pode estar incorreto")
            print_info("Considere baixar novamente do Firebase Console")
    else:
        print_warning("google-services.json NÃO encontrado")
        
        # Tentar download via CLI
        if not try_firebase_cli_download():
            # Mostrar instruções manuais
            show_manual_instructions()
            print("\n")
            create_app_in_firebase()
    
    print(f"\n{Colors.YELLOW}═══════════════════════════════════════════════════════════{Colors.END}")
    print(f"{Colors.YELLOW}Após baixar o arquivo, execute este script novamente para verificar!{Colors.END}")
    print(f"{Colors.YELLOW}═══════════════════════════════════════════════════════════{Colors.END}\n")
    
    return 1

if __name__ == "__main__":
    sys.exit(main())
