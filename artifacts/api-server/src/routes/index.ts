import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import clientsRouter from "./clients";
import alertesRouter from "./alertes";
import detectionRouter from "./detection";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(alertesRouter);
router.use(detectionRouter);
router.use(statsRouter);

export default router;
