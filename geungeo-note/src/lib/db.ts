import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "./types";
import { buildSeedDatabase } from "./seed";

/**
 * 프로토타입용 저장소: 서버의 JSON 파일 하나에 모든 데이터를 저장합니다.
 * 실제 서비스에서는 이 파일만 PostgreSQL 등으로 교체하면 됩니다.
 */

export function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

function dbPath(): string {
  return path.join(dataDir(), "db.json");
}

// 개발 서버의 모듈 재로딩에도 쓰기 순서를 지키기 위해 전역에 잠금을 둡니다.
const globalForDb = globalThis as unknown as { __gnDbQueue?: Promise<unknown> };

async function loadOrSeed(): Promise<Database> {
  try {
    const raw = await fs.readFile(dbPath(), "utf8");
    return JSON.parse(raw) as Database;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const seeded = buildSeedDatabase();
    await writeDb(seeded);
    return seeded;
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${dbPath()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, dbPath());
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const prev = globalForDb.__gnDbQueue ?? Promise.resolve();
  const next = prev.then(task, task);
  globalForDb.__gnDbQueue = next.catch(() => undefined);
  return next;
}

export function readDb(): Promise<Database> {
  return enqueue(loadOrSeed);
}

/** 읽기-수정-쓰기를 하나의 작업으로 처리합니다. fn의 반환값을 그대로 돌려줍니다. */
export function updateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    const db = await loadOrSeed();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
}

export async function resetDb(): Promise<void> {
  await enqueue(() => writeDb(buildSeedDatabase()));
}
