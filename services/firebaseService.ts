
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

const LOCAL_STORAGE_KEY = 'pixel_shots_local_stats';

const calculateRank = (level: number) => {
  const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
  return rank ? rank.name : 'Unranked';
};

const getDefaultStats = (): PlayerStats => ({
  xp: 0,
  level: 1,
  totalKills: 0,
  totalDeaths: 0,
  rank: 'Bronze'
});

const saveLocal = (stats: PlayerStats) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stats));
};

const getLocal = (): PlayerStats => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  return saved ? JSON.parse(saved) : getDefaultStats();
};

export const getPlayerStats = async (playerName: string): Promise<PlayerStats> => {
  try {
    const docRef = doc(db, "players", playerName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as PlayerStats;
      saveLocal(data);
      return data;
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

export const updatePlayerAfterMatch = async (playerName: string, kills: number, deaths: number, won: boolean, xpGained: number) => {
  const localStats = getLocal();
  localStats.totalKills += kills;
  localStats.totalDeaths += deaths;
  localStats.xp += xpGained;
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
      rank: localStats.rank
    });
  } catch (error) {}
};

// --- PRIVATE ROOM SERVICES ---

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createPrivateRoom = async (playerName: string, mode: GameMode): Promise<string> => {
  const code = generateRoomCode();
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
  
  const teamASize = parseInt(roomData.mode.split('v')[0]) || 1;
  const maxPlayers = teamASize + (roomData.mode === '1v5' ? 5 : parseInt(roomData.mode.split('v')[1]));

  if (roomData.players.length >= maxPlayers) throw new Error("ROOM_FULL");
  
  const newPlayer: RoomPlayer = {
    id: 'local_' + Math.random(),
    name: playerName,
    team: roomData.players.length < teamASize ? 'A' : 'B',
    isHost: false,
    ready: true
  };

  const updatedPlayers = [...roomData.players, newPlayer];
  await updateDoc(doc(db, "rooms", roomData.id), { players: updatedPlayers });
  return roomData.id;
};

export const listenToRoom = (roomId: string, callback: (room: Room) => void) => {
  return onSnapshot(doc(db, "rooms", roomId), (doc) => {
    if (doc.exists()) callback(doc.data() as Room);
  });
};

// --- CHAT SERVICES ---

export const sendChatMessage = async (text: string, sender: string, roomId: string = 'global', team?: 'A' | 'B') => {
  const chatColl = collection(db, "chats", roomId, "messages");
  await addDoc(chatColl, {
    sender,
    text,
    team: team || null,
    timestamp: serverTimestamp()
  });
};

export const listenToChat = (roomId: string, callback: (msgs: ChatMessage[]) => void) => {
  const chatColl = collection(db, "chats", roomId, "messages");
  const q = query(chatColl, orderBy("timestamp", "asc"), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    callback(messages);
  });
};
