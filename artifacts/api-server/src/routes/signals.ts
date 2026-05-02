import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { roadsTable, signalsTable, intersectionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetSignalsForIntersectionParams } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * Compute signal timings for all roads in an intersection.
 * Proportional green time: roads with more cars get longer green phases.
 * Minimum green = 10s, max green = 120s.
 * Red = total cycle - green for each road.
 */
function computeTimings(roads: { id: number; carCount: number }[]): {
  roadId: number;
  greenDuration: number;
  redDuration: number;
  state: "green" | "red" | "yellow";
}[] {
  if (roads.length === 0) return [];

  const MIN_GREEN = 10;
  const MAX_GREEN = 120;
  const BASE_GREEN = 30;
  const totalCars = roads.reduce((sum, r) => sum + r.carCount, 0);
  const CYCLE = 120;

  // Determine which road gets green (highest car count wins)
  const maxCars = Math.max(...roads.map((r) => r.carCount));

  return roads.map((road) => {
    let greenDuration: number;
    if (totalCars === 0) {
      greenDuration = BASE_GREEN;
    } else {
      // Proportional to car count, scaled to MIN_GREEN..MAX_GREEN
      const ratio = road.carCount / totalCars;
      greenDuration = Math.round(MIN_GREEN + ratio * (MAX_GREEN - MIN_GREEN));
      greenDuration = Math.max(MIN_GREEN, Math.min(MAX_GREEN, greenDuration));
    }

    const redDuration = Math.max(MIN_GREEN, CYCLE - greenDuration);
    // Road with highest cars gets green state; others get red
    const state: "green" | "red" | "yellow" =
      road.carCount === maxCars && maxCars > 0 ? "green" : "red";

    return { roadId: road.id, greenDuration, redDuration, state };
  });
}

async function buildSignalResponse(signals: typeof signalsTable.$inferSelect[]) {
  const result = [];
  for (const s of signals) {
    const [road] = await db.select().from(roadsTable).where(eq(roadsTable.id, s.roadId));
    result.push({
      ...s,
      roadName: road?.name ?? "",
      direction: road?.direction ?? "",
      carCount: road?.carCount ?? 0,
    });
  }
  return result;
}

router.get("/signals", async (req, res) => {
  try {
    const signals = await db.select().from(signalsTable);
    const result = await buildSignalResponse(signals);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list signals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signals/compute", async (req, res) => {
  try {
    const intersections = await db.select().from(intersectionsTable);
    const updatedSignals: typeof signalsTable.$inferSelect[] = [];

    for (const intersection of intersections) {
      const roads = await db.select().from(roadsTable).where(eq(roadsTable.intersectionId, intersection.id));
      const timings = computeTimings(roads);

      for (const timing of timings) {
        const [updated] = await db
          .update(signalsTable)
          .set({
            greenDuration: timing.greenDuration,
            redDuration: timing.redDuration,
            state: timing.state,
            updatedAt: new Date(),
          })
          .where(eq(signalsTable.roadId, timing.roadId))
          .returning();
        if (updated) updatedSignals.push(updated);
      }
    }

    const result = await buildSignalResponse(updatedSignals);
    res.json(result);
  } catch (err) {
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
    req.log.error({ err }, "Failed to get signals for intersection");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
