export interface PromoContent {
  id: string;
  category: "education" | "testimonial" | "viral" | "gamification" | "ad";
  title: string;
  description: string;
  platform: "veo" | "naobanana" | "text" | "script";
  content: string;
  tags: string[];
}

export const PROMPTS_LIBRARY: PromoContent[] = [
  // VEO 3.1 - EDUCATION
  {
    id: "ED-001",
    category: "education",
    title: "Mito vs Verdade: Remédio com Leite",
    description: "Vídeo educativo mostrando visualmente o erro de tomar remédio com leite.",
    platform: "veo",
    tags: ["veo", "educação", "mito"],
    content: `initial_frame:
  description: "Close-up de uma mão segurando um comprimido branco e um copo de leite sobre uma mesa de madeira clara. Iluminação natural suave vinda da esquerda. Foco no comprimido."
  composition: "Plano detalhe (extreme close-up), ângulo superior 45°"
  elements: "Comprimido, copo de leite, mesa de madeira, luz natural"

final_frame:
  description: "Mesmo enquadramento, mas o comprimido agora está ao lado de um copo de água cristalina. Um grande X vermelho animado aparece sobre o leite, e um check verde sobre a água."
  composition: "Mesmo ângulo, foco dividido entre leite (X) e água (✓)"
  elements: "Comprimido, leite (com X), água (com ✓), ícones animados"

motion:
  camera: "Câmera estática com leve zoom in (1.1x) nos primeiros 2s"
  subject: "Transição suave do leite para água (fade 1s), ícones aparecem com bounce effect"
  transition: "Fade cross-dissolve entre frames"
  duration: "15 segundos"

style:
  visual: "Realista com elementos gráficos modernos"
  color_palette: "Branco dominante, vermelho (X), verde (✓), azul água"
  mood: "Educativo, limpo, confiável"
  lighting: "Natural, soft diffused light, sombras suaves"`
  },
  {
    id: "ED-002",
    category: "education",
    title: "Como Funciona o Lembrete",
    description: "Demonstração visual da notificação push e interação do usuário.",
    platform: "veo",
    tags: ["veo", "tutorial", "feature"],
    content: `initial_frame:
  description: "Tela de smartphone (mockup) mostrando o app HoraMed com lista de medicamentos. Interface limpa, fundo branco, ícones coloridos. Mão segurando o celular em ambiente doméstico aconchegante."
  composition: "Plano médio, ângulo frontal levemente inclinado"
  elements: "Smartphone, interface HoraMed, mão, ambiente caseiro desfocado ao fundo"

final_frame:
  description: "Notificação push aparece na tela com animação de 'pop'. Texto: 'Hora do Losartana 50mg 💊'. Mão toca na notificação. Confetes digitais sutis celebram a ação."
  composition: "Close-up na notificação, mão em movimento"
  elements: "Notificação push, dedo tocando, confetes digitais, checkmark verde"

motion:
  camera: "Leve push in (zoom) de 1.0x para 1.3x ao longo do vídeo"
  subject: "Scroll suave na lista (2s) → notificação aparece com bounce (1s) → dedo toca (1s) → confetes (2s)"
  transition: "Smooth animation, 60fps"
  duration: "12 segundos"`
  },
  // NAOBANANA - ADS
  {
    id: "STATIC-001",
    category: "education",
    title: "Dica Diária: Horário Fixo",
    description: "Imagem estática minimalista para feed.",
    platform: "naobanana",
    tags: ["imagem", "instagram", "dica"],
    content: `subject: "Relógio minimalista mostrando 8:00, ao lado de copo d'água e comprimido. Vista superior (flat lay). Fundo azul oceano suave."
style: "Fotografia clean, minimalista, flat lay"
aspect_ratio: "1:1"
color_palette: "#4A90E2 (azul), #FFFFFF (branco), #F5F5F5 (cinza claro)"
mood: "Calmo, organizado, confiável"
text_overlay: "DICA DO DIA 💡"`
  },
  {
    id: "AD-001",
    category: "ad",
    title: "Lançamento Indique e Ganhe",
    description: "Vídeo 3D premium anunciando o programa de referral.",
    platform: "veo",
    tags: ["veo", "promoção", "3d"],
    content: `initial_frame:
  description: "Fundo gradiente azul oceano para roxo suave. Ícone de presente 🎁 gigante no centro (3D, dourado). Partículas brilhantes flutuando. Ambiente minimalista e premium."
  composition: "Plano geral, ícone centralizado, simetria perfeita"

final_frame:
  description: "Presente 'abre' com animação (tampa levita). De dentro saem 3 ícones flutuantes: '💰 Desconto', '🎟️ Meses Grátis', '👑 Acesso Vitalício'. Brilho intenso."
  composition: "Zoom in no presente aberto (1.4x), ícones orbitando"

motion:
  camera: "Leve rotação orbital (5° clockwise) + zoom in (1.0x → 1.4x)"
  subject: "Presente pulsa (0-2s) → abre com explosão suave (3s) → ícones emergem e orbitam (4-12s)"
  duration: "15 segundos"

style:
  visual: "3D render premium, estilo Apple/Samsung promo"
  color_palette: "Azul oceano, roxo, dourado, branco puro"`
  },
  // VIRAL - POV
  {
    id: "VIRAL-001",
    category: "viral",
    title: "POV: Esqueceu o Remédio",
    description: "Vídeo estilo TikTok POV relatável.",
    platform: "veo",
    tags: ["veo", "tiktok", "humor"],
    content: `initial_frame:
  description: "POV: Câmera subjetiva (primeira pessoa) olhando para mesa de jantar com prato vazio e copo d'água. Relógio de parede ao fundo marca 20:00. Ambiente doméstico noturno, luz amarela aconchegante."
  composition: "POV shot, ângulo levemente inclinado para baixo"

final_frame:
  description: "Mão entra em cena segurando smartphone com notificação HoraMed GIGANTE na tela: '⏰ VOCÊ ESQUECEU! Losartana 50mg'. Efeito de 'susto' com shake de câmera. Emoji de alívio aparece."
  composition: "Close-up no celular, mão tremendo levemente"

motion:
  camera: "POV estática → shake dramático quando notificação aparece (0.5s) → estabiliza"
  subject: "Mão entra rapidamente da direita (3s), celular vibra (efeito visual), emoji flutua (2s)"
  duration: "8 segundos"`
  },
  // SCRIPTS
  {
    id: "SCRIPT-001",
    category: "education",
    title: "Thread Twitter: 50% Esquecem",
    description: "Roteiro para thread no X/Twitter.",
    platform: "script",
    tags: ["texto", "twitter", "thread"],
    content: `🧵 THREAD: Por que você PRECISA de um app de lembretes de medicamentos

1/ Você sabia que 50% dos pacientes esquecem de tomar remédios regularmente?

2/ As consequências são sérias:
• Piora da doença
• Internações evitáveis
• Gastos extras com saúde

3/ O problema NÃO é falta de vontade. É falta de SISTEMA.

4/ O HoraMed foi desenvolvido exatamente para isso:
✅ Lembretes inteligentes
✅ Modo cuidador
✅ Relatórios para o médico

5/ Resultado? 85% de melhora na adesão (dados internos).

6/ Baixe grátis: [LINK]

Sua saúde agradece 💙`
  },
  {
    id: "SCRIPT-002",
    category: "viral",
    title: "Legenda Instagram: Dica do Dia",
    description: "Copy para post de dica diária.",
    platform: "text",
    tags: ["instagram", "copy", "dica"],
    content: `💡 DICA DO DIA

Tome sempre no mesmo horário!

Por quê? Seu corpo cria um 'relógio interno' e a eficácia do medicamento aumenta em até 30%.

O HoraMed te ajuda a manter essa consistência com lembretes inteligentes.

Salve este post! 📌

#DicaDeSaúde #HoraMed #Medicamentos #Saúde`
  }
];
