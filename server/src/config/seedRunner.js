// Explicit seeding entrypoint: `npm run seed`.
// Applies schema.sql (via db.js import) then inserts demo data if the DB is empty.
import { getDriverName } from './db.js';
import { seedIfEmpty } from './seed.js';

const driver = await getDriverName();
const result = await seedIfEmpty();
console.log(`Driver: ${driver}`);
console.log(result.seeded ? `Seeded demo data (visitor ${result.demoVisitorCode}).` : 'Database already contains data - nothing seeded.');
process.exit(0);
