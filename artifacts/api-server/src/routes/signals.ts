import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { roadsTable, signalsTable, intersectionsTable, ambulancesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetSignalsForIntersectionParams } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * Get all road IDs that are part of active ambulance routes.
 */
async function getAmbulanceRouteRoadIds(): Promise<Set<number>> {
  const activeAmbulances = await db
    .select()
    .from(ambulancesTable)
    .where(eq(ambulancesTable.status, "active"));

  const routeRoadIds = new Set<number>();
  for (const amb of activeAmbulances) {
    const sourceRoad = await db.select().from(roadsTable).where(eq(roadsTable.id, amb.sourceRoadId));
    if (sourceRoad.length > 0) {
      routeRoadIds.add(sourceRoad[0].id);
    }
  }
  return routeRoadIds;
}

/**
 * Compute signal timings for all roads in an intersection.
 * Ambulance route roads get GREEN priority.
 * Other roads: proportional green time based on car count.
 */
function computeTimings(
  roads: { id: number; carCount: number }[],
  ambulanceRouteRoadIds: Set<number>
): {
  roadId: number;
  greenDuration: number;
  redDuration: number;
  state: "green" | "red" | "yellow";
}[] {
  if (roads.length === 0) return [];

  const MIN_GREEN = 10;
  const MAX_GREEN = 120;
  const BASE_GREEN = 30;
  const CYCLE = 120;

  const hasAmbulanceRoute = roads.some((r) => ambulanceRouteRoadIds.has(r.id));

  if (hasAmbulanceRoute) {
    return roads.map((road) => {
      const state: "green" | "red" | "yellow" = ambulanceRouteRoadIds.has(road.id) ? "green" : "red";
      return {
        roadId: road.id,
        greenDuration: state === "green" ? 120 : 10,
        redDuration: state === "green" ? 10 : 120,
        state,
      };
    });
  }

  const totalCars = roads.reduce((sum, r) => sum + r.carCount, 0);
  const maxCars = Math.max(...roads.map((r) => r.carCount));

  return roads.map((road) => {
    let greenDuration: number;
    if (totalCars === 0) {
      greenDuration = BASE_GREEN;
    } else {
      const ratio = road.carCount / totalCars;
      greenDuration = Math.round(MIN_GREEN + ratio * (MAX_GREEN - MIN_GREEN));
      greenDuration = Math.max(MIN_GREEN, Math.min(MAX_GREEN, greenDuration));
    }

    const redDuration = Math.max(MIN_GREEN, CYCLE - greenDuration);
    const state: "green" | "red" | "yellow" =
      road.carCount === maxCars && maxCars > 0 ? "green" : "red";

    return { roadId: road.id, greenDuration, redDuration, state };
  });
}

async function buildSignalResponse(signals: any[]) {
  const result = [];
  for (const s of signals) {
    try {
      const roads = await db.select().from(roadsTable).where(eq(roadsTable.id, s.roadId));
      const road = roads[0];
      result.push({
        id: s.id,
        roadId: s.roadId,
        intersectionId: s.intersectionId,
        state: s.state,
        greenDuration: s.greenDuration,
        redDuration: s.redDuration,
        updatedAt: s.updatedAt,
        roadName: road?.name ?? "",
        direction: road?.direction ?? "",
        carCount: road?.carCount ?? 0,
      });
    } catch (err) {
      console.error("Error building signal response for signal", s.id, err);
    }
  }
  return result;
}

router.get("/signals", async (req, res) => {
  try {
    console.log("Fetching all signals...");
    const signals = await db.select().from(signalsTable);
    console.log("Found signals:", signals.length);
    const result = await buildSignalResponse(signals);
    console.log("Built response with", result.length, "signals");
    res.json(result);
  } catch (err) {
    console.error("Failed to list signals:", err);
    req.log.error({ err }, "Failed to list signals");
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

router.post("/signals/compute", async (req, res) => {
  try {
    const ambulanceRouteRoadIds = await getAmbulanceRouteRoadIds();
    const intersections = await db.select().from(intersectionsTable);
    const updatedSignals: any[] = [];

    for (const intersection of intersections) {
      const roads = await db.select().from(roadsTable).where(eq(roadsTable.intersectionId, intersection.id));
      const timings = computeTimings(roads, ambulanceRouteRoadIds);

      for (const timing of timings) {
        const updated = await db
          .update(signalsTable)
          .set({
            greenDuration: timing.greenDuration,
            redDuration: timing.redDuration,
            state: timing.state,
            updatedAt: new Date(),
          })
          .where(eq(signalsTable.roadId, timing.roadId))
          .returning();
        if (updated && updated.length > 0) updatedSignals.push(updated[0]);
      }
    }

    const result = await buildSignalResponse(updatedSignals);
    res.json(result);
  } catch (err) {
    console.error("Failed to compute signals:", err);
    req.log.error({ err }, "Failed to compute signals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/signals/:intersectionId", async (req, res) => {
  try {
    const { intersectionId } = GetSignalsForIntersectionParams.parse({
      intersectionId: Number(req.params.intersectionId),
    });
    const signals = await db
      .select()
      .from(signalsTable)
      .where(eq(signalsTable.intersectionId, intersectionId));
    const result = await buildSignalResponse(signals);
    res.json(result);
  } catch (err) {
    console.error("Failed to get signals for intersection:", err);
    req.log.error({ err }, "Failed to get signals for intersection");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
