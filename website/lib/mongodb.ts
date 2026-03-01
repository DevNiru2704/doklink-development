import { MongoClient, Db, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI missing");

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

const clientPromise =
  global._mongoClientPromise ??
  (global._mongoClientPromise = client.connect());

export default clientPromise;

// Get main database for shared collections (users, hospitals)
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  // Use the database name from connection string or default to "doklink"
  const dbName = process.env.MONGODB_DB_NAME || "doklink";
  return client.db(dbName);
}

// Get hospital-specific database by hospital code (sanitized name)
export async function getHospitalDb(hospitalCode: string): Promise<Db> {
  const client = await clientPromise;
  // Each hospital gets its own database using their code: dh_<code>
  // Code is already sanitized during generation to be DB-safe and under 38 bytes
  return client.db(`dh_${hospitalCode}`);
}

// Generate next ID using atomic counter (efficient, no full collection scan)
export async function getNextId(
  db: Db,
  collectionName: string,
  prefix: string = ""
): Promise<string> {
  const counter = await db.collection("counters").findOneAndUpdate(
    { _id: collectionName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  const seq = counter?.seq || 1;
  return prefix ? `${prefix}${seq}` : seq.toString();
}
