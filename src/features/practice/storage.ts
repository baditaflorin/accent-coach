import { openDB } from "idb";
import type { AnalysisResult } from "./types";

const DB_NAME = "accent-coach";
const STORE_NAME = "sessions";

export async function saveSession(result: AnalysisResult): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME, { keyPath: "createdAt" });
    },
  });
  await db.put(STORE_NAME, result);
}

export async function listSessions(): Promise<AnalysisResult[]> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME, { keyPath: "createdAt" });
    },
  });
  const sessions = await db.getAll(STORE_NAME);
  return sessions
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
}
