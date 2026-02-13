
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, onSnapshot, query, where, limit, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { PlayerStats, Room, GameMode, RoomPlayer, ChatMessage } from "../types";
import { RANKS, LEVEL_XP_BASE } from "../constants";

const firebaseConfig = {
  apiKey: "AIzaSyD3yQ1ngnDbp1GliXrEkvU0qfynA3id5J8",
  authDomain: "mmmm-ee99d.firebaseapp.com",
  projectId: "mmmm-ee99d",
  storageBucket: "mmmm-ee99d.firebasestorage.app",
  messagingSenderId: "694489724942",
  appId: "1:694489724942:web:af8c9765fd953ec7b2645f",
  measurementId: "G-NDM87DMCEM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LOCAL_STORAGE_KEY = 'pixel_shots_local_stats_v2';

const calculateRank = (level: number) => {
  const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
  return rank ? rank.name : 'Unranked';
};

const getDefaultStats = (): PlayerStats => ({
  xp: 0,
  level: 1,
  totalKills: 0,
  totalDeaths: 0,
  rank: 'Bronze',
  coins: 500,
  diamonds: 0,
  equippedSkin: 'default',
  ownedSkins: ['default'],
  isBanned: false
});

const saveLocal = (stats: PlayerStats) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stats));
};

const getLocal = (): PlayerStats => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return getDefaultStats();
  try {
    const parsed = JSON.parse(saved);
    return { ...getDefaultStats(), ...parsed };
  } catch (e) {
    return getDefaultStats();
  }
};

export const getPlayerStats = async (playerName: string): Promise<PlayerStats> => {
  try {
    const docRef = doc(db, "players", playerName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as PlayerStats;
      const completeStats = { ...getDefaultStats(), ...data };
      saveLocal(completeStats);
      return completeStats;
    } else {
      const newStats = getDefaultStats();
      await setDoc(docRef, newStats);
      saveLocal(newStats);
      return newStats;
    }
  } catch (error) {
    return getLocal();
  }
};

export const banPlayer = async (playerName: string) => {
  const localStats = getLocal();
  localStats.isBanned = true;
  saveLocal(localStats);
  try {
    const docRef = doc(db, "players", playerName);
    await updateDoc(docRef, { isBanned: true });
  } catch (error) {
    console.error("Ban sync failed:", error);
  }
};

export const resetIdentity = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem('pixel_shots_last_name');
  window.location.reload();
};

export const updatePlayerAfterMatch = async (playerName: string, kills: number, deaths: number, won: boolean, xpGained: number, coinsGained: number) => {
  const localStats = getLocal();
  if (localStats.isBanned) return;

  localStats.totalKills += kills;
  localStats.totalDeaths += deaths;
  localStats.xp += xpGained;
  localStats.coins += coinsGained;

  while (localStats.xp >= localStats.level * LEVEL_XP_BASE) {
    localStats.xp -= localStats.level * LEVEL_XP_BASE;
    localStats.level++;
  }
  localStats.rank = calculateRank(localStats.level);
  saveLocal(localStats);

  try {
    const docRef = doc(db, "players", playerName);
    await updateDoc(docRef, {
      xp: localStats.xp,
      level: localStats.level,
      totalKills: increment(kills),
      totalDeaths: increment(deaths),
      coins: localStats.coins,
      rank: localStats.rank
    });
  } catch (error) {}
};

export const buySkin = async (playerName: string, skinId: string, costCoins: number, costDiamonds: number) => {
  const stats = getLocal();
  if (stats.isBanned) return false;
  if (stats.coins >= costCoins && stats.diamonds >= costDiamonds) {
    stats.coins -= costCoins;
    stats.diamonds -= costDiamonds;
    if (!stats.ownedSkins.includes(skinId)) {
      stats.ownedSkins.push(skinId);
    }
    saveLocal(stats);
    try {
      const docRef = doc(db, "players", playerName);
      await updateDoc(docRef, {
        coins: stats.coins,
        diamonds: stats.diamonds,
        ownedSkins: stats.ownedSkins
      });
      return true;
    } catch (e) { return true; }
  }
  return false;
};

export const buyDiamonds = async (playerName: string, amount: number) => {
  const stats = getLocal();
  if (stats.isBanned) return false;
  stats.diamonds += amount;
  saveLocal(stats);
  try {
    const docRef = doc(db, "players", playerName);
    await updateDoc(docRef, { diamonds: stats.diamonds });
    return true;
  } catch (e) { return true; }
};

export const equipSkin = async (playerName: string, skinId: string) => {
  const stats = getLocal();
  if (stats.isBanned) return;
  stats.equippedSkin = skinId;
  saveLocal(stats);
  try {
    const docRef = doc(db, "players", playerName);
    await updateDoc(docRef, { equippedSkin: skinId });
  } catch (e) {}
};

export const createPrivateRoom = async (playerName: string, mode: GameMode): Promise<string> => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const roomId = `room_${Date.now()}`;
  const room: Room = {
    id: roomId,
    code,
    mode,
    status: 'waiting',
    players: [{ id: 'local_' + Math.random(), name: playerName, team: 'A', isHost: true, ready: true }],
    createdAt: Date.now()
  };
  await setDoc(doc(db, "rooms", roomId), room);
  return roomId;
};

export const joinPrivateRoom = async (playerName: string, code: string): Promise<string> => {
  const q = query(collection(db, "rooms"), where("code", "==", code.toUpperCase()), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) throw new Error("ROOM_NOT_FOUND");
  const roomDoc = querySnapshot.docs[0];
  const roomData = roomDoc.data() as Room;
  const newPlayer: RoomPlayer = { id: 'local_' + Math.random(), name: playerName, team: 'A', isHost: false, ready: true };
  const updatedPlayers = [...roomData.players, newPlayer];
  await updateDoc(doc(db, "rooms", roomData.id), { players: updatedPlayers });
  return roomData.id;
};

export const listenToRoom = (roomId: string, callback: (room: Room) => void) => {
  return onSnapshot(doc(db, "rooms", roomId), (doc) => { if (doc.exists()) callback(doc.data() as Room); });
};

export const sendChatMessage = async (text: string, sender: string, roomId: string = 'global', team?: 'A' | 'B') => {
  const chatColl = collection(db, "chats", roomId, "messages");
  await addDoc(chatColl, { sender, text, team: team || null, timestamp: serverTimestamp() });
};

export const listenToChat = (roomId: string, callback: (msgs: ChatMessage[]) => void) => {
  const q = query(collection(db, "chats", roomId, "messages"), orderBy("timestamp", "asc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[]);
  });
};
