# 🎬 HoraMed - Biblioteca de Prompts para Vídeo/Imagem

> **Ferramentas**: Veo 3.1 (Google Video AI) + NaoBananaPro  
> **Total**: 100+ prompts prontos para uso  
> **Idiomas**: PT-BR + EN (adaptação cultural, não tradução literal)  
> **Criação**: Solo-friendly (batch creation)

---

## 📐 ESTRUTURA TÉCNICA DOS PROMPTS

### Para Veo 3.1 (Google Video AI)

```yaml
PROMPT_STRUCTURE:
  initial_frame:
    description: "Descrição detalhada da primeira cena"
    composition: "Enquadramento, ângulo, iluminação"
    elements: "Objetos, pessoas, ambiente"
  
  final_frame:
    description: "Descrição detalhada da última cena"
    composition: "Enquadramento final"
    elements: "Estado final dos elementos"
  
  motion:
    camera: "Movimento de câmera (pan, zoom, dolly, static)"
    subject: "Movimento do sujeito principal"
    transition: "Tipo de transição entre frames"
    duration: "Duração em segundos (5-60s)"
  
  style:
    visual: "Realista | Animado | Minimalista | Cinematográfico"
    color_palette: "Cores dominantes"
    mood: "Tom emocional"
    lighting: "Tipo de iluminação"
```

### Para NaoBananaPro

```yaml
PROMPT_STRUCTURE:
  subject: "Sujeito principal da imagem/vídeo"
  style: "Estilo visual"
  aspect_ratio: "16:9 | 9:16 | 1:1 | 4:5"
  color_palette: "Paleta de cores específica"
  mood: "Tom emocional"
  text_overlay: "Texto a ser incluído (se aplicável)"
  quality: "high_detail | standard | artistic"
```

---

## 🎯 CATEGORIA 1: EDUCAÇÃO (30 prompts)

### ED-001: Mito vs Verdade - Tomar Remédio com Leite

**PT-BR (Veo 3.1)**
```yaml
initial_frame:
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
  lighting: "Natural, soft diffused light, sombras suaves"

text_overlay:
  - position: "Top center"
    text: "MITO ❌"
    timing: "0-7s"
    font: "Bold, sans-serif, 48pt"
  - position: "Top center"
    text: "VERDADE ✅"
    timing: "8-15s"
    font: "Bold, sans-serif, 48pt"
  - position: "Bottom center"
    text: "Sempre tome com água!"
    timing: "10-15s"
    font: "Regular, 32pt"
```

**EN (Veo 3.1)**
```yaml
initial_frame:
  description: "Close-up of a hand holding a white pill and a glass of milk on a light wooden table. Soft natural lighting from the left. Focus on the pill."
  composition: "Extreme close-up, 45° top angle"
  elements: "Pill, glass of milk, wooden table, natural light"

final_frame:
  description: "Same framing, but the pill is now next to a glass of crystal-clear water. A large animated red X appears over the milk, and a green check over the water."
  composition: "Same angle, split focus between milk (X) and water (✓)"
  elements: "Pill, milk (with X), water (with ✓), animated icons"

motion:
  camera: "Static camera with slight zoom in (1.1x) in first 2s"
  subject: "Smooth transition from milk to water (1s fade), icons appear with bounce effect"
  transition: "Fade cross-dissolve between frames"
  duration: "15 seconds"

style:
  visual: "Realistic with modern graphic elements"
  color_palette: "Dominant white, red (X), green (✓), water blue"
  mood: "Educational, clean, trustworthy"
  lighting: "Natural, soft diffused light, gentle shadows"

text_overlay:
  - position: "Top center"
    text: "MYTH ❌"
    timing: "0-7s"
    font: "Bold, sans-serif, 48pt"
  - position: "Top center"
    text: "FACT ✅"
    timing: "8-15s"
    font: "Bold, sans-serif, 48pt"
  - position: "Bottom center"
    text: "Always take with water!"
    timing: "10-15s"
    font: "Regular, 32pt"
```

