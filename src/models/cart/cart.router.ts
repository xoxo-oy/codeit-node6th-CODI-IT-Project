import { Router } from "express";
import { CartController } from "./cart.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { AddCartSchema, UpdateCartSchema, SyncCartSchema } from "./cart.dto";
import { asyncHandler } from "../../lib/asyncHandler";

const cartRouter = Router();
const cartController = new CartController();

// 1. 내 장바구니 리스트 조회 (GET /api/cart) - 접속 회원 전용
cartRouter.get("/", authenticate, asyncHandler(cartController.getMyCart));

// 2. 장바구니에 상품 추가 (POST /api/cart) - 바디가 없으면 장바구니 생성만 수행
cartRouter.post(
  "/",
  authenticate,
  // 바디가 있을 때만 AddCartSchema 검증 수행
  (req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
      return validate(AddCartSchema)(req, res, next);
    }
    next();
  },
  asyncHandler(cartController.addCart)
);

// 2.5. 장바구니 벌크 수정/동기화 (PATCH /api/cart) - Frontend 대응
cartRouter.patch(
  "/",
  authenticate,
  validate(SyncCartSchema),
  asyncHandler(cartController.syncCart)
);

// 3. 장바구니 담긴 수량 변경 (PATCH /api/cart/:cartItemId)
cartRouter.patch(
  "/:cartItemId",
  authenticate,
  validate(UpdateCartSchema),
  asyncHandler(cartController.updateCartItem)
);

// 4. 장바구니 목록 부분 삭제 (DELETE /api/cart/:cartItemId)
cartRouter.delete("/:cartItemId", authenticate, asyncHandler(cartController.deleteCartItem));

export default cartRouter;
