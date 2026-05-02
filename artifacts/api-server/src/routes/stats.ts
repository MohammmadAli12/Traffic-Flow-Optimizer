import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { intersectionsTable, roadsTable, ambulancesTable, hospitalsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const [{ count: totalIntersections }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(intersectionsTable);

    const [{ count: totalRoads }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(roadsTable);

    const [{ total: totalCars }] = await db
      .select({ total: sql<number>`coalesce(sum(car_count), 0)::int` })
      .from(roadsTable);

    const [{ count: activeAmbulances }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ambulancesTable)
      .where(eq(ambulancesTable.status, "active"));

    const [{ count: totalHospitals }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(hospitalsTable);

    const avgCarsPerRoad = totalRoads > 0 ? Number((totalCars / totalRoads).toFixed(1)) : 0;

    // Find busiest road
    const [busiestRoad] = await db
      .select({
        id: roadsTable.id,
        name: roadsTable.name,
        carCount: roadsTable.carCount,
        direction: roadsTable.direction,
      })
      .from(roadsTable)
      .orderBy(desc(roadsTable.carCount))
      .limit(1);

    res.json({
      totalIntersections,
      totalRoads,
      totalCars,
      activeAmbulances,
      totalHospitals,
      avgCarsPerRoad,
      busiestRoad: busiestRoad?.carCount > 0 ? busiestRoad : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
