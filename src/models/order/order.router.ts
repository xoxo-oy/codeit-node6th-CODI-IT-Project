import { Router } from "express";
import { OrderController } from "./order.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { CreateOrderSchema } from "./order.dto";
import { asyncHandler } from "../../lib/asyncHandler";

const orderRouter = Router();
const orderController = new OrderController();

// 1. 내 주문 목록 조회 (GET /api/orders) - 회원 전용
orderRouter.get("/", authenticate, asyncHandler(orderController.getMyOrders));

// 2. 주문/결제 진행 트랜잭션 (POST /api/orders)
orderRouter.post(
  "/",
  authenticate,
  validate(CreateOrderSchema), // 상품명세, 주소, 연락처, 장바구니 리스트 검사
  asyncHandler(orderController.createOrder)
);

// 3. 특정 주문 상세 조회 (GET /api/orders/:orderId) - 본인 주문만
orderRouter.get("/:orderId", authenticate, asyncHandler(orderController.getOrderDetail));

export default orderRouter;
