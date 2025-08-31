import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

// Get workers for a site
export async function getWorkers(siteId) {
  const workersRef = collection(db, "sites", siteId, "workers");
  const snapshot = await getDocs(workersRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Add worker to a site
export async function addWorker(siteId, workerData) {
  const workersRef = collection(db, "sites", siteId, "workers");
  const docRef = await addDoc(workersRef, workerData);
  return { id: docRef.id, ...workerData };
}
