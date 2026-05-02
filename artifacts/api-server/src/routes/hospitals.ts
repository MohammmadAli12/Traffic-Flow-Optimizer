import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { hospitalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateHospitalBody, DeleteHospitalParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hospitals", async (req, res) => {
  try {
    const hospitals = await db.select().from(hospitalsTable).orderBy(hospitalsTable.createdAt);
    res.json(hospitals);
  } catch (err) {
    req.log.error({ err }, "Failed to list hospitals");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/hospitals", async (req, res) => {
  try {
    const body = CreateHospitalBody.parse(req.body);
    const [hospital] = await db.insert(hospitalsTable).values(body).returning();
    res.status(201).json(hospital);
  } catch (err) {
    req.log.error({ err }, "Failed to create hospital");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.delete("/hospitals/:id", async (req, res) => {
  try {
    const { id } = DeleteHospitalParams.parse({ id: Number(req.params.id) });
    await db.delete(hospitalsTable).where(eq(hospitalsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete hospital");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
