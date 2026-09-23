import { promises as fs } from "fs";
import path from "path";

export type Checkin = {
  id: string;
  date: string;
  valence: number;
  energy: number;
  note?: string;
};

export type Post = {
  id: string;
  name: string;
  quote: string;
  art: string;
  dot: string;
  likes: number;
  createdAt: string;
};

type DB = { checkins: Checkin[]; posts: Post[] };

const SEED_POSTS: Post[] = [
  { id: "ishaan", name: "Ishaan", quote: "grateful for everything today, thanks for asking", art: "radial-gradient(circle at 50% 55%, rgba(94,234,212,.95) 0%, rgba(13,60,60,.9) 35%, rgba(4,10,18,.98) 72%)", dot: "bg-teal-300", likes: 24, createdAt: new Date().toISOString() },
  { id: "ritika", name: "Ritika", quote: "was a lot today but sitting with it now", art: "radial-gradient(circle at 55% 45%, rgba(192,132,252,.9) 0%, rgba(60,10,80,.85) 38%, rgba(5,5,15,.98) 75%)", dot: "bg-purple-400", likes: 11, createdAt: new Date().toISOString() },
  { id: "devansh", name: "Devansh", quote: "small win, actually took a break at 3pm", art: "radial-gradient(circle at 50% 55%, rgba(45,212,191,.9) 0%, rgba(8,40,38,.9) 40%, rgba(3,8,14,.98) 75%)", dot: "bg-teal-400", likes: 18, createdAt: new Date().toISOString() },
  { id: "ayesha", name: "Ayesha", quote: "not sure what this is, just logging it", art: "radial-gradient(circle at 50% 60%, rgba(147,197,253,.9) 0%, rgba(20,40,90,.85) 42%, rgba(3,6,16,.98) 78%)", dot: "bg-blue-400", likes: 6, createdAt: new Date().toISOString() },
  { id: "kabir", name: "Kabir", quote: "good day, oddly calm", art: "radial-gradient(circle at 50% 55%, rgba(125,211,252,.9) 0%, rgba(15,45,70,.88) 42%, rgba(3,7,15,.98) 76%)", dot: "bg-sky-400", likes: 9, createdAt: new Date().toISOString() },
  { id: "meher", name: "Meher", quote: "heavy morning, better by evening", art: "radial-gradient(circle at 55% 55%, rgba(168,85,247,.9) 0%, rgba(50,15,80,.85) 42%, rgba(6,4,16,.98) 78%)", dot: "bg-purple-500", likes: 14, createdAt: new Date().toISOString() },
];

const file = path.join(process.cwd(), ".data", "db.json");

async function read(): Promise<DB> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const db = JSON.parse(raw) as DB;
    if (!Array.isArray(db.checkins)) db.checkins = [];
    if (!Array.isArray(db.posts) || db.posts.length === 0) db.posts = SEED_POSTS;
    return db;
  } catch {
    return { checkins: [], posts: SEED_POSTS };
  }
}

async function write(db: DB) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(db, null, 2), "utf-8");
}

export async function getCheckins(): Promise<Checkin[]> {
  const db = await read();
  return db.checkins.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
}

export async function addCheckin(c: Omit<Checkin, "id">): Promise<Checkin> {
  const db = await read();
  const entry: Checkin = { ...c, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  db.checkins.push(entry);
  await write(db);
  return entry;
}

export async function getPosts(): Promise<Post[]> {
  const db = await read();
  return db.posts;
}

export async function likePost(id: string): Promise<Post | null> {
  const db = await read();
  const p = db.posts.find((x) => x.id === id);
  if (!p) return null;
  p.likes += 1;
  await write(db);
  return p;
}
