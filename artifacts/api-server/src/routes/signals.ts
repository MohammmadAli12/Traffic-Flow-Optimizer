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
    const intersections = await db.select().from(intersectionsTable);
    const updatedSignals: any[] = [];

    for (const intersection of intersections) {
      const roads = await db.select().from(roadsTable).where(eq(roadsTable.intersectionId, intersection.id));
      const timings = computeTimings(roads);

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
