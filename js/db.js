import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

// Collection references
const SERVICES_COLLECTION = "services";
const STYLISTS_COLLECTION = "stylists";
const USERS_COLLECTION = "users";
const BOOKINGS_COLLECTION = "bookings";

// =======================
// SERVICES
// =======================

export async function getServices() {
  const snapshot = await getDocs(collection(db, SERVICES_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addService(serviceData) {
  // If we want to push with an auto-generated ID:
  const docRef = await addDoc(collection(db, SERVICES_COLLECTION), serviceData);
  return { id: docRef.id, ...serviceData };
}

export async function updateService(id, serviceData) {
  const docRef = doc(db, SERVICES_COLLECTION, id);
  await updateDoc(docRef, serviceData);
}

export async function deleteService(id) {
  const docRef = doc(db, SERVICES_COLLECTION, id);
  await deleteDoc(docRef);
}

// =======================
// STYLISTS
// =======================

export async function getStylists() {
  const snapshot = await getDocs(collection(db, STYLISTS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addStylist(stylistData) {
  const docRef = await addDoc(collection(db, STYLISTS_COLLECTION), stylistData);
  return { id: docRef.id, ...stylistData };
}

export async function updateStylist(id, stylistData) {
  const docRef = doc(db, STYLISTS_COLLECTION, id);
  await updateDoc(docRef, stylistData);
}

export async function deleteStylist(id) {
  const docRef = doc(db, STYLISTS_COLLECTION, id);
  await deleteDoc(docRef);
}

// =======================
// USERS
// =======================

export async function getUserProfile(uid) {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { uid: snapshot.id, ...snapshot.data() };
  }
  return null;
}

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function saveUserProfile(uid, profileData) {
  const docRef = doc(db, USERS_COLLECTION, uid);
  // use merge to update existing fields or create new doc
  await setDoc(docRef, profileData, { merge: true });
}

// =======================
// BOOKINGS
// =======================

export async function getUserBookings(uid) {
  const q = query(collection(db, BOOKINGS_COLLECTION), where("userId", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllBookings() {
  const q = query(collection(db, BOOKINGS_COLLECTION));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createBooking(bookingData) {
  const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingData);
  return { id: docRef.id, ...bookingData };
}

export async function updateBooking(id, updateData) {
  const docRef = doc(db, BOOKINGS_COLLECTION, id);
  await updateDoc(docRef, updateData);
}

export async function cancelBooking(id) {
  const docRef = doc(db, BOOKINGS_COLLECTION, id);
  // Setting status to cancelled/completed depending on logic.
  // The UI moves it to 'completed' list after canceling so we follow suit or set 'cancelled'.
  // Let's set it to 'cancelled' or delete. The mock data had 'upcoming' or 'completed'.
  // Let's just update the status.
  await updateDoc(docRef, { status: "completed" });
}
