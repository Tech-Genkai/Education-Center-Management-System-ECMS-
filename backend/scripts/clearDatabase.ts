import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.ts';

async function clearDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    throw new Error('MONGODB_URI (or MONGODB_URL) is required to clear the database.');
  }

  await connectDatabase(uri, 'ecms-clear');
  const dbName = mongoose.connection.db.databaseName;

  if (!dbName || dbName === 'admin') {
    throw new Error(`Refusing to drop database '${dbName}' — please provide a specific DB name in the URI.`);
  }

  await mongoose.connection.db.dropDatabase();
  console.log(`Dropped database '${dbName}' at URI ${uri}`);
}

clearDatabase()
  .then(() => disconnectDatabase())
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error('Clear DB failed:', err);
    return disconnectDatabase().finally(() => mongoose.disconnect()).finally(() => process.exit(1));
  });
