# Medical Appointments & Exams OCR System

**Created:** 2026-01-31  
**Status:** Planning  
**Priority:** High  
**Complexity:** 8/10

---

## 📋 Executive Summary

Implementar sistema completo de gerenciamento de consultas médicas e exames com captura por OCR ou entrada manual, integração com calendário, notificações inteligentes, e visualização otimizada para mostrar ao médico.

---

## 🎯 Objectives

### Primary Goals
1. **Captura Inteligente**: OCR + entrada manual para pedidos de exames, receitas e consultas
2. **Calendário Integrado**: Eventos diferenciados com informações completas
3. **Notificações Contextuais**: Lembretes múltiplos com instruções de preparo
4. **Visualização Médica**: Resumo clean com QR code para compartilhamento
5. **Gamificação**: Integração com sistema de recompensas

### Success Metrics
- OCR com 90%+ de precisão na extração de dados
- Usuários conseguem adicionar consulta em < 2 minutos
- 80%+ de satisfação com interface "mostrar ao médico"
- Redução de 50% em consultas/exames perdidos

---

## 🏗️ Architecture Overview

### New Components Structure
```
src/
├── components/
│   ├── medical-events/
│   │   ├── OCRCapture.tsx              # Camera + OCR processing
│   │   ├── EventFormWizard.tsx         # Multi-step form (consulta/exame)
│   │   ├── EventCard.tsx               # Card visual para timeline
│   │   ├── EventCalendar.tsx           # Calendário integrado
│   │   ├── PrepChecklistModal.tsx      # Checklist pré-consulta
│   │   └── DoctorView.tsx              # View otimizada para médico
│   └── medical-events/
│       └── share/
│           ├── ShareSheet.tsx          # Opções de compartilhamento
│           └── PDFGenerator.tsx        # Gerador de PDF
├── pages/
│   ├── MedicalEventsHub.tsx            # Hub principal
│   └── EventDetails.tsx                # Detalhes do evento
├── lib/
│   ├── ocr/
│   │   ├── ocrProcessor.ts             # Processamento OCR
│   │   ├── documentClassifier.ts       # IA para classificar tipo
│   │   └── dataExtractor.ts            # Extração de dados estruturados
│   ├── medicalEvents.ts                # CRUD operations
│   └── eventNotifications.ts           # Sistema de notificações
└── types/
    └── medicalEvents.ts                # TypeScript interfaces
```

