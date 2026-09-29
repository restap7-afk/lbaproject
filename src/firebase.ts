import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore using the provisioned database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIRESTORE_DB_ID = firebaseConfig.firestoreDatabaseId;

// Validate connection to Firestore on initial boot (Mandatory per Firebase Skill)
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'lba_system', 'health'));
    return { connected: true, message: 'Google Cloud Firestore aktif dan tersambung.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration:', error.message);
      return { connected: false, message: 'Koneksi client offline ke Firebase Firestore.' };
    }
    // If permission or not found, it reached the server successfully
    return { connected: true, message: 'Google Cloud Firestore terhubung.' };
  }
}