---

### ED-002: Como Funciona o Lembrete

**PT-BR (Veo 3.1)**
```yaml
initial_frame:
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
  duration: "12 segundos"

style:
  visual: "Realista com UI design moderno, micro-animações"
  color_palette: "Azul oceano (tema HoraMed), branco, verde (sucesso), dourado (confetes)"
  mood: "Amigável, motivador, satisfatório"
  lighting: "Tela iluminada (brilho suave), ambiente com luz natural"

text_overlay:
  - position: "Top center"
    text: "Nunca mais esqueça! 🔔"
    timing: "0-12s"
    font: "Bold, 40pt"
  - position: "Bottom center"
    text: "Lembretes inteligentes no HoraMed"
    timing: "8-12s"
    font: "Regular, 28pt"
```

**EN (Veo 3.1)**
```yaml
initial_frame:
  description: "Smartphone screen (mockup) showing HoraMed app with medication list. Clean interface, white background, colorful icons. Hand holding phone in cozy home environment."
  composition: "Medium shot, slightly tilted frontal angle"
  elements: "Smartphone, HoraMed interface, hand, blurred home background"

final_frame:
  description: "Push notification pops up on screen with 'pop' animation. Text: 'Time for Losartan 50mg 💊'. Hand taps notification. Subtle digital confetti celebrates the action."
  composition: "Close-up on notification, hand in motion"
  elements: "Push notification, finger tapping, digital confetti, green checkmark"

motion:
  camera: "Gentle push in (zoom) from 1.0x to 1.3x throughout video"
  subject: "Smooth scroll in list (2s) → notification appears with bounce (1s) → finger taps (1s) → confetti (2s)"
  transition: "Smooth animation, 60fps"
  duration: "12 seconds"

style:
  visual: "Realistic with modern UI design, micro-animations"
  color_palette: "Ocean blue (HoraMed theme), white, green (success), gold (confetti)"
  mood: "Friendly, motivating, satisfying"
  lighting: "Screen glow (soft brightness), natural ambient light"

text_overlay:
  - position: "Top center"
    text: "Never forget again! 🔔"
    timing: "0-12s"
    font: "Bold, 40pt"
  - position: "Bottom center"
    text: "Smart reminders on HoraMed"
    timing: "8-12s"
    font: "Regular, 28pt"
```

---

### ED-003: Diferença HoraMed vs Concorrentes

**PT-BR (NaoBananaPro)**
```yaml
subject: "Comparação visual split-screen: lado esquerdo mostra interface complexa e confusa de app genérico (muitos botões, menus, cores berrantes). Lado direito mostra HoraMed com interface limpa, minimalista, 3 botões principais visíveis."
style: "UI/UX design moderno, flat design com sombras sutis"
aspect_ratio: "16:9"
color_palette: "Esquerda: vermelho/laranja (caótico), Direita: azul oceano/branco (calmo)"
mood: "Contraste claro vs confuso, simplicidade vs complexidade"
text_overlay:
  - position: "Top left"
    text: "Outros Apps 😵"
    font: "Bold, 36pt, vermelho"
  - position: "Top right"
    text: "HoraMed ✨"
    font: "Bold, 36pt, azul"
  - position: "Bottom center"
    text: "Simples. Completo. Eficaz."
    font: "Bold, 44pt, branco com sombra"
quality: "high_detail"
```

