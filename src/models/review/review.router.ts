import { Router } from "express";
import { ReviewController } from "./review.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { CreateReviewSchema, UpdateReviewSchema } from "./review.dto";
import { asyncHandler } from "../../lib/asyncHandler";

const reviewRouter = Router();
const reviewController = new ReviewController();

// ★ Swagger 명세서의 엔드포인트에 맞게 /product/... 와 /review/... 혼합 등록 처리
// app.ts 에서 app.use("/api", reviewRouter) 로 마운트할 예정입니다.

// 1. 특정 상품의 모든 리뷰 조회 (GET /api/product/:productId/reviews) - 누구나
reviewRouter.get("/product/:productId/reviews", asyncHandler(reviewController.getProductReviews));

// 2. 특정 상품 리뷰 등록 (POST /api/product/:productId/reviews) - 구매자 전용(토큰 필수)
reviewRouter.post(
  "/product/:productId/reviews",
  authenticate,
  validate(CreateReviewSchema),
  asyncHandler(reviewController.createReview)
);

// 3. 리뷰 단건 상세 조회 (GET /api/review/:reviewId) - 누구나
reviewRouter.get("/review/:reviewId", asyncHandler(reviewController.getReviewDetail));

// 4. 리뷰 수정 (PATCH /api/review/:reviewId) - 본인만
reviewRouter.patch(
  "/review/:reviewId",
  authenticate,
  validate(UpdateReviewSchema),
  asyncHandler(reviewController.updateReview)
);

// 5. 리뷰 삭제 (DELETE /api/review/:reviewId) - 본인만
reviewRouter.delete("/review/:reviewId", authenticate, asyncHandler(reviewController.deleteReview));

export default reviewRouter;
