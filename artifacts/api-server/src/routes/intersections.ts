import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { intersectionsTable, roadsTable, signalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateIntersectionBody,
  GetIntersectionParams,
  DeleteIntersectionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/intersections", async (req, res) => {
  try {
    const intersections = await db.select().from(intersectionsTable).orderBy(intersectionsTable.createdAt);
    res.json(intersections);
  } catch (err) {
    req.log.error({ err }, "Failed to list intersections");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/intersections", async (req, res) => {
  try {
    const body = CreateIntersectionBody.parse(req.body);
    const [intersection] = await db.insert(intersectionsTable).values(body).returning();
    res.status(201).json(intersection);
  } catch (err) {
    req.log.error({ err }, "Failed to create intersection");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.get("/intersections/:id", async (req, res) => {
  try {
    const { id } = GetIntersectionParams.parse({ id: Number(req.params.id) });
    const [intersection] = await db.select().from(intersectionsTable).where(eq(intersectionsTable.id, id));
    if (!intersection) {
      res.status(404).json({ error: "Intersection not found" });
      return;
    }
    const roads = await db.select().from(roadsTable).where(eq(roadsTable.intersectionId, id));
    const signals = await db.select().from(signalsTable).where(eq(signalsTable.intersectionId, id));

    const signalsWithMeta = signals.map((s) => {
      const road = roads.find((r) => r.id === s.roadId);
      return {
        ...s,
        roadName: road?.name ?? "",
        direction: road?.direction ?? "",
        carCount: road?.carCount ?? 0,
      };
    });

    res.json({ ...intersection, roads, signals: signalsWithMeta });
  } catch (err) {
    req.log.error({ err }, "Failed to get intersection");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/intersections/:id", async (req, res) => {
  try {
    const { id } = DeleteIntersectionParams.parse({ id: Number(req.params.id) });
    await db.delete(intersectionsTable).where(eq(intersectionsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete intersection");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
