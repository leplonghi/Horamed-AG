#!/usr/bin/env python3
"""
Script de Verificação da Integração Stripe
Verifica se todas as configurações do Stripe estão corretas
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """Verifica se o arquivo .env existe e contém as chaves necessárias"""
    print("🔍 Verificando arquivo .env...")
    
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ Arquivo .env não encontrado!")
        return False
    
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    required_keys = [
        "VITE_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_SECRET_KEY"
    ]
    
    missing_keys = []
    exposed_keys = []
    
    for key in required_keys:
        if key not in content:
            missing_keys.append(key)
        else:
            # Verificar se ainda contém as chaves expostas
            if "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" in content:
                exposed_keys.append("VITE_STRIPE_PUBLISHABLE_KEY (AINDA EXPOSTA!)")
            if "mk_1SYEeDHh4P8HSV4Y0xTYpHqg" in content:
                exposed_keys.append("STRIPE_SECRET_KEY (AINDA EXPOSTA!)")
    
    if missing_keys:
        print(f"❌ Chaves faltando: {', '.join(missing_keys)}")
        return False
    
    if exposed_keys:
        print(f"⚠️  CHAVES EXPOSTAS AINDA PRESENTES: {', '.join(exposed_keys)}")
        print("   Por favor, revogue essas chaves e substitua por novas!")
        return False
    
    print("✅ Arquivo .env configurado corretamente")
    return True

def check_gitignore():
    """Verifica se .env está no .gitignore"""
    print("\n🔍 Verificando .gitignore...")
    
    gitignore_path = Path(".gitignore")
    if not gitignore_path.exists():
        print("⚠️  Arquivo .gitignore não encontrado!")
        return False
    
    with open(gitignore_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if ".env" in content:
        print("✅ .env está protegido no .gitignore")
        return True
    else:
        print("❌ .env NÃO está no .gitignore! Suas chaves podem ser commitadas!")
        return False

def check_stripe_functions():
    """Verifica se as Edge Functions do Stripe existem"""
    print("\n🔍 Verificando Edge Functions do Stripe...")
    
    functions_dir = Path("supabase/functions")
    if not functions_dir.exists():
        print("❌ Diretório supabase/functions não encontrado!")
        return False
    
    required_functions = [
        "stripe-webhook",
        "sync-subscription",
        "update-payment-method"
    ]
    
    missing_functions = []
    for func in required_functions:
        func_path = functions_dir / func / "index.ts"
        if not func_path.exists():
            missing_functions.append(func)
    
    if missing_functions:
        print(f"❌ Functions faltando: {', '.join(missing_functions)}")
        return False
    
    print("✅ Todas as Edge Functions do Stripe estão presentes")
    return True

def check_frontend_integration():
    """Verifica se o frontend está usando as variáveis do Stripe"""
    print("\n🔍 Verificando integração no frontend...")
    
    src_dir = Path("src")
    if not src_dir.exists():
        print("❌ Diretório src não encontrado!")
        return False
    
    # Procurar por uso de VITE_STRIPE_PUBLISHABLE_KEY ou chamadas ao backend
    found_usage = False
    for file_path in src_dir.rglob("*.tsx"):
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            if "VITE_STRIPE_PUBLISHABLE_KEY" in content:
                found_usage = True
                print(f"✅ Encontrado uso do Stripe (Client-side): {file_path}")
                break
            if "createCheckoutSession" in content:
                found_usage = True
                print(f"✅ Encontrado uso do Stripe (Server-side Checkout): {file_path}")
                break
    
    if not found_usage:
        print("⚠️  Não encontrado uso de VITE_STRIPE_PUBLISHABLE_KEY no frontend")
        print("   Você pode precisar integrar o Stripe no código React")
        return False
    
    return True

def print_next_steps():
    """Imprime os próximos passos"""
    print("\n" + "="*60)
    print("📋 PRÓXIMOS PASSOS")
    print("="*60)
    print("""
1. ✅ Revogar chaves expostas no Stripe Dashboard
   → https://dashboard.stripe.com/apikeys

2. ✅ Gerar novas chaves e atualizar .env

3. ✅ Configurar secrets no Supabase:
   → supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   → supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

4. ✅ Criar webhook no Stripe Dashboard:
   → https://dashboard.stripe.com/webhooks
   → URL: https://zmsuqdwleyqpdthaqvbi.supabase.co/functions/v1/stripe-webhook
   → Eventos: checkout.session.completed, invoice.payment_succeeded, etc.

5. ✅ Testar a integração:
   → Criar produtos/preços no Stripe
   → Testar fluxo de checkout
   → Verificar webhooks funcionando

6. ✅ Ativar 2FA no Stripe:
   → https://dashboard.stripe.com/settings/user
""")

def main():
    print("="*60)
    print("🔐 VERIFICAÇÃO DE SEGURANÇA - INTEGRAÇÃO STRIPE")
    print("="*60)
    
    checks = [
        check_env_file(),
        check_gitignore(),
        check_stripe_functions(),
        check_frontend_integration()
    ]
    
    print("\n" + "="*60)
    if all(checks):
        print("✅ TODAS AS VERIFICAÇÕES PASSARAM!")
        print("="*60)
        print("\n⚠️  LEMBRETE: Certifique-se de que você:")
        print("   1. Revogou as chaves expostas no Stripe")
        print("   2. Gerou novas chaves e atualizou o .env")
        print("   3. Configurou os secrets no Supabase")
        print("   4. Criou o webhook no Stripe Dashboard")
    else:
        print("❌ ALGUMAS VERIFICAÇÕES FALHARAM")
        print("="*60)
        print_next_steps()
        sys.exit(1)

if __name__ == "__main__":
    main()