### Data Model
```typescript
interface MedicalEvent {
  id: string;
  userId: string;
  type: 'consultation' | 'exam' | 'procedure';
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  
  // Basic Info
  title: string;
  date: Timestamp;
  time: string;
  
  // Location & Professional
  location: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  doctor: {
    name: string;
    crm?: string;
    specialty?: string;
  };
  
  // Exam-specific
  examType?: string;
  preparation?: {
    fasting: boolean;
    fastingHours?: number;
    instructions: string[];
  };
  
  // Documents
  documents: {
    toTake: string[];        // ["Carteirinha", "Pedido médico"]
    attachments: string[];   // URLs dos documentos
  };
  
  // Insurance
  healthInsurance?: {
    provider: string;
    cardNumber: string;
  };
  
  // Recurrence
  recurrence?: {
    enabled: boolean;
    frequency: 'weekly' | 'monthly' | 'yearly';
    interval: number;        // Ex: a cada 6 meses
    endDate?: Timestamp;
  };
  
  // OCR Data
  ocrData?: {
    originalImage: string;
    extractedText: string;
    confidence: number;
    reviewedByUser: boolean;
  };
  
  // Post-event
  outcome?: {
    attended: boolean;
    notes: string;
    newMedications?: string[];  // IDs de medicamentos adicionados
    newExamsRequested?: string[]; // IDs de novos exames
  };
  
  // Notifications
  notifications: {
    enabled: boolean;
    reminders: Array<{
      type: 'preparation' | 'documents' | 'general';
      timing: number;        // Minutos antes do evento
      sent: boolean;
    }>;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 📝 Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
**Goal:** Estabelecer base de dados e estrutura de componentes

#### Tasks
- [ ] **1.1 Database Schema**
  - Create `medicalEvents` collection in Firestore
  - Setup indexes for queries (userId, date, status)
  - Create security rules
  - **Verification:** Successfully create/read/update/delete events

- [ ] **1.2 TypeScript Types**
  - Define `MedicalEvent` interface
  - Create helper types (EventType, EventStatus, etc.)
  - **Verification:** No TypeScript errors

- [ ] **1.3 Base CRUD Operations**
  - Implement `medicalEvents.ts` library
  - Functions: createEvent, updateEvent, deleteEvent, getEvents
  - Real-time listeners for calendar sync
  - **Verification:** Unit tests passing

- [ ] **1.4 Navigation Structure**
  - Add "Consultas & Exames" to main navigation
  - Create routes in AppRouter
  - Setup MedicalEventsHub page skeleton
  - **Verification:** Navigation works, page renders

**Dependencies:** None  
**Estimated Time:** 3-4 days

---

### Phase 2: OCR & Data Capture (Week 2)
**Goal:** Implementar captura inteligente de documentos

#### Tasks
- [ ] **2.1 OCR Integration**
  - Research OCR libraries (Tesseract.js vs Google Vision API vs Azure)
  - Implement camera capture component
  - Process image → extract text
  - **Verification:** Successfully extract text from test images

- [ ] **2.2 AI Document Classifier**
  - Train/configure model to identify document type
  - Classify: pedido de exame, receita, guia de consulta
  - Extract confidence score
  - **Verification:** 85%+ accuracy on test dataset

- [ ] **2.3 Data Extraction Engine**
  - Parse extracted text for structured data
  - Identify: dates, doctor names, CRM, exam types, locations
  - Use regex + NLP for Brazilian medical documents
  - **Verification:** Extract 80%+ of key fields correctly

- [ ] **2.4 Review & Edit Interface**
  - Show extracted data in editable form
  - Highlight low-confidence fields
  - Allow manual corrections
  - Save original image + extracted data
  - **Verification:** User can review and correct all fields

**Dependencies:** Phase 1 complete  
**Estimated Time:** 5-6 days

---

### Phase 3: Event Form & Wizard (Week 3)
**Goal:** Interface intuitiva para adicionar/editar eventos

#### Tasks
- [ ] **3.1 Multi-Step Wizard Component**
  - Step 1: Choose capture method (OCR vs Manual)
  - Step 2: Event type (Consulta vs Exame)
  - Step 3: Basic info (date, time, title)
  - Step 4: Location & doctor
  - Step 5: Exam details (if applicable)
  - Step 6: Documents & insurance
  - Step 7: Recurrence settings
  - Step 8: Review & confirm
  - **Verification:** Complete flow without errors

- [ ] **3.2 Smart Form Fields**
  - Auto-complete for common doctors/locations
  - Date/time picker with calendar integration
  - Conditional fields (show exam prep only for exams)
  - **Verification:** Form adapts based on selections

- [ ] **3.3 Preparation Settings**
  - Fasting toggle with hours selector
  - Custom instruction text area
  - Pre-populated common instructions
  - **Verification:** Preparation data saves correctly

- [ ] **3.4 Recurrence Logic**
  - Frequency selector (weekly/monthly/yearly)
  - Interval input (ex: every 6 months)
  - End date or occurrence count
  - Generate recurring events in Firestore
  - **Verification:** Recurring events created correctly

**Dependencies:** Phase 2 complete  
**Estimated Time:** 4-5 days

---

### Phase 4: Calendar Integration (Week 4)
**Goal:** Visualização e gestão de eventos no calendário

#### Tasks
- [ ] **4.1 Calendar Component**
  - Month/week/day views
  - Color-coded events (consulta vs exame)
  - Click event → show details
  - Drag-and-drop to reschedule
  - **Verification:** All events display correctly

- [ ] **4.2 Event Cards & Timeline**
  - Visual cards for upcoming events
  - Timeline view (chronological)
  - Status indicators (scheduled/completed/missed)
  - Quick actions (edit, cancel, mark as done)
  - **Verification:** Cards render with all info

- [ ] **4.3 Dashboard Integration**
  - Add "Próximas Consultas" widget to dashboard
  - Show next 3 upcoming events
  - Quick add button
  - **Verification:** Widget shows on dashboard

- [ ] **4.4 Filters & Search**
  - Filter by type, status, date range
  - Search by doctor, location, exam type
  - Sort options
  - **Verification:** Filters work correctly

**Dependencies:** Phase 3 complete  
**Estimated Time:** 4-5 days

---

### Phase 5: Notifications System (Week 5)
**Goal:** Lembretes inteligentes e contextuais

#### Tasks
- [ ] **5.1 Notification Scheduler**
  - Create `eventNotifications.ts` service
  - Schedule notifications based on event date
  - Multiple reminders per event
  - **Verification:** Notifications scheduled correctly

- [ ] **5.2 Preparation Reminders**
  - Detect fasting requirement → schedule night-before reminder
  - Custom timing for exam prep (ex: 24h before)
  - Include preparation instructions in notification
  - **Verification:** Prep reminders fire at correct times

- [ ] **5.3 Document Reminders**
  - Reminder to bring required documents
  - Checklist in notification
  - Link to event details
  - **Verification:** Document reminders show checklist

- [ ] **5.4 Smart Timing**
  - 1 week before (for planning)
  - 1 day before (final reminder)
  - 2 hours before (departure time)
  - Custom user preferences
  - **Verification:** All reminders fire as configured

- [ ] **5.5 Notification Settings**
  - Enable/disable per event
  - Global notification preferences
  - Quiet hours support
  - **Verification:** Settings persist and apply

**Dependencies:** Phase 4 complete  
**Estimated Time:** 3-4 days

---

### Phase 6: Doctor View & Sharing (Week 6)
**Goal:** Visualização otimizada para mostrar ao médico

#### Tasks
- [ ] **6.1 Doctor View Component**
  - Clean, professional layout
  - HoraMed logo + branding
  - Patient info section
  - Current medications list
  - Recent exams/consultations
  - Allergies & important notes
  - **Verification:** View renders beautifully

- [ ] **6.2 QR Code Generation**
  - Generate unique URL for each patient profile
  - QR code with link to download app
  - Shareable digital document
  - **Verification:** QR code scans correctly

- [ ] **6.3 PDF Generator**
  - Convert doctor view to PDF
  - Include all relevant data
  - Professional formatting
  - **Verification:** PDF generates and downloads

- [ ] **6.4 Share Sheet**
  - WhatsApp share
  - Email share
  - Copy link
  - Print option
  - **Verification:** All share methods work

- [ ] **6.5 History View**
  - Complete timeline of events
  - Filter by date range
  - Visual indicators (completed/missed)
  - Export options
  - **Verification:** History displays correctly

**Dependencies:** Phase 5 complete  
**Estimated Time:** 4-5 days

---

### Phase 7: Caregiver Integration (Week 7)
**Goal:** Permitir cuidadores gerenciarem eventos

#### Tasks
- [ ] **7.1 Caregiver Permissions**
  - Add "manage_medical_events" permission
  - Check permissions in CRUD operations
  - **Verification:** Permissions enforced

- [ ] **7.2 Caregiver Notifications**
  - Send notifications to linked caregivers
  - Configurable per event
  - **Verification:** Caregivers receive notifications

- [ ] **7.3 Multi-User Event Management**
  - Caregivers can add/edit events
  - Activity log (who created/modified)
  - **Verification:** Multiple users can manage events

**Dependencies:** Phase 6 complete  
**Estimated Time:** 2-3 days

---

### Phase 8: Gamification & Rewards (Week 8)
**Goal:** Integrar com sistema de recompensas

#### Tasks
- [ ] **8.1 Event Completion Tracking**
  - Mark event as "attended" after date
  - Prompt user to confirm attendance
  - **Verification:** Status updates correctly

- [ ] **8.2 Rewards Integration**
  - Award points for attending consultations
  - Award points for completing exams
  - Bonus for perfect attendance streak
  - **Verification:** Points awarded correctly

- [ ] **8.3 Badges & Achievements**
  - "Health Guardian" - 5 consultas attended
  - "Exam Champion" - 10 exames completed
  - "Perfect Attendance" - 3 months without missing
  - **Verification:** Badges unlock correctly

- [ ] **8.4 Post-Event Flow**
  - After event, ask: "Como foi a consulta?"
  - Prompt to add new medications if prescribed
  - Prompt to add new exams if requested
  - Auto-link new items to this event
  - **Verification:** Post-event flow completes

**Dependencies:** Phase 7 complete  
**Estimated Time:** 3-4 days

---

### Phase 9: Accessibility & UX Polish (Week 9)
**Goal:** Garantir acessibilidade e experiência premium

#### Tasks
- [ ] **9.1 Accessibility Options**
  - Font size settings (normal/large/extra-large)
  - High contrast mode
  - Screen reader support
  - **Verification:** WCAG 2.1 AA compliance

- [ ] **9.2 Onboarding Tutorial**
  - First-time user walkthrough
  - Tooltips for key features
  - Skip option always visible
  - Never show again checkbox
  - **Verification:** Tutorial completes smoothly

- [ ] **9.3 Contextual Help**
  - Info icons with explanations
  - Help center links
  - Video tutorials (optional)
  - **Verification:** Help content accessible

- [ ] **9.4 Error Handling**
  - Graceful OCR failures
  - Network error recovery
  - User-friendly error messages
  - **Verification:** No crashes on errors

- [ ] **9.5 Performance Optimization**
  - Lazy load images
  - Optimize OCR processing
  - Cache calendar data
  - **Verification:** < 2s load time

**Dependencies:** Phase 8 complete  
**Estimated Time:** 3-4 days

---

### Phase 10: Testing & Launch (Week 10)
**Goal:** Garantir qualidade e lançar feature

#### Tasks
- [ ] **10.1 Unit Tests**
  - Test all CRUD operations
  - Test OCR extraction logic
  - Test notification scheduling
  - **Verification:** 80%+ code coverage

- [ ] **10.2 Integration Tests**
  - Test complete user flows
  - Test caregiver interactions
  - Test rewards integration
  - **Verification:** All flows pass

- [ ] **10.3 User Testing**
  - Beta test with 10 elderly users
  - Collect feedback on UX
  - Iterate based on feedback
  - **Verification:** 80%+ satisfaction

- [ ] **10.4 Documentation**
  - User guide (PT/EN)
  - API documentation
  - Caregiver instructions
  - **Verification:** Docs complete

- [ ] **10.5 Launch Preparation**
  - Feature flag setup
  - Rollout plan (10% → 50% → 100%)
  - Monitor error rates
  - **Verification:** Successful rollout

**Dependencies:** Phase 9 complete  
**Estimated Time:** 5-6 days

---

## 🎨 Design Specifications

### Visual Identity
- **Primary Color:** Ocean theme (sky blue) - consistent with app
- **Event Type Colors:**
  - Consulta: `#3B82F6` (blue)
  - Exame: `#10B981` (green)
  - Procedimento: `#F59E0B` (amber)
