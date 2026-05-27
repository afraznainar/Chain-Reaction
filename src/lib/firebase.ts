import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
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
    
    return { user, accessToken };
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

export async function getUserStats(uid: string) {
  const userRef = doc(db, 'users', uid);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      localStorage.setItem(`user_stats_${uid}`, JSON.stringify(data));
      return data;
    }
    return null;
  } catch (error) {
    console.warn("getUserStats failed because client might be offline, checking local storage cache:", error);
    const cached = localStorage.getItem(`user_stats_${uid}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
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

// Tournament Logic
export async function getTournamentParticipant(uid: string) {
  const participantRef = doc(db, 'tournament_participants', uid);
  const snap = await getDoc(participantRef);
  return snap.exists() ? snap.data() : null;
}

export async function joinTournament(user: any, avatar: any, isSecondChance: boolean = false) {
  const participantRef = doc(db, 'tournament_participants', user.uid);
  const data = {
    userId: user.uid,
    username: user.displayName || 'Anonymous',
    avatar: avatar || { icon: 'user', color: '#ffffff' },
    score: 0,
    status: 'active',
    chancesUsed: isSecondChance ? 1 : 0,
    joinedAt: new Date().toISOString()
  };
  await setDoc(participantRef, data);
  return data;
}

export async function getTournamentLeaderboard() {
  const q = query(
    collection(db, 'tournament_participants'), 
    orderBy('score', 'desc'), 
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data());
}

export async function updateTournamentScore(uid: string, points: number, isWin: boolean) {
  const participantRef = doc(db, 'tournament_participants', uid);
  const snap = await getDoc(participantRef);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.status === 'eliminated') return;

  if (isWin) {
    await updateDoc(participantRef, {
      score: increment(points)
    });
  } else {
    await updateDoc(participantRef, {
      status: 'eliminated'
    });
  }
}

// AI vs Player Challenge types and helpers

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function joinAiChallenge(uid: string) {
  const userRef = doc(db, 'users', uid);
  const pathStr = `users/${uid}`;
  try {
    await updateDoc(userRef, {
      hasAiChallengeEntry: true,
      aiChallengeGamesPlayed: 0,
      aiChallengeWins: 0,
      aiChallengeCompleted: false,
      aiChallengeSuccess: false,
      aiChallengeJoinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pathStr);
  }
}

export async function updateUsdtWalletAddress(uid: string, wallet: string) {
  const userRef = doc(db, 'users', uid);
  const pathStr = `users/${uid}`;
  try {
    await updateDoc(userRef, {
      usdtWalletAddress: wallet,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pathStr);
  }
}

export async function updateAiChallengeResult(uid: string, isWin: boolean) {
  const userRef = doc(db, 'users', uid);
  const pathStr = `users/${uid}`;
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (!data.hasAiChallengeEntry) return;

    // Increment local game count, cap at 10
    const currentPlayed = data.aiChallengeGamesPlayed || 0;
    const currentWins = data.aiChallengeWins || 0;

    if (currentPlayed >= 10) return; // Already finished this challenge run

    const nextPlayed = currentPlayed + 1;
    const nextWins = isWin ? currentWins + 1 : currentWins;

    const completed = nextPlayed === 10;
    const success = completed && nextWins === 10;

    await updateDoc(userRef, {
      aiChallengeGamesPlayed: nextPlayed,
      aiChallengeWins: nextWins,
      aiChallengeCompleted: completed,
      aiChallengeSuccess: success,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pathStr);
  }
}

export async function getAiChallengeLeaderboard() {
  const pathStr = 'users';
  try {
    const q = query(collection(db, 'users'), limit(100));
    const querySnapshot = await getDocs(q);
    const leaderboardData = querySnapshot.docs
      .map(doc => doc.data())
      .filter(u => u.hasAiChallengeEntry || (u.aiChallengeWins !== undefined && u.aiChallengeWins > 0))
      .sort((a: any, b: any) => {
        // 1. Success 10/10 at the top
        const is_a_conq = a.aiChallengeSuccess === true || (a.aiChallengeWins === 10 && a.aiChallengeGamesPlayed === 10);
        const is_b_conq = b.aiChallengeSuccess === true || (b.aiChallengeWins === 10 && b.aiChallengeGamesPlayed === 10);
        if (is_a_conq && !is_b_conq) return -1;
        if (!is_a_conq && is_b_conq) return 1;

        // 2. Sort by wins desc
        const winsA = a.aiChallengeWins || 0;
        const winsB = b.aiChallengeWins || 0;
        if (winsA !== winsB) return winsB - winsA;

        // 3. Sort by fewer games played to reflect higher win ratio
        const gamesA = a.aiChallengeGamesPlayed || 0;
        const gamesB = b.aiChallengeGamesPlayed || 0;
        return gamesA - gamesB;
      });
    localStorage.setItem('ai_challenge_leaderboard', JSON.stringify(leaderboardData));
    return leaderboardData;
  } catch (error) {
    console.warn("getAiChallengeLeaderboard failed because client might be offline, checking local storage cache:", error);
    const cached = localStorage.getItem('ai_challenge_leaderboard');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}
