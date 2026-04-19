import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type TutorialFlags = Record<string, boolean>;

export async function getTutorialFlags(): Promise<TutorialFlags> {
  const user = auth.currentUser;
  if (!user) return {};

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return {};
  const data = snap.data() as { tutorialFlags?: TutorialFlags };
  return data.tutorialFlags ?? {};
}

export async function isTutorialFlagSet(key: string): Promise<boolean> {
  const flags = await getTutorialFlags();
  return !!flags[key];
}

export async function setTutorialFlag(key: string, value = true): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid),
    { tutorialFlags: { [key]: value } },
    { merge: true }
  );
}
