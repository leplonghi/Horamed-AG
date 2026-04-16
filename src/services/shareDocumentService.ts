import { db } from "@/integrations/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface SharedDocument {
  ownerId: string;
  documentId: string;
  documentType: "medical_report" | "prescription" | "exam";
  expiresAt: Timestamp;
  createdAt: Timestamp;
  shareId?: string;
}

export async function createShareLink(
  ownerId: string,
  documentId: string,
  documentType: SharedDocument["documentType"],
  expiresInHours = 72
): Promise<string> {
  const expiresAt = Timestamp.fromMillis(
    Date.now() + expiresInHours * 60 * 60 * 1000
  );

  const ref = await addDoc(collection(db, "sharedDocuments"), {
    ownerId,
    documentId,
    documentType,
    expiresAt,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function revokeShareLink(shareId: string): Promise<void> {
  await deleteDoc(doc(db, "sharedDocuments", shareId));
}