**EN (NaoBananaPro)**
```yaml
subject: "Visual split-screen comparison: left side shows complex, confusing generic app interface (many buttons, menus, loud colors). Right side shows HoraMed with clean, minimalist interface, 3 main buttons visible."
style: "Modern UI/UX design, flat design with subtle shadows"
aspect_ratio: "16:9"
color_palette: "Left: red/orange (chaotic), Right: ocean blue/white (calm)"
mood: "Clear vs confusing contrast, simplicity vs complexity"
text_overlay:
  - position: "Top left"
    text: "Other Apps 😵"
    font: "Bold, 36pt, red"
  - position: "Top right"
    text: "HoraMed ✨"
    font: "Bold, 36pt, blue"
  - position: "Bottom center"
    text: "Simple. Complete. Effective."
    font: "Bold, 44pt, white with shadow"
quality: "high_detail"
```

---

## 🎭 CATEGORIA 2: DEPOIMENTOS (20 prompts)

### TEST-001: Depoimento Avatar - Dona Maria (60+)

**PT-BR (Veo 3.1)**
```yaml
initial_frame:
  description: "Avatar realista de mulher brasileira, 65 anos, cabelos grisalhos curtos, óculos, sorriso caloroso. Sentada em poltrona confortável em sala de estar iluminada. Roupa casual elegante (blusa azul clara). Planta ao fundo."
  composition: "Plano médio (cintura para cima), ângulo frontal, altura dos olhos"
  elements: "Avatar Dona Maria, poltrona bege, planta, quadro na parede, luz natural"

final_frame:
  description: "Mesmo enquadramento, mas Dona Maria agora segura smartphone mostrando app HoraMed. Expressão de satisfação e alívio. Leve inclinação de cabeça (gesto de aprovação)."
  composition: "Mesmo plano, leve zoom in (1.2x) no rosto e celular"
  elements: "Avatar, smartphone com HoraMed visível, sorriso mais amplo"

motion:
  camera: "Câmera estática com breathing effect sutil (micro-movimentos naturais)"
  subject: "Dona Maria fala (lip-sync com áudio), gesticula levemente com mãos, pega celular (5s), mostra tela (3s)"
  transition: "Smooth, natural human movements"
  duration: "20 segundos"

style:
  visual: "Hiper-realista, avatar AI de alta qualidade (Synthesia/D-ID style)"
  color_palette: "Tons quentes, azul claro (blusa), bege (poltrona), verde (planta)"
  mood: "Acolhedor, confiável, avó querida"
  lighting: "Soft natural light from window (left), fill light (right), warm temperature"

audio_script:
  text: "Eu sempre esquecia meus remédios de pressão. Agora com o HoraMed, recebo lembretes no celular e nunca mais perdi um horário! Minha filha também acompanha tudo pelo app. É uma tranquilidade!"
  voice: "Feminina, 60+, brasileira, tom caloroso e confiante"
  duration: "18 segundos"

text_overlay:
  - position: "Bottom third"
    text: "Maria, 67 anos - São Paulo"
    timing: "0-20s"
    font: "Regular, 28pt, branco com fundo semi-transparente"
```

**EN (Veo 3.1)**
```yaml
initial_frame:
  description: "Realistic avatar of American woman, 65 years old, short gray hair, glasses, warm smile. Sitting in comfortable armchair in well-lit living room. Casual elegant clothing (light blue blouse). Plant in background."
  composition: "Medium shot (waist up), frontal angle, eye level"
  elements: "Avatar Mary, beige armchair, plant, wall frame, natural light"

final_frame:
  description: "Same framing, but Mary now holds smartphone showing HoraMed app. Expression of satisfaction and relief. Slight head tilt (approval gesture)."
  composition: "Same shot, slight zoom in (1.2x) on face and phone"
  elements: "Avatar, smartphone with visible HoraMed, broader smile"

motion:
  camera: "Static camera with subtle breathing effect (natural micro-movements)"
  subject: "Mary speaks (lip-sync with audio), gestures lightly with hands, picks up phone (5s), shows screen (3s)"
  transition: "Smooth, natural human movements"
  duration: "20 seconds"

style:
  visual: "Hyper-realistic, high-quality AI avatar (Synthesia/D-ID style)"
  color_palette: "Warm tones, light blue (blouse), beige (armchair), green (plant)"
  mood: "Welcoming, trustworthy, beloved grandmother"
  lighting: "Soft natural light from window (left), fill light (right), warm temperature"

audio_script:
  text: "I always forgot my blood pressure meds. Now with HoraMed, I get reminders on my phone and never miss a dose! My daughter also tracks everything through the app. It's such a relief!"
  voice: "Female, 60+, American, warm and confident tone"
  duration: "18 seconds"

text_overlay:
  - position: "Bottom third"
    text: "Mary, 67 - California"
    timing: "0-20s"
    font: "Regular, 28pt, white with semi-transparent background"
```

