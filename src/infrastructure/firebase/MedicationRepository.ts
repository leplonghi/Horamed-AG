import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy, Timestamp, updateDoc, doc, limit } from "firebase/firestore";
import { Dose } from "@/types/dose";
import { eventBus, AppEvents } from "@/domain/services/EventBus";

/**
 * Padrão Repository encapsulando as operações complexas do Firebase Firestore
 * Protege a interface (UI) de conhecer detalhes de coleção e queries.
 */
export class MedicationRepository {
  /**
   * Busca doses de um perfil específico em um intervalo de datas.
   */
  async getDosesByDateRange(userId: string, profileId: string | undefined, startDate: Date, endDate: Date): Promise<Dose[]> {
    const basePath = profileId 
      ? `users/${userId}/profiles/${profileId}/doses` 
      : `users/${userId}/doses`;
      
    const q = query(
      collection(db, basePath),
      where("dueAt", ">=", startDate.toISOString()),
      where("dueAt", "<=", endDate.toISOString()),
      orderBy("dueAt", "asc")
    );
    
    try {
      const snapshot = await getDocs(q);
      const doses: Dose[] = [];
      snapshot.forEach(docSnap => {
        doses.push({ id: docSnap.id, ...docSnap.data() } as Dose);
      });
      return doses;
    } catch (error) {
      console.error("[MedicationRepository] Erro ao buscar doses:", error);
      throw error;
    }
  }

  /**
   * Busca a primeira dose agendada para amanhã
   */
  async getFirstDoseTomorrow(userId: string, profileId: string | undefined, tomorrowStart: Date, tomorrowEnd: Date): Promise<Dose | null> {
    const basePath = profileId 
      ? `users/${userId}/profiles/${profileId}/doses` 
      : `users/${userId}/doses`;
      
    const q = query(
      collection(db, basePath),
      where("dueAt", ">=", tomorrowStart.toISOString()),
      where("dueAt", "<=", tomorrowEnd.toISOString()),
      where("status", "==", "scheduled"),
      orderBy("dueAt", "asc"),
      limit(1)
    );
    
    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Dose;
      }
      return null;
    } catch (error) {
      console.error("[MedicationRepository] Erro ao buscar dose de amanhã:", error);
      throw error;
    }
  }

  /**
   * Marca uma dose como confirmada.
   * Dispara um evento global de sistema para audit logs ou gamificação
   */
  async markDoseAsTaken(userId: string, profileId: string | undefined, doseId: string, itemId: string, itemName: string): Promise<void> {
    const basePath = profileId 
      ? `users/${userId}/profiles/${profileId}/doses` 
      : `users/${userId}/doses`;
      
    const doseRef = doc(db, basePath, doseId);
    
    await updateDoc(doseRef, {
      status: "taken",
      takenAt: Timestamp.now()
    });
    
    // Dispara evento pro AppBuilder, Motor de IA ou Módulo de Estoque pegarem essa ação sem ferir SRP
    eventBus.emit(AppEvents.DOSE_TAKEN, { userId, profileId, doseId, itemId, itemName });
  }

  /**
   * Adia a dose por X minutos
   */
  async snoozeDose(userId: string, profileId: string | undefined, doseId: string, newDateIso: string, itemName: string): Promise<void> {
    const basePath = profileId 
      ? `users/${userId}/profiles/${profileId}/doses` 
      : `users/${userId}/doses`;
      
    const doseRef = doc(db, basePath, doseId);
    
    await updateDoc(doseRef, {
      dueAt: newDateIso
    });
    
    eventBus.emit(AppEvents.DOSE_SNOOZED, { userId, profileId, doseId, newDateIso, itemName });
  }
}

export const medicationRepository = new MedicationRepository();
