import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Separator } from "@/components/ui/separator";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <>
      <div className="min-h-screen bg-background p-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Termos e LGPD</h2>
              <p className="text-muted-foreground">Informações legais e privacidade</p>
            </div>
          </div>

          {/* LGPD Section */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Conformidade com LGPD</h3>
            </div>
            
            <div className="space-y-3 text-sm text-foreground">
              <p>
                O HoraMed está em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
              
              <div>
                <h4 className="font-semibold mb-2">Seus Direitos:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Acesso:</strong> Visualizar todos os dados que coletamos sobre você</li>
                  <li><strong>Correção:</strong> Atualizar dados incorretos ou desatualizados</li>
                  <li><strong>Portabilidade:</strong> Exportar seus dados em formato JSON</li>
                  <li><strong>Exclusão:</strong> Deletar permanentemente sua conta e todos os dados</li>
                  <li><strong>Revogação:</strong> Revogar consentimentos a qualquer momento</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Dados Coletados:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Informações de cadastro (nome, e-mail)</li>
                  <li>Informações de saúde (medicamentos, exames, consultas)</li>
                  <li>Histórico de uso do aplicativo</li>
                  <li>Preferências de notificações e configurações</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Uso dos Dados:</h4>
                <p>Utilizamos seus dados exclusivamente para:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Fornecer lembretes de medicamentos</li>
                  <li>Gerar relatórios de adesão ao tratamento</li>
                  <li>Organizar seu histórico de saúde</li>
                  <li>Melhorar a experiência do usuário</li>
                </ul>
              </div>

              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="font-semibold">Garantias de Segurança:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Criptografia de dados sensíveis</li>
                  <li>Armazenamento seguro em servidores protegidos</li>
                  <li>Acesso restrito apenas ao titular dos dados</li>
                  <li>Nunca compartilhamos dados com terceiros</li>
                </ul>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Terms of Use */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Termos de Uso</h3>
            </div>
            
            <div className="space-y-3 text-sm text-foreground">
              <div>
                <h4 className="font-semibold mb-2">1. Aceitação dos Termos</h4>
                <p>
                  Ao usar o HoraMed, você concorda com estes termos. Se não concordar, 
                  não utilize o aplicativo.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Objetivo do Aplicativo</h4>
                <p>
                  O HoraMed é uma ferramenta de <strong>organização e lembretes</strong> para 
                  medicamentos e consultas médicas. Não é um dispositivo médico nem substitui 
                  orientação profissional.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Responsabilidades do Usuário</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Inserir informações corretas sobre medicamentos</li>
                  <li>Seguir prescrições médicas rigorosamente</li>
                  <li>Manter credenciais de acesso em segurança</li>
                  <li>Consultar profissionais de saúde para decisões médicas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Uso Aceitável</h4>
                <p>Você se compromete a:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Usar o app apenas para fins pessoais e legítimos</li>
                  <li>Não violar direitos de terceiros</li>
                  <li>Não tentar acessar áreas restritas do sistema</li>
                  <li>Não usar o app para fins ilegais</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Disclaimer */}
          <Card className="p-6 bg-warning/10 border-warning/20 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-foreground">Aviso Legal Importante</h3>
            </div>
            
            <div className="space-y-2 text-sm text-foreground">
              <p>
                <strong>Limitação de Responsabilidade:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>O HoraMed não se responsabiliza por decisões de saúde baseadas no app</li>
                <li>Não garantimos que notificações sempre funcionarão perfeitamente</li>
                <li>Falhas técnicas podem ocorrer - mantenha métodos alternativos de lembrete</li>
                <li>Erros de digitação são de responsabilidade do usuário</li>
                <li>Não nos responsabilizamos por interações medicamentosas</li>
              </ul>
              
              <p className="font-semibold mt-3 text-warning">
                ⚠️ SEMPRE consulte um profissional de saúde antes de tomar decisões sobre 
                seu tratamento médico.
              </p>
            </div>
          </Card>

          {/* Contact */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground">
              <strong>Dúvidas sobre LGPD ou Termos?</strong><br />
              Entre em contato: <a href="mailto:appmedhora@gmail.com" className="text-primary hover:underline">appmedhora@gmail.com</a>
            </p>
          </Card>
        </div>
      </div>
      <Navigation />
    </>
  );
}