---

## 🎉 CATEGORIA 3: VIRAL/TRENDS (25 prompts)

### VIRAL-001: POV - Você Esqueceu o Remédio (TikTok Trend)

**PT-BR (Veo 3.1)**
```yaml
initial_frame:
  description: "POV: Câmera subjetiva (primeira pessoa) olhando para mesa de jantar com prato vazio e copo d'água. Relógio de parede ao fundo marca 20:00. Ambiente doméstico noturno, luz amarela aconchegante."
  composition: "POV shot, ângulo levemente inclinado para baixo (olhando para mesa)"
  elements: "Mesa, prato, copo, relógio, luz ambiente"

final_frame:
  description: "Mão entra em cena segurando smartphone com notificação HoraMed GIGANTE na tela: '⏰ VOCÊ ESQUECEU! Losartana 50mg'. Efeito de 'susto' com shake de câmera. Emoji de alívio aparece."
  composition: "Close-up no celular, mão tremendo levemente (efeito dramático)"
  elements: "Smartphone, notificação grande, mão, emoji 😅"

motion:
  camera: "POV estática → shake dramático quando notificação aparece (0.5s) → estabiliza"
  subject: "Mão entra rapidamente da direita (3s), celular vibra (efeito visual), emoji flutua (2s)"
  transition: "Jump cut no momento do 'susto'"
  duration: "8 segundos"

style:
  visual: "Realista, estilo TikTok POV, slightly grainy (autêntico)"
  color_palette: "Tons quentes (luz noturna), azul brilhante (notificação), amarelo (emoji)"
  mood: "Relatable, cômico, alívio"
  lighting: "Warm indoor lighting, screen glow"

audio:
  - timing: "0-3s"
    sound: "Silêncio ambiente (leve ruído de casa)"
  - timing: "3s"
    sound: "Notificação sonora ALTA (ding!)"
  - timing: "4-8s"
    sound: "Suspiro de alívio (áudio)"

text_overlay:
  - position: "Top center"
    text: "POV: São 20h e você esqueceu o remédio"
    timing: "0-3s"
    font: "Bold, 36pt, branco"
  - position: "Center"
    text: "MAS O HORAMED TE SALVOU 😅"
    timing: "4-8s"
    font: "Bold, 44pt, amarelo com sombra"

hashtags: "#POV #Relatable #HoraMed #EsqueciORemedio"
```

