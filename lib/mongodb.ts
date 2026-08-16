import mongoose, { type Mongoose } from "mongoose";

// Reads and validates the connection string on each call so TypeScript can
// narrow the return type to `string` (module-level narrowing of
// `process.env.*` doesn't carry into functions declared below it).
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing");
  }

  return uri;
}

// Shape of the cached connection state we stash on `global`.
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Next.js dev mode hot-reloads modules on every file change, which would
// otherwise re-run this file and open a fresh connection each time. Storing
// the cache on `global` survives module reloads and keeps a single
// connection (or in-flight connection attempt) shared across the app.
declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

async function connectToDatabase(): Promise<Mongoose> {
  // Reuse an existing connection if we already have one.
  if (cached.conn) {
    return cached.conn;
  }

  // Reuse an in-flight connection attempt so concurrent callers don't each
  // trigger their own `mongoose.connect` call.
  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the promise on failure so the next call can retry the connection.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
