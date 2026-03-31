import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../lib/asyncHandler";

const dashboardRouter = Router();
const dashboardController = new DashboardController();

// GET /api/dashboard (판매자 전용 접근은 Service 층에서 방어 중)
dashboardRouter.get("/", authenticate, asyncHandler(dashboardController.getDashboard));

export default dashboardRouter;