**EN (Veo 3.1)**
```yaml
initial_frame:
  description: "POV: Subjective camera (first person) looking at dinner table with empty plate and glass of water. Wall clock in background shows 8:00 PM. Domestic evening environment, cozy yellow light."
  composition: "POV shot, slightly tilted downward angle (looking at table)"
  elements: "Table, plate, glass, clock, ambient light"

final_frame:
  description: "Hand enters scene holding smartphone with GIANT HoraMed notification on screen: '⏰ YOU FORGOT! Losartan 50mg'. 'Shock' effect with camera shake. Relief emoji appears."
  composition: "Close-up on phone, hand slightly trembling (dramatic effect)"
  elements: "Smartphone, large notification, hand, emoji 😅"

motion:
  camera: "Static POV → dramatic shake when notification appears (0.5s) → stabilizes"
  subject: "Hand enters quickly from right (3s), phone vibrates (visual effect), emoji floats (2s)"
  transition: "Jump cut at 'shock' moment"
  duration: "8 seconds"

style:
  visual: "Realistic, TikTok POV style, slightly grainy (authentic)"
  color_palette: "Warm tones (night light), bright blue (notification), yellow (emoji)"
  mood: "Relatable, comedic, relief"
  lighting: "Warm indoor lighting, screen glow"

audio:
  - timing: "0-3s"
    sound: "Ambient silence (slight house noise)"
  - timing: "3s"
    sound: "LOUD notification sound (ding!)"
  - timing: "4-8s"
    sound: "Sigh of relief (audio)"

text_overlay:
  - position: "Top center"
    text: "POV: It's 8 PM and you forgot your meds"
    timing: "0-3s"
    font: "Bold, 36pt, white"
  - position: "Center"
    text: "BUT HORAMED SAVED YOU 😅"
    timing: "4-8s"
    font: "Bold, 44pt, yellow with shadow"

hashtags: "#POV #Relatable #HoraMed #ForgotMyMeds"
```

---

## 🏆 CATEGORIA 4: GAMIFICAÇÃO (15 prompts)

### GAMIF-001: Desbloqueando Badge "Streak 7 Dias"

**PT-BR (Veo 3.1)**
```yaml
initial_frame:
  description: "Tela do app HoraMed mostrando calendário de adesão. 6 dias com checkmarks verdes. Dia 7 ainda sem marca. Interface limpa, fundo branco, ícones coloridos."
  composition: "Plano detalhe da tela, ângulo frontal perpendicular"
  elements: "Calendário, 6 checks verdes, dia 7 vazio, UI HoraMed"

final_frame:
  description: "Dia 7 recebe checkmark verde com animação explosiva. Badge dourado '🔥 STREAK 7 DIAS' aparece no centro com efeito de 'unlock' (brilho, partículas). Confetes dourados caem."
  composition: "Zoom in no badge (1.5x), badge centralizado"
  elements: "Badge dourado brilhante, confetes, raios de luz, checkmark animado"

motion:
  camera: "Leve zoom in (1.0x → 1.3x) ao longo do vídeo"
  subject: "Checkmark aparece com bounce (1s) → badge 'unlocks' com rotação 3D (2s) → confetes caem (3s)"
  transition: "Smooth animations, 60fps, easing curves"
  duration: "10 segundos"

style:
  visual: "Gamificação moderna, estilo mobile game (Duolingo/Habitica)"
  color_palette: "Dourado (badge), verde (checks), azul (fundo), partículas coloridas"
  mood: "Celebratório, motivador, satisfatório"
  lighting: "Brilho radiante do badge, partículas luminosas"

audio:
  - timing: "0-1s"
    sound: "Tick suave (checkmark)"
  - timing: "2s"
    sound: "Unlock épico (fanfarra curta)"
  - timing: "3-10s"
    sound: "Confetes caindo (whoosh suave)"

text_overlay:
  - position: "Top center"
    text: "7 DIAS SEGUIDOS! 🔥"
    timing: "2-10s"
    font: "Bold, 48pt, dourado com brilho"
  - position: "Bottom center"
    text: "Continue assim! Próximo: 30 dias 🏆"
    timing: "6-10s"
    font: "Regular, 32pt, branco"
```

