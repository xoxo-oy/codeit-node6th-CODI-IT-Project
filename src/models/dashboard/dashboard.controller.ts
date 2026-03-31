import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { responseMsg } from "../../lib/response";

export class DashboardController {
  private dashboardService = new DashboardService();

  // GET /api/dashboard
  public getDashboard = async (req: Request, res: Response) => {
    const stats = await this.dashboardService.getDashboardStats(req.user!.id);
    return res.status(200).json(stats);
  };
}
