import { expect, test } from "@playwright/test";
import { deleteDoc, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyANAp02TgbOEdONXxZQiluFb1nbON8os5E",
  authDomain: "dr-mjoli.firebaseapp.com",
  projectId: "dr-mjoli",
  storageBucket: "dr-mjoli.firebasestorage.app",
  messagingSenderId: "211488805925",
  appId: "1:211488805925:web:f05614e58622785ee29bcc",
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);
const latestExtractedPatientDraftRef = doc(
  firestoreDb,
  "development_state",
  "latest_extracted_patient",
);

test("latest extracted patient draft autofills a fresh device session", async ({ page }) => {
  const suffix = Date.now();
  const patientName = `Draft Sync ${suffix}`;
  const patientId = `SYNC-${suffix}`;
  const previousSnapshot = await getDoc(latestExtractedPatientDraftRef);

  try {
    await setDoc(
      latestExtractedPatientDraftRef,
      {
        patientInfo: {
          name: patientName,
          patientId,
          stickerMode: true,
          stickerExtractionStatus: "success",
          stickerLastExtractedAt: new Date().toISOString(),
        },
        schemaVersion: 1,
        updatedAtIso: new Date().toISOString(),
      },
      { merge: true },
    );

    await page.goto("/");
    await page.getByRole("tab", { name: "Appendicectomy" }).click();

    await expect(page.getByPlaceholder("Enter Patient Name").first()).toHaveValue(patientName, {
      timeout: 20_000,
    });
    await expect(page.getByPlaceholder("Enter Patient ID").first()).toHaveValue(patientId, {
      timeout: 20_000,
    });
  } finally {
    if (previousSnapshot.exists()) {
      await setDoc(latestExtractedPatientDraftRef, previousSnapshot.data());
    } else {
      await deleteDoc(latestExtractedPatientDraftRef);
    }
  }
});
