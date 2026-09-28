import { MongoClient, Db, ServerApiVersion } from 'mongodb';

// Clean MONGODB_URI to handle trailing spaces, newlines, or quotation marks from env
function getCleanUri(): string {
  let raw = process.env.MONGODB_URI || '';
  raw = raw.trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }
  return raw;
}

const uri = getCleanUri();

const clientOptions = {
  connectTimeoutMS: 8000,
  serverSelectionTimeoutMS: 8000,
  maxPoolSize: 10,
  minPoolSize: 1,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const currentUri = getCleanUri();
  if (!currentUri) {
    console.warn('[MongoDB] MONGODB_URI environment variable is not defined.');
    return null;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        client = new MongoClient(currentUri, clientOptions);
        global._mongoClientPromise = client.connect().catch((err) => {
          console.error('[MongoDB] Initial connection promise failed, clearing cache for retry:', err.message);
          global._mongoClientPromise = undefined;
          throw err;
        });
      }
      clientPromise = global._mongoClientPromise;
    } else {
      if (!clientPromise) {
        client = new MongoClient(currentUri, clientOptions);
        clientPromise = client.connect().catch((err) => {
          console.error('[MongoDB] Connection failed, resetting client:', err.message);
          clientPromise = null;
          throw err;
        });
      }
    }

    return await clientPromise;
  } catch (error: any) {
    console.warn('[MongoDB] Connection attempt failed:', error?.message || error);
    // Reset cached promises so next request can retry
    if (process.env.NODE_ENV === 'development') {
      global._mongoClientPromise = undefined;
    } else {
      clientPromise = null;
    }
    return null;
  }
}

export async function getDb(dbName?: string): Promise<Db | null> {
  try {
    const c = await getMongoClient();
    if (!c) return null;
    
    // If explicit dbName passed, use it; otherwise use default from URI or 'Nedject'
    if (dbName) {
      return c.db(dbName);
    }
    return c.db();
  } catch (err: any) {
    console.warn('[MongoDB] getDb error:', err?.message || err);
    return null;
  }
}

/**
 * Diagnostic check to verify MongoDB read/write capabilities
 */
export async function testMongoConnection(): Promise<{
  connected: boolean;
  databaseName?: string;
  pingMs?: number;
  collections?: string[];
  error?: string;
}> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) {
      return {
        connected: false,
        error: uri ? 'Failed to connect to cluster' : 'MONGODB_URI is not set in environment',
      };
    }

    await db.command({ ping: 1 });
    const pingMs = Date.now() - start;

    const collectionsInfo = await db.listCollections().toArray();
    const collections = collectionsInfo.map((c) => c.name);

    return {
      connected: true,
      databaseName: db.databaseName,
      pingMs,
      collections,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'Unknown database error',
    };
  }
}
