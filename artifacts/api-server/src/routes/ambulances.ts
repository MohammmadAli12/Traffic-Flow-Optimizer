import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ambulancesTable, roadsTable, hospitalsTable, signalsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import {
  DispatchAmbulanceBody,
  GetAmbulanceParams,
  ResolveAmbulanceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildAmbulanceDetail(ambulance: typeof ambulancesTable.$inferSelect) {
  const [sourceRoad] = await db.select().from(roadsTable).where(eq(roadsTable.id, ambulance.sourceRoadId));
  const [targetHospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, ambulance.targetHospitalId));
  return {
    ...ambulance,
    sourceRoadName: sourceRoad?.name ?? "",
    targetHospitalName: targetHospital?.name ?? "",
  };
}

/**
 * Find nearest hospital by fewest total cars on the path.
 * "Distance" is approximated by total cars on all roads at the hospital's intersection.
 */
async function findNearestHospitalWithRoute(sourceRoadId: number) {
  const hospitals = await db.select().from(hospitalsTable);
  if (hospitals.length === 0) throw new Error("No hospitals available");

  const [sourceRoad] = await db.select().from(roadsTable).where(eq(roadsTable.id, sourceRoadId));
  if (!sourceRoad) throw new Error("Source road not found");

  let bestHospital = hospitals[0];
  let bestRoute: {
    roadId: number;
    roadName: string;
    direction: string;
    carCount: number;
    intersectionName: string;
    coordinates: [number, number][];
  }[] = [];
  let bestTotalCars = Infinity;

  for (const hospital of hospitals) {
    // Get roads at the hospital's intersection (low traffic path)
    const roadsAtHospital = await db
      .select()
      .from(roadsTable)
      .where(eq(roadsTable.intersectionId, hospital.nearestIntersectionId))
      .orderBy(asc(roadsTable.carCount));

    const totalCarsAtHospital = roadsAtHospital.reduce((sum, r) => sum + r.carCount, 0);

    // Also include source road in route
    const totalCars = sourceRoad.carCount + totalCarsAtHospital;

    if (totalCars < bestTotalCars) {
      bestTotalCars = totalCars;
      bestHospital = hospital;

      // Build route segments: source road → all roads at hospital intersection (lowest traffic first)
      const hospitalRoads = roadsAtHospital; // include all roads for signal priority

      bestRoute = [
        {
          roadId: sourceRoad.id,
          roadName: sourceRoad.name,
          direction: sourceRoad.direction,
          carCount: sourceRoad.carCount,
          intersectionName: `Origin`,
          coordinates: (sourceRoad.coordinates as [number, number][]) || [],
        },
        ...hospitalRoads.map((r) => ({
          roadId: r.id,
          roadName: r.name,
          direction: r.direction,
          carCount: r.carCount,
          intersectionName: hospital.name,
          coordinates: (r.coordinates as [number, number][]) || [],
        })),
      ];
    }
  }

  return { nearestHospital: bestHospital, route: bestRoute, totalCars: bestTotalCars };
}

router.get("/ambulances", async (req, res) => {
  try {
    const ambulances = await db.select().from(ambulancesTable).orderBy(ambulancesTable.dispatchedAt);
    const result = await Promise.all(ambulances.map(buildAmbulanceDetail));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list ambulances");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ambulances", async (req, res) => {
  try {
    const { sourceRoadId } = DispatchAmbulanceBody.parse(req.body);

    const { nearestHospital, route, totalCars } = await findNearestHospitalWithRoute(sourceRoadId);

    const [ambulance] = await db
      .insert(ambulancesTable)
      .values({
        sourceRoadId,
        targetHospitalId: nearestHospital.id,
        status: "active",
      })
      .returning();

    const detail = await buildAmbulanceDetail(ambulance);

    res.status(201).json({
      ambulance: detail,
      nearestHospital,
      route,
      totalCars,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to dispatch ambulance");
    res.status(400).json({ error: (err as Error).message || "Invalid request" });
  }
});

router.get("/ambulances/:id", async (req, res) => {
  try {
    const { id } = GetAmbulanceParams.parse({ id: Number(req.params.id) });
    const [ambulance] = await db.select().from(ambulancesTable).where(eq(ambulancesTable.id, id));
    if (!ambulance) {
      res.status(404).json({ error: "Ambulance not found" });
      return;
    }

    const { nearestHospital, route, totalCars } = await findNearestHospitalWithRoute(ambulance.sourceRoadId);
    const detail = await buildAmbulanceDetail(ambulance);

    res.json({ ambulance: detail, nearestHospital, route, totalCars });
  } catch (err) {
    req.log.error({ err }, "Failed to get ambulance");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ambulances/:id/resolve", async (req, res) => {
  try {
    const { id } = ResolveAmbulanceParams.parse({ id: Number(req.params.id) });
    const [ambulance] = await db
      .update(ambulancesTable)
      .set({ status: "resolved" })
      .where(eq(ambulancesTable.id, id))
      .returning();
    if (!ambulance) {
      res.status(404).json({ error: "Ambulance not found" });
      return;
    }
    const detail = await buildAmbulanceDetail(ambulance);
    res.json(detail);
  } catch (err) {
    req.log.error({ err }, "Failed to resolve ambulance");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