- **Status Indicators:**
  - Scheduled: Blue outline
  - Completed: Green checkmark
  - Missed: Red warning
  - Cancelled: Gray strikethrough

### Component Patterns
- **Event Cards:** Glassmorphism effect, subtle shadows
- **Calendar:** Clean, minimal, touch-friendly (min 44px touch targets)
- **Doctor View:** Professional, print-friendly, high contrast
- **Forms:** Progressive disclosure, clear visual hierarchy

### Responsive Breakpoints
- Mobile: < 640px (primary focus)
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 🔒 Security & Privacy

### Data Protection
- Encrypt medical documents at rest
- Secure OCR processing (no data sent to third parties without consent)
- LGPD compliance for health data
- User consent for data sharing

### Access Control
- Events visible only to user + linked caregivers
- Doctor view requires authentication token
- Shared links expire after 7 days

---

## 📊 Analytics & Monitoring

### Key Metrics
- OCR success rate (target: 90%+)
- Average time to add event (target: < 2 min)
- Notification open rate (target: 60%+)
- Event attendance rate (track missed appointments)
- Feature adoption rate (target: 40% of users)

### Error Tracking
- OCR failures
- Notification delivery failures
- Share/export errors
- Form validation errors

---

## 🚀 Future Enhancements (Post-Launch)

