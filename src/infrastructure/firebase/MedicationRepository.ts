import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy, Timestamp, updateDoc, doc, limit } from "firebase/firestore";
import { Dose } from "@/types/dose";
import { eventBus, AppEvents } from "@/domain/services/EventBus";

/**
 * PadrÃ£o Repository encapsulando as operaÃ§Ãµes complexas do Firebase Firestore
 * Protege a interface (UI) de conhecer detalhes de coleÃ§Ã£o e queries.
 */
export class MedicationRepository {
  /**
   * Busca doses de um perfil especÃ­fico em um intervalo de datas.
   */
  async getDosesByDateRange(userId: string, profileId: string | undefined, startDate: Date, endDate: Date): Promise<Dose[]> {
    // Ãndice composto necessÃ¡rio: userId ASC, profileId ASC, dueAt ASC, status ASC
    // Definido em firestore.indexes.json
    const constraints: any[] = [
      where("userId", "==", userId),
      where("dueAt", ">=", startDate.toISOString()),
      where("dueAt", "<=", endDate.toISOString()),
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
      // Erro de Ã­ndice faltante: loga URL para criar no console Firebase
      if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
        console.error("[MedicationRepository] Ãndice composto ausente. Acesse:", error.message);
      } else {
        console.error("[MedicationRepository] Erro ao buscar doses:", error);
      }
      throw error;
    }
  }

  /**
   * Busca a primeira dose agendada para amanhÃ£
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
      console.error("[MedicationRepository] Erro ao buscar dose de amanhÃ£:", error);
      throw error;
    }
  }

  /**
   * Marca uma dose como confirmada.
   * Dispara um evento global de sistema para audit logs ou gamificaÃ§Ã£o
   */
  async markDoseAsTaken(userId: string, profileId: string | undefined, doseId: string, itemId: string, itemName: string): Promise<void> {
    const doseRef = doc(db, "dose_instances", doseId);
    
    await updateDoc(doseRef, {
      status: "taken",
      takenAt: Timestamp.now()
    });
    
    // Dispara evento pro AppBuilder, Motor de IA ou MÃ³dulo de Estoque pegarem essa aÃ§Ã£o sem ferir SRP
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
   * Marca uma dose como pulada (quando o usuÃ¡rio escolhe nÃ£o tomar por algum motivo)
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
   * Marca uma dose como perdida (quando o tempo expirou ou o usuÃ¡rio esqueceu)
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


