# UI Redesign Masterplan: "Clean Medical Blue"

> **Objective**: Re-platform the HoraMed UI to match the provided "Soft Medical Blue" aesthetic references.
> **Philosophy**: Minimalist, Breathable, Rounded, Soft Shadows.

---

## 🎨 Design System Updates (Foundation)

- [ ] **Color Palette**: Update `index.css` to match the "Soft Blue" theme.
  - Primary: Soft Medical Blue (`hsl(210, 100%, 50%)` -> Tweak to lighter/softer)
  - Background: White to Light Blue Gradient (Top-down fade)
  - Cards: White with `shadow-sm` and rounded-3xl corners.
- [ ] **Typography**: Ensure `Inter` or `Rounded Mplus 1c` feel.
- [ ] **Shadows**: Soft, multi-layer colored shadows (blue glow).

---

## 🖼️ Phase 1: Home / Medications (`/hoje`)
*Reference: Image 1 (Calendar List & Medication Cards)*

- [ ] **Header**: "Meus Medicamentos" + Add Button (Start aligned).
- [ ] **Calendar Strip**:
  - Horizontal scroll.
  - Selected state: Blue rounded rectangle (Squircle), White Text.
  - Unselected state: Gray Text.
- [ ] **Medication Cards**:
  - Layout: Icon (Left) | Title + Details (Middle) | Time + Checkbox (Right).
  - Badge: "08:00" in light blue pill.
  - Visual: White card, floating effect.
- [ ] **Premium Banner**: Distinctive Orange/Gold gradient card.

---

## 📊 Phase 2: Health Dashboard (`/dashboard-saude`) ✅ CONCLUÍDO
*Reference: Image 2 (Saúde & Dados)*

- [x] **Header**: "Saúde & Dados" + Date via PageHeroHeader.
- [x] **General Activity**: Large card with Circular Progress (blue) + animated SVG.
- [x] **Vitals Grid**: 2x2 Grid.
  - Heart Rate: Rose Icon + Value.
  - Glicemia: Amber Icon + Value.
  - Peso: Emerald Icon + Value.
  - Eventos: Blue Icon + Count.
- [x] **Action Bar**: "Dados" (Add) + "Relatório" (Share).
- [x] **OceanBackground + Navigation**: Full layout wrapper.
- [x] **Charts**: Rounded-3xl glass cards, adherence + vitals.
- [x] **Period Comparison**: Compact 3-column trend badges.

---

## 🪪 Phase 3: Wallet (`/carteira`) ✅ CONCLUÍDO
*Reference: Image 3 & 4 (Carteira/Documents)*

- [x] **Search Bar**: Floating search field with rounded-2xl glass blur.
- [x] **Quick Categories**: Scrollable pills (Todos, Receitas, Exames, Vacinas, Consultas).
- [x] **Document Cards**: Squircle rounded-3xl cards with category icons and metadata.
- [x] **List**: Stacked animated cards with hover/active scaling.
- [x] **Add Button**: Desktop PageHeroHeader action + Mobile FAB (floating action button).
- [x] **OceanBackground + PageHeroHeader + Navigation**: Full layout wrapper.

---

## 🏆 Phase 4: Progress (`/progresso`)
*Reference: Image 5 (Meu Progresso)*

- [ ] **Level Header**: User Avatar + "Nível 5" Badge + XP Bar (Gold/Orange).
- [ ] **Trophy**: 3D Icon visual.
- [ ] **Streak Card**: Big Blue Card with "14 Dias" + Fire Icon.
- [ ] **Stats Row**:
  - Pontualidade (Circular %).
  - Doses Totais (Icon + Count).
  - Tomadas (Icon + Count).
- [ ] **Report Card**: Download PDF Option.

---

## 🚀 Execution Strategy

1. **Theme**: Update globals first.
2. **Components**: Build reusable atoms (RoundCard, Pill, IconBox).
3. **Pages**: Refactor pages one by one, replacing old layouts.
