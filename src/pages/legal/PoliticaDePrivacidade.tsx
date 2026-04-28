import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 border-b border-blue-100 dark:border-blue-900 pb-1">
      {title}
    </h2>
    {children}
  </div>
);

const Sub: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
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

const PoliticaDePrivacidade: React.FC = () => {
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
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Política de Privacidade
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
          Esta Política de Privacidade descreve como o HoraMed coleta, usa, armazena e protege as suas
          informações pessoais, incluindo dados de saúde classificados como dados sensíveis pela Lei Geral
          de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018). Ao utilizar o aplicativo, você
          concorda com os termos aqui descritos.
        </P>
        <P>
          <em>Este documento não substitui assessoria jurídica especializada. Se tiver dúvidas, consulte um profissional.</em>
        </P>

        <Section title="1. Quem Somos">
          <P>O HoraMed é um aplicativo de gerenciamento de saúde pessoal desenvolvido e operado por:</P>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p><strong>Controlador:</strong> Luis Eduardo Paim Longhi</p>
            <p><strong>Registro:</strong> Pessoa Física — CNPJ a ser inserido após abertura de empresa</p>
            <p><strong>E-mail do Encarregado (DPO):</strong> suporte@horamed.net</p>
            <p><strong>Endereço:</strong> São Luís, Maranhão — Brasil</p>
          </div>
        </Section>

        <Section title="2. Dados que Coletamos">
          <Sub title="2.1 Dados fornecidos diretamente por você">
            <Ul items={[
              'Nome completo e data de nascimento',
              'Endereço de e-mail e senha (para criação de conta)',
              'Perfis de saúde de terceiros que você cadastra (ex: familiares sob seus cuidados)',
              'Medicamentos, vitaminas e suplementos cadastrados, incluindo nome, dosagem, frequência e horários',
              'Registro de doses tomadas, puladas ou perdidas',
              'Sinais vitais (pressão arterial, glicemia, frequência cardíaca)',
              'Peso corporal e histórico de medições',
              'Registros de sintomas e efeitos colaterais',
              'Histórico de vacinação',
              'Documentos de saúde armazenados no módulo Cofre (laudos, receitas, exames)',
              'Consultas médicas e compromissos de saúde agendados',
            ]} />
          </Sub>
          <Sub title="2.2 Dados coletados automaticamente">
            <Ul items={[
              'Informações do dispositivo (modelo, sistema operacional, versão do app)',
              'Dados de uso e interação com as funcionalidades do aplicativo',
              'Tokens de notificação push para envio de lembretes',
              'Dados de autenticação via Google Sign-In (quando utilizado)',
            ]} />
          </Sub>
          <Sub title="2.3 Dados que NÃO coletamos">
            <Ul items={[
              'Não coletamos dados de localização GPS',
              'Não acessamos sua câmera sem sua ação explícita',
              'Não coletamos dados financeiros ou de cartão de crédito diretamente',
              'Não vendemos, alugamos nem compartilhamos seus dados para fins publicitários',
            ]} />
          </Sub>
        </Section>

        <Section title="3. Dados Sensíveis de Saúde">
          <P>
            Os dados relacionados à saúde (medicamentos, diagnósticos, exames, sinais vitais, vacinação e
            similares) são classificados como <strong>DADOS SENSÍVEIS</strong> nos termos do artigo 5º,
            inciso II, e do artigo 11 da LGPD.
          </P>
          <P>
            O tratamento desses dados é realizado exclusivamente com base no seu <strong>CONSENTIMENTO
            EXPRESSO E ESPECÍFICO</strong> (Art. 11, inciso I, LGPD), obtido no momento do cadastro e
            renovável a qualquer momento.
          </P>
          <P>
            Esses dados são tratados de forma confidencial, criptografados em trânsito e em repouso, e
            nunca são compartilhados com terceiros sem sua autorização explícita, exceto nas hipóteses
            legais previstas na LGPD.
          </P>
        </Section>

        <Section title="4. Como Usamos Seus Dados">
          <P>Usamos suas informações exclusivamente para:</P>
          <Ul items={[
            'Fornecer e operar as funcionalidades do HoraMed (lembretes de medicamentos, histórico, relatórios)',
            'Enviar notificações push com lembretes de doses nos horários cadastrados por você',
            'Gerar relatórios e análises de aderência ao tratamento para seu uso pessoal',
            'Permitir o gerenciamento de perfis de saúde de dependentes',
            'Melhorar a experiência do usuário com base em padrões de uso anonimizados',
            'Cumprir obrigações legais e regulatórias',
          ]} />
          <P>
            Não utilizamos seus dados para fins de publicidade comportamental, scoring de crédito ou
            qualquer finalidade que não seja diretamente relacionada à prestação do serviço.
          </P>
        </Section>

        <Section title="5. Armazenamento e Segurança">
          <P>
            Seus dados são armazenados nos servidores do Google Firebase (Firebase Firestore e Firebase
            Storage), com certificação SOC 2, ISO 27001 e conformidade com GDPR. Os dados são criptografados
            em trânsito (TLS 1.2+) e em repouso (AES-256).
          </P>
          <Ul items={[
            'Autenticação com senha segura e/ou autenticação via Google',
            'Controles de acesso por regras de segurança no Firestore (Security Rules)',
            'Módulo Cofre com camada adicional de proteção para documentos sensíveis',
            'Monitoramento de atividade suspeita',
          ]} />
          <P>
            Em caso de incidente de segurança, comunicaremos à ANPD e a você dentro do prazo legal de
            72 horas, conforme Art. 48 da LGPD.
          </P>
        </Section>

        <Section title="6. Compartilhamento com Terceiros">
          <P>Seus dados podem ser processados pelos seguintes fornecedores, estritamente necessários para o funcionamento do app:</P>
          <Ul items={[
            'Google Firebase (autenticação, banco de dados, armazenamento, notificações) — firebase.google.com/support/privacy',
            'Google Play Services (distribuição Android)',
            'Apple App Store (distribuição iOS, quando aplicável)',
            'Google AdMob (anúncios não personalizados, se aplicável na versão gratuita)',
          ]} />
          <P>
            Todos os fornecedores são contratualmente obrigados a proteger seus dados. Podemos compartilhar
            dados quando exigido por lei, ordem judicial ou autoridade competente.
          </P>
        </Section>

        <Section title="7. Seus Direitos como Titular (LGPD — Art. 18)">
          <P>Você pode exercer os seguintes direitos a qualquer momento pelo e-mail do Encarregado:</P>
          <Ul items={[
            'Confirmação: saber se tratamos seus dados',
            'Acesso: obter cópia dos dados que temos sobre você',
            'Correção: atualizar dados incompletos, inexatos ou desatualizados',
            'Anonimização, bloqueio ou eliminação: de dados desnecessários',
            'Portabilidade: exportar seus dados em formato estruturado',
            'Revogação do consentimento: a qualquer momento',
            'Eliminação: exclusão de todos os seus dados pessoais, incluindo conta e histórico',
            'Reclamação: direito de peticionar à ANPD (www.gov.br/anpd)',
          ]} />
          <P>O prazo para resposta é de até 15 dias úteis após a solicitação.</P>
        </Section>

        <Section title="8. Retenção e Exclusão de Dados">
          <P>
            Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar a exclusão, seus dados
            pessoais e de saúde serão removidos permanentemente em até 30 dias, exceto quando houver
            obrigação legal de retenção.
          </P>
          <P>
            Dados anonimizados e estatísticos, que não permitem identificação individual, podem ser
            mantidos por prazo indeterminado para fins de melhoria do serviço.
          </P>
        </Section>

        <Section title="9. Crianças e Adolescentes">
          <P>
            O HoraMed não é direcionado a menores de 18 anos como titulares primários de conta. O cadastro
            de perfis de dependentes menores de idade é permitido exclusivamente sob responsabilidade de
            um responsável legal adulto.
          </P>
        </Section>

        <Section title="10. Cookies e Tecnologias Semelhantes">
          <P>
            A versão web do HoraMed (horamed.net) utiliza cookies estritamente necessários para autenticação
            e funcionamento do serviço. Não utilizamos cookies de rastreamento ou publicidade comportamental.
          </P>
        </Section>

        <Section title="11. Alterações nesta Política">
          <P>
            Podemos atualizar esta Política periodicamente. Em caso de alterações materiais, você será
            notificado por e-mail ou aviso no aplicativo com antecedência mínima de 15 dias.
          </P>
        </Section>

        <Section title="12. Contato e Encarregado de Dados (DPO)">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p><strong>E-mail:</strong> suporte@horamed.net</p>
            <p><strong>Tempo de resposta:</strong> Até 15 dias úteis</p>
          </div>
          <P>
            Caso não obtenha resposta satisfatória, você pode recorrer à Autoridade Nacional de Proteção
            de Dados (ANPD): <strong>www.gov.br/anpd</strong>
          </P>
        </Section>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            HoraMed — Cuidando da sua saúde com privacidade e respeito.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDePrivacidade;

