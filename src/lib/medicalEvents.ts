import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
    QueryConstraint,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { safeDateParse, safeGetTime } from "@/lib/safeDateUtils";
import type {
    MedicalEvent,
    MedicalEventFormData,
    EventFilters,
    EventStats,
    EventStatus,
    EventType,
} from '../types/medicalEvents';

const COLLECTION_NAME = 'medicalEvents';

/**
 * Create a new medical event
 */
export const createMedicalEvent = async (
    userId: string,
    formData: MedicalEventFormData,
    createdBy?: string
): Promise<string> => {
    try {
        const now = Timestamp.now();
        const eventDate = Timestamp.fromDate(formData.date);

        // Default reminders based on event type
        const defaultReminders: { type: 'general' | 'preparation' | 'documents'; timing: number; sent: boolean }[] = formData.enableNotifications
            ? [
                { type: 'general', timing: 10080, sent: false }, // 1 week before
                { type: 'general', timing: 1440, sent: false },  // 1 day before
                { type: 'general', timing: 120, sent: false },   // 2 hours before
            ]
            : [];

        // Add preparation reminder if fasting required
        if (formData.preparation?.fasting) {
            const fastingHours = formData.preparation.fastingHours || 8;
            const fastingReminderTiming = fastingHours * 60; // Convert to minutes
            defaultReminders.push({
                type: 'preparation' as const,
                timing: fastingReminderTiming,
                sent: false,
            });
        }

        // Add document reminder
        if (formData.documentsToTake && formData.documentsToTake.length > 0) {
            defaultReminders.push({
                type: 'documents' as const,
                timing: 1440, // 1 day before
                sent: false,
            });
        }

        const eventData: Omit<MedicalEvent, 'id'> = {
            userId,
            type: formData.type,
            status: 'scheduled',
            title: formData.title,
            date: eventDate,
            time: formData.time,
            location: {
                name: formData.location.name,
                address: formData.location.address,
            },
            doctor: {
                name: formData.doctor.name,
                crm: formData.doctor.crm,
                specialty: formData.doctor.specialty,
            },
            examType: formData.examType,
            preparation: formData.preparation,
            documents: {
                toTake: formData.documentsToTake || [],
                attachments: [],
            },
            healthInsurance: formData.healthInsurance,
            recurrence: formData.recurrence
                ? {
                    enabled: formData.recurrence.enabled,
                    frequency: formData.recurrence.frequency,
                    interval: formData.recurrence.interval,
                    endDate: formData.recurrence.endDate
                        ? Timestamp.fromDate(formData.recurrence.endDate)
                        : undefined,
                }
                : undefined,
            notifications: {
                enabled: formData.enableNotifications,
                reminders: formData.customReminders
                    ? formData.customReminders.map(r => ({ ...r, sent: false }))
                    : defaultReminders,
            },
            createdAt: now,
            updatedAt: now,
            createdBy: createdBy || userId,
            lastModifiedBy: createdBy || userId,
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), eventData);

        // If recurrence is enabled, create future occurrences
        if (formData.recurrence?.enabled) {
            await createRecurringEvents(docRef.id, eventData, formData.recurrence);
        }

        return docRef.id;
    } catch (error) {
        console.error('Error creating medical event:', error);
        throw new Error('Failed to create medical event');
    }
};

/**
 * Create recurring events
 */
const createRecurringEvents = async (
    parentId: string,
    baseEvent: Omit<MedicalEvent, 'id'>,
    recurrence: NonNullable<MedicalEventFormData['recurrence']>
): Promise<void> => {

    const batch = writeBatch(db);
    const maxOccurrences = 52; // Limit to 1 year of weekly events
    const currentDate = baseEvent.date.toDate();
    let occurrenceCount = 0;

    while (occurrenceCount < maxOccurrences) {
        // Calculate next occurrence
        switch (recurrence.frequency) {
            case 'weekly':
                currentDate.setDate(currentDate.getDate() + 7 * recurrence.interval);
                break;
            case 'monthly':
                currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
                break;
            case 'yearly':
                currentDate.setFullYear(currentDate.getFullYear() + recurrence.interval);
                break;
        }

        // Check if we've reached the end date
        if (recurrence.endDate && currentDate > recurrence.endDate) {
            break;
        }

        // Create new event
        const newEventRef = doc(collection(db, COLLECTION_NAME));
        const newEvent = {
            ...baseEvent,
            date: Timestamp.fromDate(safeDateParse(currentDate)),
            notifications: {
                ...baseEvent.notifications,
                reminders: baseEvent.notifications.reminders.map((r) => ({ ...r, sent: false })),
            },
        };

        batch.set(newEventRef, newEvent);
        occurrenceCount++;
    }

    await batch.commit();
};

/**
 * Update an existing medical event
 */
export const updateMedicalEvent = async (
    eventId: string,
    updates: Partial<MedicalEventFormData>,
    modifiedBy?: string
): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        const updateData: Record<string, unknown> = {
            updatedAt: Timestamp.now(),
            lastModifiedBy: modifiedBy,
        };

        // Map form data to database structure
        if (updates.title) updateData.title = updates.title;
        if (updates.date) updateData.date = Timestamp.fromDate(updates.date);
        if (updates.time) updateData.time = updates.time;
        if (updates.type) updateData.type = updates.type;
        if (updates.location) updateData.location = updates.location;
        if (updates.doctor) updateData.doctor = updates.doctor;
        if (updates.examType !== undefined) updateData.examType = updates.examType;
        if (updates.preparation !== undefined) updateData.preparation = updates.preparation;
        if (updates.documentsToTake !== undefined) {
            updateData['documents.toTake'] = updates.documentsToTake;
        }
        if (updates.healthInsurance !== undefined) {
            updateData.healthInsurance = updates.healthInsurance;
        }

        await updateDoc(eventRef, updateData);
    } catch (error) {
        console.error('Error updating medical event:', error);
        throw new Error('Failed to update medical event');
    }
};