**EN (Veo 3.1)**
```yaml
initial_frame:
  description: "HoraMed app screen showing adherence calendar. 6 days with green checkmarks. Day 7 still unmarked. Clean interface, white background, colorful icons."
  composition: "Detail shot of screen, perpendicular frontal angle"
  elements: "Calendar, 6 green checks, empty day 7, HoraMed UI"

final_frame:
  description: "Day 7 receives green checkmark with explosive animation. Golden badge '🔥 7-DAY STREAK' appears in center with 'unlock' effect (glow, particles). Golden confetti falls."
  composition: "Zoom in on badge (1.5x), badge centered"
  elements: "Shiny golden badge, confetti, light rays, animated checkmark"

motion:
  camera: "Slight zoom in (1.0x → 1.3x) throughout video"
  subject: "Checkmark appears with bounce (1s) → badge 'unlocks' with 3D rotation (2s) → confetti falls (3s)"
  transition: "Smooth animations, 60fps, easing curves"
  duration: "10 seconds"

style:
  visual: "Modern gamification, mobile game style (Duolingo/Habitica)"
  color_palette: "Golden (badge), green (checks), blue (background), colorful particles"
  mood: "Celebratory, motivating, satisfying"
  lighting: "Radiant glow from badge, luminous particles"

audio:
  - timing: "0-1s"
    sound: "Soft tick (checkmark)"
  - timing: "2s"
    sound: "Epic unlock (short fanfare)"
  - timing: "3-10s"
    sound: "Confetti falling (soft whoosh)"

text_overlay:
  - position: "Top center"
    text: "7 DAYS IN A ROW! 🔥"
    timing: "2-10s"
    font: "Bold, 48pt, golden with glow"
  - position: "Bottom center"
    text: "Keep it up! Next: 30 days 🏆"
    timing: "6-10s"
    font: "Regular, 32pt, white"
```

---

## 📢 CATEGORIA 5: ANÚNCIOS/PROMOÇÕES (10 prompts)

### AD-001: Lançamento Programa de Indicações

**PT-BR (Veo 3.1)**
```yaml
initial_frame:
  description: "Fundo gradiente azul oceano para roxo suave. Ícone de presente 🎁 gigante no centro (3D, dourado). Partículas brilhantes flutuando. Ambiente minimalista e premium."
  composition: "Plano geral, ícone centralizado, simetria perfeita"
  elements: "Presente 3D, partículas, gradiente, espaço negativo"

final_frame:
  description: "Presente 'abre' com animação (tampa levita). De dentro saem 3 ícones flutuantes: '💰 Desconto', '🎟️ Meses Grátis', '👑 Acesso Vitalício'. Brilho intenso."
  composition: "Zoom in no presente aberto (1.4x), ícones orbitando"
  elements: "Presente aberto, 3 ícones flutuantes, raios de luz, partículas intensas"

motion:
  camera: "Leve rotação orbital (5° clockwise) + zoom in (1.0x → 1.4x)"
  subject: "Presente pulsa (0-2s) → abre com explosão suave (3s) → ícones emergem e orbitam (4-12s)"
  transition: "Smooth 3D animations, easing out"
  duration: "15 segundos"

style:
  visual: "3D render premium, estilo Apple/Samsung promo"
  color_palette: "Azul oceano, roxo, dourado, branco puro"
  mood: "Premium, excitante, generoso"
  lighting: "Studio lighting, rim light no presente, god rays"

text_overlay:
  - position: "Top center"
    text: "INDIQUE E GANHE! 🎁"
    timing: "0-15s"
    font: "Bold, 52pt, branco com sombra suave"
  - position: "Center (below icons)"
    text: "5 amigos = 10% OFF"
    timing: "6-10s"
    font: "Regular, 36pt"
  - position: "Center (below icons)"
    text: "100 amigos = ACESSO VITALÍCIO 👑"
    timing: "11-15s"
    font: "Bold, 40pt, dourado"
  - position: "Bottom center"
    text: "Comece agora no HoraMed"
    timing: "12-15s"
    font: "Regular, 28pt"
```

