import { db } from "@/db";
import { stations } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function getAllStations() {
  const allStations = await db
    .select()
    .from(stations)
    .orderBy(asc(stations.name));

  return allStations;
}
