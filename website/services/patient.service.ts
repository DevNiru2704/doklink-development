import clientPromise from "@/lib/mongodb";
import { Patient } from "@/lib/types";

export async function getPatients() {
  const client = await clientPromise;
  return client.db().collection<Patient>("patients").find().toArray();
}

export async function createPatient(data: Patient) {
  const client = await clientPromise;
  return client.db().collection("patients").insertOne({
    ...data,
    createdAt: new Date(),
  });
}
