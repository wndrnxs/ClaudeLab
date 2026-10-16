import { dataDir, resetDb } from "../src/lib/db";

// 데모 데이터로 초기화합니다(기존 data/db.json을 덮어씁니다).
resetDb()
  .then(() => console.log(`데모 데이터로 초기화했습니다: ${dataDir()}/db.json`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