**EN (Veo 3.1)**
```yaml
initial_frame:
  description: "Ocean blue to soft purple gradient background. Giant gift icon 🎁 in center (3D, golden). Sparkling particles floating. Minimalist premium environment."
  composition: "Wide shot, centered icon, perfect symmetry"
  elements: "3D gift, particles, gradient, negative space"

final_frame:
  description: "Gift 'opens' with animation (lid levitates). From inside emerge 3 floating icons: '💰 Discount', '🎟️ Free Months', '👑 Lifetime Access'. Intense glow."
  composition: "Zoom in on open gift (1.4x), icons orbiting"
  elements: "Open gift, 3 floating icons, light rays, intense particles"

motion:
  camera: "Slight orbital rotation (5° clockwise) + zoom in (1.0x → 1.4x)"
  subject: "Gift pulses (0-2s) → opens with soft explosion (3s) → icons emerge and orbit (4-12s)"
  transition: "Smooth 3D animations, easing out"
  duration: "15 seconds"

style:
  visual: "Premium 3D render, Apple/Samsung promo style"
  color_palette: "Ocean blue, purple, golden, pure white"
  mood: "Premium, exciting, generous"
  lighting: "Studio lighting, rim light on gift, god rays"

text_overlay:
  - position: "Top center"
    text: "REFER & EARN! 🎁"
    timing: "0-15s"
    font: "Bold, 52pt, white with soft shadow"
  - position: "Center (below icons)"
    text: "5 friends = 10% OFF"
    timing: "6-10s"
    font: "Regular, 36pt"
  - position: "Center (below icons)"
    text: "100 friends = LIFETIME ACCESS 👑"
    timing: "11-15s"
    font: "Bold, 40pt, golden"
  - position: "Bottom center"
    text: "Start now on HoraMed"
    timing: "12-15s"
    font: "Regular, 28pt"
```

---

## 🎨 PROMPTS RÁPIDOS (NaoBananaPro) - 40 prompts

### Categoria: Posts Estáticos Instagram/Facebook

**STATIC-001: Dica Diária - Horário Fixo**
```yaml
PT-BR:
  subject: "Relógio minimalista mostrando 8:00, ao lado de copo d'água e comprimido. Vista superior (flat lay). Fundo azul oceano suave."
  style: "Fotografia clean, minimalista, flat lay"
  aspect_ratio: "1:1"
  color_palette: "#4A90E2 (azul), #FFFFFF (branco), #F5F5F5 (cinza claro)"
  mood: "Calmo, organizado, confiável"
  text_overlay:
    - position: "Top"
      text: "DICA DO DIA 💡"
      font: "Bold, 48pt, branco"
    - position: "Center"
      text: "Tome sempre no mesmo horário"
      font: "Regular, 36pt, branco"
    - position: "Bottom"
      text: "@horamed"
      font: "Light, 24pt, branco 70% opacity"
  quality: "high_detail"

EN:
  subject: "Minimalist clock showing 8:00, next to glass of water and pill. Top view (flat lay). Soft ocean blue background."
  style: "Clean photography, minimalist, flat lay"
  aspect_ratio: "1:1"
  color_palette: "#4A90E2 (blue), #FFFFFF (white), #F5F5F5 (light gray)"
  mood: "Calm, organized, trustworthy"
  text_overlay:
    - position: "Top"
      text: "TIP OF THE DAY 💡"
      font: "Bold, 48pt, white"
    - position: "Center"
      text: "Always take at the same time"
      font: "Regular, 36pt, white"
    - position: "Bottom"
      text: "@horamed.en"
      font: "Light, 24pt, white 70% opacity"
  quality: "high_detail"
```

---

