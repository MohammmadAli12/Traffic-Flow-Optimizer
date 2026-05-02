import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { roadsTable, signalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateRoadBody,
  GetRoadParams,
  DeleteRoadParams,
  UpdateCarCountParams,
  UpdateCarCountBody,
  AddCarParams,
  RemoveCarParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/roads", async (req, res) => {
  try {
    let query = db.select().from(roadsTable);
    const intersectionId = req.query.intersectionId ? Number(req.query.intersectionId) : undefined;
    if (intersectionId) {
      const roads = await db.select().from(roadsTable).where(eq(roadsTable.intersectionId, intersectionId));
      res.json(roads);
      return;
    }
    const roads = await query.orderBy(roadsTable.createdAt);
    res.json(roads);
  } catch (err) {
    req.log.error({ err }, "Failed to list roads");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/roads", async (req, res) => {
  try {
    const body = CreateRoadBody.parse(req.body);
    const [road] = await db.insert(roadsTable).values({ ...body, carCount: 0 }).returning();

    // Auto-create a signal for this road
    await db.insert(signalsTable).values({
      roadId: road.id,
      intersectionId: road.intersectionId,
      state: "red",
      greenDuration: 30,
      redDuration: 60,
    });

    res.status(201).json(road);
  } catch (err) {
    req.log.error({ err }, "Failed to create road");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.get("/roads/:id", async (req, res) => {
  try {
    const { id } = GetRoadParams.parse({ id: Number(req.params.id) });
    const [road] = await db.select().from(roadsTable).where(eq(roadsTable.id, id));
    if (!road) {
      res.status(404).json({ error: "Road not found" });
      return;
    }
    res.json(road);
  } catch (err) {
    req.log.error({ err }, "Failed to get road");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/roads/:id", async (req, res) => {
  try {
    const { id } = DeleteRoadParams.parse({ id: Number(req.params.id) });
    await db.delete(roadsTable).where(eq(roadsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete road");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/roads/:id/cars", async (req, res) => {
  try {
    const { id } = UpdateCarCountParams.parse({ id: Number(req.params.id) });
    const { carCount } = UpdateCarCountBody.parse(req.body);
    const [road] = await db.update(roadsTable).set({ carCount }).where(eq(roadsTable.id, id)).returning();
    if (!road) {
      res.status(404).json({ error: "Road not found" });
      return;
    }
    res.json(road);
  } catch (err) {
    req.log.error({ err }, "Failed to update car count");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/roads/:id/add-car", async (req, res) => {
  try {
    const { id } = AddCarParams.parse({ id: Number(req.params.id) });
    const [current] = await db.select().from(roadsTable).where(eq(roadsTable.id, id));
    if (!current) {
      res.status(404).json({ error: "Road not found" });
      return;
    }
    const [road] = await db
      .update(roadsTable)
      .set({ carCount: current.carCount + 1 })
      .where(eq(roadsTable.id, id))
      .returning();
    res.json(road);
  } catch (err) {
    req.log.error({ err }, "Failed to add car");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/roads/:id/remove-car", async (req, res) => {
  try {
    const { id } = RemoveCarParams.parse({ id: Number(req.params.id) });
    const [current] = await db.select().from(roadsTable).where(eq(roadsTable.id, id));
    if (!current) {
      res.status(404).json({ error: "Road not found" });
      return;
    }
    const newCount = Math.max(0, current.carCount - 1);
    const [road] = await db
      .update(roadsTable)
      .set({ carCount: newCount })
      .where(eq(roadsTable.id, id))
      .returning();
    res.json(road);
  } catch (err) {
    req.log.error({ err }, "Failed to remove car");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
