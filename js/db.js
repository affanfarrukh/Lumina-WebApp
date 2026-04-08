import {
  db,
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
  addDoc,
  serverTimestamp
} from "./firebase-init.js";

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

export async function getServiceById(id) {
  const docRef = doc(db, SERVICES_COLLECTION, id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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

export async function getStylistById(id) {
  const docRef = doc(db, STYLISTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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

// =======================
// REVIEWS
// =======================

export async function getAllReviews() {
  const snapshot = await getDocs(collection(db, "reviews"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getReviewsByService(serviceId) {
  const q = query(
    collection(db, "reviews"),
    where("serviceId", "==", serviceId)
    // removed orderBy to avoid index requirement, we sort in JS
  );
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort by createdAt desc in JS (handling potential nulls/missing fields)
  return reviews.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function addReview(reviewData) {
  // reviewData: { serviceId, userId, userName, rating, comment }
  const data = {
    ...reviewData,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, "reviews"), data);
  
  // Update service totals
  const serviceRef = doc(db, SERVICES_COLLECTION, reviewData.serviceId);
  const serviceSnap = await getDoc(serviceRef);
  
  if (serviceSnap.exists()) {
    const service = serviceSnap.data();
    const oldRating = service.ratings || 0;
    const oldCount = service.reviews || 0;
    
    // Simple average calculation
    const newCount = oldCount + 1;
    const newRating = ((oldRating * oldCount) + reviewData.rating) / newCount;
    
    await updateDoc(serviceRef, {
      ratings: parseFloat(newRating.toFixed(1)),
      reviews: newCount
    });
  }
  
  return { id: docRef.id, ...data };
}

// =======================
// STYLIST REVIEWS
// =======================

export async function getReviewsByStylist(stylistId) {
  const q = query(
    collection(db, "stylist_reviews"),
    where("stylistId", "==", stylistId)
  );
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return reviews.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getAllStylistReviews() {
  const snapshot = await getDocs(collection(db, "stylist_reviews"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addStylistReview(reviewData) {
  const data = {
    ...reviewData,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, "stylist_reviews"), data);
  
  // Update stylist totals
  const stylistRef = doc(db, STYLISTS_COLLECTION, reviewData.stylistId);
  const stylistSnap = await getDoc(stylistRef);
  
  if (stylistSnap.exists()) {
    const stylist = stylistSnap.data();
    const oldRating = stylist.rating || 0;
    const oldCount = stylist.reviews || 0;
    
    const newCount = oldCount + 1;
    const newRating = ((oldRating * oldCount) + reviewData.rating) / newCount;
    
    await updateDoc(stylistRef, {
      rating: parseFloat(newRating.toFixed(1)),
      reviews: newCount
    });
  }
  
  return { id: docRef.id, ...data };
}