### V2 Features
- [ ] Integration with Google Calendar / Apple Calendar
- [ ] Voice input for adding events
- [ ] AI-powered health insights based on consultation patterns
- [ ] Telemedicine integration
- [ ] Automatic exam result upload and tracking
- [ ] Multi-language OCR (Spanish, English)
- [ ] Wearable device integration (reminders on smartwatch)

### V3 Features
- [ ] Doctor portal (doctors can see their patients' HoraMed data)
- [ ] Insurance claim automation
- [ ] Prescription refill reminders based on consultation history
- [ ] Health trend analysis (frequency of consultations)

---

## 📚 Technical References

### OCR Libraries
- **Tesseract.js:** Free, client-side, good for Portuguese
- **Google Vision API:** High accuracy, paid, requires internet
- **Azure Computer Vision:** Medical document optimized

### Recommendation: Start with Tesseract.js for MVP, evaluate Google Vision if accuracy < 85%

### Calendar Libraries
- **React Big Calendar:** Feature-rich, customizable
- **FullCalendar:** Professional, touch-friendly
- **React Calendar:** Lightweight, simple

### Recommendation: React Big Calendar for flexibility

### PDF Generation
- **jsPDF:** Client-side, lightweight
- **PDFKit:** Node.js, more features
- **react-pdf:** React-friendly

### Recommendation: jsPDF for client-side generation

---

## ✅ Definition of Done

A feature is considered complete when:
- [ ] All tasks in phase are checked off
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] No critical bugs
- [ ] Accessibility audit passed
- [ ] User testing completed (80%+ satisfaction)
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Performance benchmarks met
- [ ] Analytics tracking implemented

---

## 🎯 Success Criteria

This feature will be considered successful if:
1. **Adoption:** 40%+ of active users add at least 1 medical event within 30 days
2. **Accuracy:** OCR extraction accuracy ≥ 85% for key fields
3. **Engagement:** 60%+ of users interact with notifications
4. **Satisfaction:** 80%+ user satisfaction in post-launch survey
5. **Impact:** 30% reduction in missed appointments (self-reported)
6. **Performance:** Feature loads in < 2 seconds on 4G connection

---

**Next Steps:**
1. Review and approve this plan
2. Set up project tracking (GitHub Projects / Jira)
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews

**Estimated Total Time:** 10 weeks (2.5 months)  
**Team Size:** 1-2 developers + 1 designer (part-time)  
**Budget Considerations:** OCR API costs (if using Google Vision), testing devices
