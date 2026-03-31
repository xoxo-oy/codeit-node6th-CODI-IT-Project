import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { responseMsg } from "../../lib/response";

export class OrderController {
  private orderService = new OrderService();

  // GET /api/orders
  public getMyOrders = async (req: Request, res: Response) => {
    const ordersData = await this.orderService.getMyOrders(req.user!.id, req.query);
    return res.status(200).json(ordersData);
  };

  // POST /api/orders
  public createOrder = async (req: Request, res: Response) => {
    const order = await this.orderService.createOrder(req.user!.id, req.body);
    return res.status(201).json(order);
  };

  // GET /api/orders/:orderId
  public getOrderDetail = async (req: Request, res: Response) => {
    const orderId = req.params.orderId as string;
    const order = await this.orderService.getOrderDetail(req.user!.id, orderId);
    return res.status(200).json(order);
  };
}
