import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 border-b border-blue-100 dark:border-blue-900 pb-1">
      {title}
    </h2>
    {children}
  </div>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{children}</p>
);

const Ul: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1 mb-3">
    {items.map((item, i) => (
      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item}</li>
    ))}
  </ul>
);

const TermosDeUso: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Termos de Uso
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Meta */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Versão 1.0 — Vigência a partir de: 01/05/2026</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Última atualização: Abril de 2026</p>
        </div>

        <P>
          Ao instalar, acessar ou utilizar o HoraMed, você declara ter lido, compreendido e concordado
          com estes Termos de Uso. Se não concordar com qualquer disposição, não utilize o aplicativo.
        </P>

        <Section title="1. Descrição do Serviço">
          <P>O HoraMed é um aplicativo de gerenciamento de saúde pessoal que oferece:</P>
          <Ul items={[
            'Cadastro e controle de medicamentos, vitaminas e suplementos',
            'Lembretes e notificações de doses nos horários definidos pelo usuário',
            'Histórico de aderência ao tratamento',
            'Registro de sinais vitais, peso e sintomas',
            'Gerenciamento de vacinas e consultas médicas',
            'Armazenamento seguro de documentos de saúde (Cofre)',
            'Relatórios e análises de saúde pessoal',
            'Gerenciamento de perfis de dependentes',
          ]} />
        </Section>

        <Section title="2. Aviso Médico Importante">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-3">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 text-center">
              ⚠️ O HORAMED NÃO É UM DISPOSITIVO MÉDICO, NÃO FORNECE DIAGNÓSTICOS E NÃO SUBSTITUI A
              ORIENTAÇÃO DE PROFISSIONAL DE SAÚDE HABILITADO.
            </p>
          </div>
          <P>
            O HoraMed é uma ferramenta de organização pessoal. Todas as decisões sobre medicamentos,
            tratamentos, doses e saúde devem ser tomadas em conjunto com seu médico, farmacêutico ou
            outro profissional de saúde qualificado.
          </P>
          <P>
            Em caso de emergência médica, ligue imediatamente para o <strong>SAMU (192)</strong> ou
            acesse a UPA ou pronto-socorro mais próximo.
          </P>
        </Section>

        <Section title="3. Cadastro e Conta de Usuário">
          <P>
            Para utilizar o HoraMed, você deve criar uma conta fornecendo informações verdadeiras,
            completas e atualizadas. Você é responsável por:
          </P>
          <Ul items={[
            'Manter a confidencialidade de suas credenciais de acesso',
            'Todas as atividades realizadas em sua conta',
            'Notificar imediatamente o HoraMed em caso de acesso não autorizado',
          ]} />
          <P>
            É proibido criar contas com dados falsos, utilizar o aplicativo em nome de terceiros sem
            autorização, ou compartilhar sua conta com outras pessoas.
          </P>
        </Section>

        <Section title="4. Planos e Pagamento">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">4.1 Plano Gratuito</h3>
            <P>
              O HoraMed oferece uma versão gratuita com funcionalidades básicas, que pode incluir
              exibição de anúncios. As funcionalidades disponíveis no plano gratuito podem ser alteradas
              mediante comunicação prévia.
            </P>
          </div>
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">4.2 Plano Premium (Assinatura)</h3>
            <P>
              O plano premium é comercializado via Google Play Billing (Android) ou App Store (iOS).
              As condições de pagamento, renovação automática e política de reembolso seguem as regras
              de cada plataforma. Não armazenamos dados de cartão de crédito — todas as transações são
              processadas pelas lojas de aplicativos.
            </P>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">4.3 Cancelamento</h3>
            <P>
              O cancelamento pode ser feito a qualquer momento pelas configurações da loja de aplicativos.
              O acesso ao plano premium permanece ativo até o final do período já pago.
            </P>
          </div>
        </Section>

        <Section title="5. Uso Permitido">
          <P>É expressamente proibido:</P>
          <Ul items={[
            'Utilizar o aplicativo para fins comerciais sem autorização prévia por escrito',
            'Realizar engenharia reversa, descompilar ou desmontar o aplicativo',
            'Tentar acessar sistemas, servidores ou bancos de dados sem autorização',
            'Transmitir vírus, malware ou qualquer código malicioso',
            'Publicar ou armazenar conteúdo ilegal ou que viole direitos de terceiros',
            'Utilizar o aplicativo de forma que sobrecarregue ou prejudique sua infraestrutura',
            'Coletar dados de outros usuários sem consentimento',
          ]} />
        </Section>

        <Section title="6. Propriedade Intelectual">
          <P>
            Todo o conteúdo do HoraMed — código-fonte, design, logotipo, textos, imagens, ícones e
            funcionalidades — é protegido por direitos autorais e demais leis de propriedade intelectual.
            Nenhuma parte pode ser reproduzida sem autorização prévia e por escrito do titular.
          </P>
          <P>
            Os dados inseridos por você permanecem de sua propriedade. Ao utilizar o HoraMed, você
            concede uma licença limitada, não exclusiva e revogável para armazenar e processar essas
            informações com a finalidade de prestar o serviço.
          </P>
        </Section>

        <Section title="7. Disponibilidade e Interrupções">
          <P>
            O HoraMed é oferecido na modalidade "como está" (as-is). Embora nos esforcemos para manter
            o serviço disponível 24/7, não garantimos disponibilidade ininterrupta. Manutenções,
            atualizações e falhas técnicas podem causar indisponibilidade temporária.
          </P>
        </Section>

        <Section title="8. Limitação de Responsabilidade">
          <P>Na máxima extensão permitida pela legislação brasileira, o HoraMed não se responsabiliza por:</P>
          <Ul items={[
            'Decisões de saúde tomadas com base nas informações exibidas no aplicativo',
            'Danos decorrentes de uso incorreto, negligente ou não autorizado',
            'Perda de dados causada por falha de dispositivo, desinstalação ou ação do usuário',
            'Danos indiretos, incidentais ou consequenciais de qualquer natureza',
            'Falhas de conectividade ou indisponibilidade de serviços de terceiros (ex: Firebase)',
          ]} />
          <P>
            A responsabilidade total do HoraMed fica limitada ao valor pago pelo usuário nos 12 meses
            anteriores ao evento, ou a <strong>R$ 100,00</strong> para usuários do plano gratuito.
          </P>
        </Section>

        <Section title="9. Privacidade">
          <P>
            O tratamento dos seus dados pessoais é regido pela nossa{' '}
            <button
              onClick={() => navigate('/politica-de-privacidade')}
              className="text-blue-600 dark:text-blue-400 underline font-medium"
            >
              Política de Privacidade
            </button>
            , parte integrante destes Termos. Ao aceitar estes Termos, você também aceita a Política
            de Privacidade.
          </P>
        </Section>

        <Section title="10. Alterações nos Termos">
          <P>
            Podemos modificar estes Termos a qualquer momento. Alterações materiais serão comunicadas
            com antecedência mínima de 15 dias por e-mail ou notificação no aplicativo. O uso continuado
            após as alterações constitui aceite dos novos termos.
          </P>
        </Section>

        <Section title="11. Rescisão">
          <P>
            Você pode encerrar sua conta a qualquer momento pelas configurações do aplicativo. O HoraMed
            pode suspender ou encerrar sua conta em caso de violação destes Termos, uso fraudulento ou
            atividade que coloque em risco a segurança de outros usuários.
          </P>
        </Section>

        <Section title="12. Lei Aplicável e Foro">
          <P>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
            da comarca de São Luís, Estado do Maranhão, com renúncia expressa a qualquer outro, por
            mais privilegiado que seja.
          </P>
          <P>
            Antes de qualquer demanda judicial, as partes se comprometem a buscar solução amigável no
            prazo de 30 dias.
          </P>
        </Section>

        <Section title="13. Contato">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p><strong>E-mail:</strong> suporte@horamed.net</p>
            <p><strong>Tempo de resposta:</strong> Até 5 dias úteis</p>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            Ao utilizar o HoraMed, você confirma que leu e concorda com estes Termos de Uso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;

