import { Timestamp } from 'firebase/firestore';

/**
 * Medical Event Types
 */
export type EventType = 'consultation' | 'exam' | 'procedure' | 'other';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';
export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';
export type ReminderType = 'preparation' | 'documents' | 'general';

/**
 * Location Information
 */
export interface EventLocation {
    name: string;
    address: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

/**
 * Doctor/Professional Information
 */
export interface EventDoctor {
    name: string;
    crm?: string;
    specialty?: string;
}

/**
 * Exam Preparation Details
 */
export interface ExamPreparation {
    fasting: boolean;
    fastingHours?: number;
    instructions: string[];
}

/**
 * Documents Required/Attached
 */
export interface EventDocuments {
    toTake: string[];        // List of documents to bring
    attachments: string[];   // URLs of uploaded documents
}

/**
 * Health Insurance Information
 */
export interface HealthInsurance {
    provider: string;
    cardNumber: string;
}

/**
 * Recurrence Settings
 */
export interface EventRecurrence {
    enabled: boolean;
    frequency: RecurrenceFrequency;
    interval: number;        // e.g., every 6 months
    endDate?: Timestamp;
    nextOccurrence?: Timestamp;
}

/**
 * OCR Extraction Data
 */
export interface OCRData {
    originalImage: string;      // Storage URL
    extractedText: string;
    confidence: number;         // 0-100
    reviewedByUser: boolean;
    extractedAt: Timestamp;
}

/**
 * Post-Event Outcome
 */
export interface EventOutcome {
    attended: boolean;
    notes: string;
    newMedications?: string[];      // IDs of medications added
    newExamsRequested?: string[];   // IDs of new exams requested
    completedAt: Timestamp;
}

/**
 * Notification Reminder
 */
export interface EventReminder {
    type: ReminderType;
    timing: number;          // Minutes before event
    sent: boolean;
    sentAt?: Timestamp;
    notificationId?: string;
}

/**
 * Notification Settings
 */
export interface EventNotifications {
    enabled: boolean;
    reminders: EventReminder[];
}

/**
 * Main Medical Event Interface
 */
export interface MedicalEvent {
    id: string;
    userId: string;
    type: EventType;
    status: EventStatus;

    // Basic Information
    title: string;
    date: Timestamp;
    time: string;              // HH:mm format

    // Location & Professional
    location: EventLocation;
    doctor: EventDoctor;

    // Exam-specific (optional)
    examType?: string;
    preparation?: ExamPreparation;

    // Documents
    documents: EventDocuments;

    // Insurance (optional)
    healthInsurance?: HealthInsurance;

    // Recurrence (optional)
    recurrence?: EventRecurrence;

    // OCR Data (optional)
    ocrData?: OCRData;

    // Post-event (optional)
    outcome?: EventOutcome;

    // Notifications
    notifications: EventNotifications;

    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy?: string;        // User ID (for caregiver tracking)
    lastModifiedBy?: string;   // User ID (for caregiver tracking)
}

/**
 * Form Data for Creating/Editing Events
 */
export interface MedicalEventFormData {
    type: EventType;
    title: string;
    date: Date;
    time: string;

    location: {
        name: string;
        address: string;
    };

    doctor: {
        name: string;
        crm?: string;
        specialty?: string;
    };

    examType?: string;
    preparation?: {
        fasting: boolean;
        fastingHours?: number;
        instructions: string[];
    };

    documentsToTake?: string[];

    healthInsurance?: {
        provider: string;
        cardNumber: string;
    };

    recurrence?: {
        enabled: boolean;
        frequency: RecurrenceFrequency;
        interval: number;
        endDate?: Date;
    };

    enableNotifications: boolean;
    customReminders?: Array<{
        type: ReminderType;
        timing: number;
    }>;

    ocrData?: {
        text: string;
        processedDate: Date;
        status: string;
        confidence: number;
    };
}

export const defaultEventFormData: Partial<MedicalEventFormData> = {
    enableNotifications: true,
    type: 'consultation',
    preparation: { fasting: false, instructions: [] },
    doctor: { name: '', crm: '', specialty: '' },
    location: { name: '', address: '' }
};

/**
 * Filter Options for Querying Events
 */
export interface EventFilters {
    type?: EventType;
    status?: EventStatus;
    dateFrom?: Date;
    dateTo?: Date;
    doctorName?: string;
    location?: string;
}

/**
 * Event Statistics
 */
export interface EventStats {
    total: number;
    scheduled: number;
    completed: number;
    missed: number;
    cancelled: number;
    upcomingThisWeek: number;
    upcomingThisMonth: number;
    attendanceRate: number;  // Percentage
}

/**
 * Calendar Event (for calendar display)
 */
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: EventType;
    status: EventStatus;
    color: string;
    allDay: boolean;
}
