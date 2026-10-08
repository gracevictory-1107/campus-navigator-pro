import { createApp } from './app.js';
import { getDriverName } from './config/db.js';
import { seedIfEmpty } from './config/seed.js';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  // Ensure schema is loaded (db.js applies schema.sql on import) and seed demo
  // data when the database is empty (always true for the in-memory driver).
  const seedResult = await seedIfEmpty();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`\n  Campus Navigator Pro — backend`);
    console.log(`  DB driver : ${process.env.DATABASE_URL ? 'PostgreSQL' : 'pg-mem (in-memory demo)'}`);
    console.log(`  Listening : http://localhost:${PORT}/api`);
    if (seedResult.seeded) console.log(`  Seeded demo data (visitor ${seedResult.demoVisitorCode})`);
    console.log('');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Referenced to keep the import meaningful for `npm run seed` diagnostics.
export { getDriverName };
