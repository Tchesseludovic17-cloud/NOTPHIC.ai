import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import clientsRouter from "./clients";
import alertesRouter from "./alertes";
import detectionRouter from "./detection";
import statsRouter from "./stats";
import siteRouter from "./site";
import feedbackRouter from "./feedback";
import affiliationsRouter from "./affiliations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(alertesRouter);
router.use(detectionRouter);
router.use(statsRouter);
router.use(siteRouter);
router.use(feedbackRouter);
router.use(affiliationsRouter);

export default router;
