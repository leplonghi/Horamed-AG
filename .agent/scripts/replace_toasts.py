#!/usr/bin/env python3
"""
Script para substituir toast messages hardcoded por chaves de tradução
"""

import re
import sys
from pathlib import Path

# Mapeamento de mensagens hardcoded para chaves de tradução
TOAST_MAPPINGS = {
    # Subscription
    r'"Forma de pagamento atualizada com sucesso!"': 't("toast.subscription.paymentUpdated")',
    r'"Assinatura cancelada\. Você não será cobrado\."': 't("toast.subscription.canceledNoCharge")',
    r'"Assinatura será cancelada ao final do período atual\."': 't("toast.subscription.canceledEndPeriod")',
    r'"Erro ao cancelar assinatura\. Tente novamente\."': 't("toast.subscription.cancelError")',
    
    # Referral
    r'"Erro ao gerar link"': 't("toast.referral.linkError")',
    r'"Digite um código de indicação"': 't("toast.referral.codeRequired")',
    r'"Para aplicar o código, você precisa criar uma nova conta ou entrar com o código aplicado\."': 't("toast.referral.createAccountInfo")',
    r"'Código de indicação não disponível'": 't("toast.referral.codeNotAvailable")',
    r"'Código copiado!'": 't("toast.referral.codeCopied")',
    r"'Compartilhado com sucesso!'": 't("toast.referral.sharedSuccess")',
    
    # Profile
    r'"Erro ao criar perfil\. Tente novamente\."': 't("toast.profile.createError")',
    
    # Pharmacy
    r'"Digite o nome do medicamento"': 't("toast.pharmacy.nameRequired")',
    r'"Preços encontrados!"': 't("toast.pharmacy.pricesFound")',
    r'"Erro ao buscar preços"': 't("toast.pharmacy.pricesError")',
    
    # Notifications
    r'"Configure as permissões de notificação para receber alertas"': 't("toast.notifications.configurePermissions")',
    r'"Configure as notificações push para alertas mesmo com app fechado"': 't("toast.notifications.configurePush")',
    r'"Notificações push ativadas!"': 't("toast.notifications.pushEnabled")',
    r'"Permissão negada\. Ative nas configurações do dispositivo\."': 't("toast.notifications.permissionDenied")',
    r'"Notificações web ativadas!"': 't("toast.notifications.webEnabled")',
    r'"Erro ao ativar notificações push"': 't("toast.notifications.pushError")',
    r'"Configurações salvas! Notificações agendadas para as próximas 24 horas\."': 't("toast.notifications.settingsSaved")',
    r'"Erro ao salvar configurações"': 't("toast.notifications.settingsError")',
    
    # Medical
    r'"Esta funcionalidade é exclusiva para usuários Premium"': 't("toast.medical.premiumOnly")',
    r'"Usuário não autenticado"': 't("toast.medical.notAuthenticated")',
    r'"PDF gerado com sucesso!"': 't("toast.medical.pdfGenerated")',
    r'"Erro ao gerar PDF"': 't("toast.medical.pdfError")',
    r'"Erro ao carregar consultas"': 't("toast.medical.appointmentsError")',
    r'"Consulta agendada com sucesso!"': 't("toast.medical.appointmentScheduled")',
    r'"Erro ao agendar consulta"': 't("toast.medical.appointmentError")',
    r'"Erro ao atualizar status"': 't("toast.medical.statusError")',
    
    # Health
    r'"Erro ao carregar histórico"': 't("toast.health.timelineError")',
    r'"Erro ao carregar dados"': 't("toast.health.dashboardError")',
    r"'Erro ao carregar análises'": 't("toast.health.analysisError")',
    r"'Não há dados suficientes para análise ainda\. Continue registrando suas doses!'": 't("toast.health.insufficientData")',
    
    # Documents
    r"'Arquivo muito grande\. Máximo 10MB'": 't("toast.document.fileTooLarge")',
    r"'Selecione um arquivo primeiro'": 't("toast.document.selectFile")',
    r"'Documento processado com sucesso!'": 't("toast.document.processedSuccess")',
    
    # Medication
    r'"Dados extraídos com sucesso!"': 't("toast.medication.dataExtracted")',
    r'"Não foi possível extrair os dados\. Tente novamente\."': 't("toast.medication.extractionFailed")',
    r'"Erro ao processar imagem"': 't("toast.medication.imageError")',
    r'"Preencha o nome e a dose"': 't("toast.medication.fillNameDose")',
    r'"Item adicionado com sucesso!"': 't("toast.medication.addedSuccess")',
    r'"Erro ao salvar item"': 't("toast.medication.saveError")',
    r'"Digite o nome do item"': 't("toast.medication.enterName")',
    r'"Adicione pelo menos um horário para cada agendamento"': 't("toast.medication.addSchedule")',
}

def replace_toasts_in_file(file_path: Path) -> bool:
    """Replace hardcoded toast messages with translation keys"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Replace each mapping
        for pattern, replacement in TOAST_MAPPINGS.items():
            content = re.sub(pattern, replacement, content)
        
        # Only write if changes were made
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            print(f"✅ Updated: {file_path}")
            return True
        else:
            print(f"⏭️  No changes: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python replace_toasts.py <file_or_directory>")
        sys.exit(1)
    
    target = Path(sys.argv[1])
    
    if not target.exists():
        print(f"❌ Path does not exist: {target}")
        sys.exit(1)
    
    files_to_process = []
    
    if target.is_file():
        files_to_process = [target]
    else:
        # Find all .tsx and .ts files
        files_to_process = list(target.rglob("*.tsx")) + list(target.rglob("*.ts"))
    
    print(f"🔍 Found {len(files_to_process)} files to process\n")
    
    updated_count = 0
    for file_path in files_to_process:
        if replace_toasts_in_file(file_path):
            updated_count += 1
    
    print(f"\n✨ Done! Updated {updated_count} files.")

if __name__ == "__main__":
    main()
