import { db } from '@/integrations/firebase/client';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';

export type GeneralFeeling = 'great' | 'okay' | 'poor';
export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

export interface SymptomLog {
    id?: string;
    userId: string;
    date: Date;
    generalFeeling: GeneralFeeling;
    symptoms: string[];
    severity?: SymptomSeverity;
    notes?: string;
    correlatedMedications?: string[];
    createdAt?: Date;
}

export const symptomService = {
    /**
     * Log a new daily check-in / symptom report
     */
    async logSymptom(log: Omit<SymptomLog, 'id' | 'createdAt'>): Promise<string> {
        try {
            const logsRef = collection(db, 'symptom_logs');
            const docRef = await addDoc(logsRef, {
                ...log,
                createdAt: Timestamp.now(),
                date: Timestamp.fromDate(log.date),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error logging symptom:', error);
            throw error;
        }
    },

    /**
     * Fetch a user's symptom logs within a specific date range
     */
    async getLogsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<SymptomLog[]> {
        try {
            const logsRef = collection(db, 'symptom_logs');
            const q = query(
                logsRef,
                where('userId', '==', userId),
                where('date', '>=', Timestamp.fromDate(startDate)),
                where('date', '<=', Timestamp.fromDate(endDate)),
                orderBy('date', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    date: data.date.toDate(),
                    generalFeeling: data.generalFeeling,
                    symptoms: data.symptoms || [],
                    severity: data.severity,
                    notes: data.notes,
                    correlatedMedications: data.correlatedMedications || [],
                    createdAt: data.createdAt?.toDate(),
                } as SymptomLog;
            });
        } catch (error) {
            console.error('Error fetching symptom logs:', error);
            throw error;
        }
    },

    /**
     * Check if user has already logged symptoms today
     */
    async hasLoggedToday(userId: string): Promise<boolean> {
        try {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const logsRef = collection(db, 'symptom_logs');
            const q = query(
                logsRef,
                where('userId', '==', userId),
                where('date', '>=', Timestamp.fromDate(startOfToday)),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking today\'s symptom log:', error);
            return false;
        }
    }
};
