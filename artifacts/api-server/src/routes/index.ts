import { Router, type IRouter } from "express";
import healthRouter from "./health";
import intersectionsRouter from "./intersections";
import roadsRouter from "./roads";
import signalsRouter from "./signals";
import hospitalsRouter from "./hospitals";
import ambulancesRouter from "./ambulances";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(intersectionsRouter);
router.use(roadsRouter);
router.use(signalsRouter);
router.use(hospitalsRouter);
router.use(ambulancesRouter);
router.use(statsRouter);

export default router;
