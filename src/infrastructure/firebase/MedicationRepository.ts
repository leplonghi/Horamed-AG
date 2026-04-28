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
    // Índice composto necessário: userId ASC, profileId ASC, dueAt ASC, status ASC
    // Definido em firestore.indexes.json
    const constraints: any[] = [
      where("userId", "==", userId),
      where("dueAt", ">=", startDate),
      where("dueAt", "<=", endDate),
    ];

    if (profileId) {
      constraints.push(where("profileId", "==", profileId));
    }

    const q = query(
      collection(db, "dose_instances"),
      ...constraints,
      orderBy("dueAt", "asc")
    );

    try {
      const snapshot = await getDocs(q);
      const doses: Dose[] = [];
      snapshot.forEach(docSnap => {
        doses.push({ id: docSnap.id, ...docSnap.data() } as Dose);
      });
      return doses;
    } catch (error: any) {
      // Erro de índice faltante: loga URL para criar no console Firebase
      if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
        console.error("[MedicationRepository] Índice composto ausente. Acesse:", error.message);
      } else {
        console.error("[MedicationRepository] Erro ao buscar doses:", error);
      }
      throw error;
    }
  }

  /**
   * Busca a primeira dose agendada para amanhã
   */
  async getFirstDoseTomorrow(userId: string, profileId: string | undefined, tomorrowStart: Date, tomorrowEnd: Date): Promise<Dose | null> {
    const constraints: any[] = [
      where("userId", "==", userId)
    ];

    if (profileId) {
      constraints.push(where("profileId", "==", profileId));
    }

    const q = query(
      collection(db, "dose_instances"),
      ...constraints,
      where("dueAt", ">=", tomorrowStart),
      where("dueAt", "<=", tomorrowEnd),
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
    const doseRef = doc(db, "dose_instances", doseId);
    
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
    const doseRef = doc(db, "dose_instances", doseId);
    
    await updateDoc(doseRef, {
      dueAt: Timestamp.fromDate(new Date(newDateIso))
    });
    
    eventBus.emit(AppEvents.DOSE_SNOOZED, { userId, profileId, doseId, newDateIso, itemName });
  }

  /**
   * Marca uma dose como pulada (quando o usuário escolhe não tomar por algum motivo)
   */
  async markDoseAsSkipped(userId: string, profileId: string | undefined, doseId: string, itemName: string): Promise<void> {
    const doseRef = doc(db, "dose_instances", doseId);
    
    await updateDoc(doseRef, {
      status: "skipped",
      skippedAt: Timestamp.now()
    });
    
    eventBus.emit(AppEvents.DOSE_SKIPPED, { userId, profileId, doseId, itemName });
  }

  /**
   * Marca uma dose como perdida (quando o tempo expirou ou o usuário esqueceu)
   */
  async markDoseAsMissed(userId: string, profileId: string | undefined, doseId: string, itemName: string): Promise<void> {
    const doseRef = doc(db, "dose_instances", doseId);
    
    await updateDoc(doseRef, {
      status: "missed",
      missedAt: Timestamp.now()
    });
    
    eventBus.emit(AppEvents.DOSE_MISSED, { userId, profileId, doseId, itemName });
  }
}

export const medicationRepository = new MedicationRepository();
