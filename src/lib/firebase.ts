import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create or update user profile
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        userId: user.uid,
        displayName: user.displayName || 'Anonymous Pilot',
        photoURL: user.photoURL || '',
        wins: 0,
        losses: 0,
        points: 0,
        totalGames: 0,
        updatedAt: new Date().toISOString()
      });
    }
    
    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

export async function getUserStats(uid: string) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

export async function updateMatchResult(uid: string, isWin: boolean) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    wins: isWin ? increment(1) : increment(0),
    losses: isWin ? increment(0) : increment(1),
    points: isWin ? increment(10) : increment(0),
    totalGames: increment(1),
    updatedAt: new Date().toISOString()
  });
}

export async function updateAvatarPreference(uid: string, avatar: { icon: string, color: string }) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    avatarConfig: avatar,
    updatedAt: new Date().toISOString()
  });
}

export async function getTopPlayers() {
  const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

export async function saveReplay(replay: any) {
  const replayRef = doc(collection(db, 'replays'), replay.id);
  await setDoc(replayRef, {
    ...replay,
    createdAt: new Date().toISOString()
  });
}

export async function getReplays() {
  const q = query(collection(db, 'replays'), orderBy('createdAt', 'desc'), limit(20));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

export async function getReplay(id: string) {
  const docRef = doc(db, 'replays', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}
