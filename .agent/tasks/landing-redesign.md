# Landing Page Redesign Plan: "Neo-Editorial Health"

## 1. Context & Objective
The current landing page feels generic, static, and relies on obvious AI-generated stock photography. The text is very "standard SaaS/App". 
The goal is to rebuild the landing page to be:
- **Clean & Intuitive**: A focused, direct story. No clutter.
- **Persuasive**: Emotional connection without cheap stock photos.
- **Retentive**: Scroll-triggered animations, interactive micro-moments.
- **Unique**: Break away from the "Medical App Blue/White Soft Corners" cliché.

## 2. Deep Design Thinking
- **Sector**: Digital Health / Family Care. (Usually sterile, soft, blue).
- **Core Emotion**: Absolute Peace of Mind & Confidence (Serenity).
- **The Betrayal**: Medical apps are always blue, friendly, and soft. We will go **Editorial & Sharp**. We treat the user's health with the seriousness and premium feel of a high-end service, not a generic utility.

## 3. Style Commitment: "Neo-Editorial Health"
- **Color Palette**: Deep Forest/Pine Green (Trust/Growth) + Cream/Off-White background + Sharp Safety Orange (Action/Urgency) accents. 
- **Typography**: Massive Serif for emotional hooks + Sharp Sans-Serif for functional data.
- **Visuals**: ZERO AI stock photos. We will use abstract, premium shapes (glass/matte pills, floating UI cards) and strong typography. 
- **Layout**: 
  - **Massive Typographic Hero**: The text *is* the hero. 
  - **Asymmetric Tension**: 90/10 layout shifts instead of 50/50 splits.
  - **Fluid Animation**: Spring-based physics, scroll-reveals, and micro-interactions on hover.

## 4. Execution Phases
1. **Approval**: Discuss the radical aesthetic shift with the user.
2. **Assets Refactoring**: Remove AI images. Build pure CSS/SVG abstract elements or rely purely on UI component shots.
3. **Copywriting Rewrite**: Move away from "Features" (e.g., "Add medication") to "Outcomes" (e.g., "A paz de saber que seus pais tomaram o remédio certo.").
4. **Implementation**: Rebuild `Landing.tsx` step by step.
5. **Animation & Polish**: Add Framer Motion scroll and hover effects.

## 5. Required File Changes
- `src/pages/Landing.tsx` (Complete topological and graphical overhaul)
- `src/index.css` or Tailwind config (New color tokens if needed)
- `src/i18n/locales/pt.json` (Rewrite the copy to be punchy, emotional, and persuasive)