/**
 * Update event status
 */
export const updateEventStatus = async (
    eventId: string,
    status: EventStatus
): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        await updateDoc(eventRef, {
            status,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error updating event status:', error);
        throw new Error('Failed to update event status');
    }
};

/**
 * Mark event as completed with outcome
 */
export const completeEvent = async (
    eventId: string,
    outcome: {
        attended: boolean;
        notes: string;
        newMedications?: string[];
        newExamsRequested?: string[];
    }
): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        await updateDoc(eventRef, {
            status: outcome.attended ? 'completed' : 'missed',
            outcome: {
                ...outcome,
                completedAt: Timestamp.now(),
            },
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error completing event:', error);
        throw new Error('Failed to complete event');
    }
};

/**
 * Delete a medical event
 */
export const deleteMedicalEvent = async (eventId: string): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error('Error deleting medical event:', error);
        throw new Error('Failed to delete medical event');
    }
};

/**
 * Get a single medical event by ID
 */
export const getMedicalEvent = async (eventId: string): Promise<MedicalEvent | null> => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
            return null;
        }

        return {
            id: eventSnap.id,
            ...eventSnap.data(),
        } as MedicalEvent;
    } catch (error) {
        console.error('Error getting medical event:', error);
        throw new Error('Failed to get medical event');
    }
};

/**
 * Get all medical events for a user with optional filters
 */
export const getMedicalEvents = async (
    userId: string,
    filters?: EventFilters
): Promise<MedicalEvent[]> => {
    try {
        const constraints: QueryConstraint[] = [where('userId', '==', userId)];

        // Apply filters
        if (filters?.type) {
            constraints.push(where('type', '==', filters.type));
        }
        if (filters?.status) {
            constraints.push(where('status', '==', filters.status));
        }
        if (filters?.dateFrom) {
            constraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
        }
        if (filters?.dateTo) {
            constraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)));
        }

        // Order by date (most recent first)
        constraints.push(orderBy('date', 'desc'));

        const q = query(collection(db, COLLECTION_NAME), ...constraints);
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(
            (doc) =>
            ({
                id: doc.id,
                ...doc.data(),
            } as MedicalEvent)
        );
    } catch (error) {
        console.error('Error getting medical events:', error);
        throw new Error('Failed to get medical events');
    }
};

/**
 * Get upcoming events (scheduled events in the future)
 */
export const getUpcomingEvents = async (
    userId: string,
    limitCount: number = 10
): Promise<MedicalEvent[]> => {
    try {
        const now = Timestamp.now();
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('status', '==', 'scheduled'),
            where('date', '>=', now),
            orderBy('date', 'asc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(
            (doc) =>
            ({
                id: doc.id,
                ...doc.data(),
            } as MedicalEvent)
        );
    } catch (error) {
        console.error('Error getting upcoming events:', error);
        throw new Error('Failed to get upcoming events');
    }
};

/**
 * Get event statistics for a user
 */
export const getEventStats = async (userId: string): Promise<EventStats> => {
    try {
        const events = await getMedicalEvents(userId);
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const stats: EventStats = {
            total: events.length,
            scheduled: events.filter((e) => e.status === 'scheduled').length,
            completed: events.filter((e) => e.status === 'completed').length,
            missed: events.filter((e) => e.status === 'missed').length,
            cancelled: events.filter((e) => e.status === 'cancelled').length,
            upcomingThisWeek: events.filter(
                (e) =>
                    e.status === 'scheduled' &&
                    e.date.toDate() >= now &&
                    e.date.toDate() <= oneWeekFromNow
            ).length,
            upcomingThisMonth: events.filter(
                (e) =>
                    e.status === 'scheduled' &&
                    e.date.toDate() >= now &&
                    e.date.toDate() <= oneMonthFromNow
            ).length,
            attendanceRate: 0,
        };

        // Calculate attendance rate
        const totalPastEvents = stats.completed + stats.missed;
        if (totalPastEvents > 0) {
            stats.attendanceRate = (stats.completed / totalPastEvents) * 100;
        }

        return stats;
    } catch (error) {
        console.error('Error getting event stats:', error);
        throw new Error('Failed to get event stats');
    }
};

/**
 * Subscribe to real-time updates for user's events
 */
export const subscribeToMedicalEvents = (
    userId: string,
    callback: (events: MedicalEvent[]) => void,
    filters?: EventFilters
): (() => void) => {
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];

    if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
    }
    if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('date', 'desc'));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);

    return onSnapshot(
        q,
        (snapshot) => {
            const events = snapshot.docs.map(
                (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as MedicalEvent)
            );
            callback(events);
        },
        (error) => {
            console.error('Error in medical events subscription:', error);
        }
    );
};

/**
 * Add OCR data to an event
 */
export const addOCRData = async (
    eventId: string,
    ocrData: {
        originalImage: string;
        extractedText: string;
        confidence: number;
    }
): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        await updateDoc(eventRef, {
            ocrData: {
                ...ocrData,
                reviewedByUser: false,
                extractedAt: Timestamp.now(),
            },
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error adding OCR data:', error);
        throw new Error('Failed to add OCR data');
    }
};

/**
 * Mark OCR data as reviewed
 */
export const markOCRReviewed = async (eventId: string): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTION_NAME, eventId);
        await updateDoc(eventRef, {
            'ocrData.reviewedByUser': true,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error marking OCR as reviewed:', error);
        throw new Error('Failed to mark OCR as reviewed');
    }
};