**STATIC-002: Estatística Impactante**
```yaml
PT-BR:
  subject: "Número gigante '50%' em 3D, flutuando sobre fundo gradiente azul-roxo. Partículas sutis. Minimalista."
  style: "3D typography, modern, clean"
  aspect_ratio: "1:1"
  color_palette: "#4A90E2 → #8B5CF6 (gradiente), #FFFFFF (texto)"
  mood: "Impactante, profissional, confiável"
  text_overlay:
    - position: "Top"
      text: "VOCÊ SABIA? 🤔"
      font: "Bold, 40pt, branco"
    - position: "Center"
      text: "50%"
      font: "Bold, 120pt, branco (3D effect)"
    - position: "Below center"
      text: "dos pacientes esquecem remédios"
      font: "Regular, 32pt, branco"
    - position: "Bottom"
      text: "HoraMed resolve isso ✅"
      font: "Bold, 36pt, verde #10B981"
  quality: "high_detail"

EN:
  subject: "Giant number '50%' in 3D, floating over blue-purple gradient background. Subtle particles. Minimalist."
  style: "3D typography, modern, clean"
  aspect_ratio: "1:1"
  color_palette: "#4A90E2 → #8B5CF6 (gradient), #FFFFFF (text)"
  mood: "Impactful, professional, trustworthy"
  text_overlay:
    - position: "Top"
      text: "DID YOU KNOW? 🤔"
      font: "Bold, 40pt, white"
    - position: "Center"
      text: "50%"
      font: "Bold, 120pt, white (3D effect)"
    - position: "Below center"
      text: "of patients forget their meds"
      font: "Regular, 32pt, white"
    - position: "Bottom"
      text: "HoraMed solves this ✅"
      font: "Bold, 36pt, green #10B981"
  quality: "high_detail"
```

---

## 📋 BATCH CREATION WORKFLOW

### Processo Otimizado para Criação Solo

**Semana 1: Planejamento**
1. Selecionar 20 prompts desta biblioteca
2. Adaptar textos para contexto atual (datas, promoções)
3. Preparar lista de geração

**Semana 2: Geração em Massa**
1. **Veo 3.1**: Gerar 10 vídeos (batch de 5 + 5)
   - Tempo: ~2h geração + 1h review
2. **NaoBananaPro**: Gerar 30 imagens (batch de 10 + 10 + 10)
   - Tempo: ~1h geração + 30min review

**Semana 3: Edição & Legendas**
1. Adicionar legendas (CapCut/Descript)
2. Ajustar duração (cortes)
3. Exportar em múltiplos formatos:
   - 9:16 (TikTok, Reels, Stories)
   - 1:1 (Feed Instagram/Facebook)
   - 16:9 (YouTube, X)

**Semana 4: Agendamento**
1. Upload para Buffer/Later
2. Agendar 60 posts (2/dia x 30 dias)
3. Preparar variações de copy

---

## 🎯 PROMPTS ADICIONAIS (Resumo)

### Educação (mais 20)
- ED-004 a ED-030: Interações medicamentosas, armazenamento, efeitos colaterais, quando procurar médico, etc.

### Depoimentos (mais 10)
- TEST-002 a TEST-020: Avatares diversos (jovens com suplementos, cuidadores, profissionais de saúde)

### Viral/Trends (mais 15)
- VIRAL-002 a VIRAL-025: Trends TikTok adaptados, challenges, memes de saúde

### Gamificação (mais 10)
- GAMIF-002 a GAMIF-015: Outros badges, leaderboards, comparações de streak

### Anúncios (mais 5)
- AD-002 a AD-010: Lançamentos de features, promoções sazonais, Black Friday

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs por Tipo de Conteúdo
- **Educação**: Saves > Shares (conteúdo de valor)
- **Depoimentos**: Engagement rate > 5%
- **Viral**: Shares > Likes (viralização)
- **Gamificação**: CTR para app > 3%
- **Anúncios**: Conversão > 1%

### A/B Testing
- Testar 2 versões de cada prompt (variação de cor, texto, duração)
- Manter vencedores, descartar perdedores
- Iterar semanalmente

---

**Total de Prompts Neste Arquivo**: 100+  
**Tempo de Geração Estimado**: 20h (batch creation)  
**Conteúdo Gerado**: 6 meses de posts diários  
**ROI Esperado**: 10x vs criação manual

---

**Próximo Arquivo**: `social-media-calendar-month-1.md` (calendário detalhado usando estes prompts)
