import { Router } from "express";
import { StoreController } from "./store.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { CreateStoreSchema, UpdateStoreSchema } from "./store.dto";
import { asyncHandler } from "../../lib/asyncHandler";

const storeRouter = Router();
const storeController = new StoreController();

// 1. 내 스토어 등록 (POST /api/stores)
// 인증 필수 -> 이미지 업로드 파싱 -> 텍스트 바디(Zod) 검증 로직 연결
storeRouter.post(
  "/",
  authenticate,
  upload.single("image"),
  validate(CreateStoreSchema),
  asyncHandler(storeController.create)
);

// 2. 내 스토어 상세 조회 (GET /api/stores/detail/my)
storeRouter.get("/detail/my", authenticate, asyncHandler(storeController.getMyStore));

// (참고: 상품 모듈 구현 시 /detail/my/product 라우터도 이쪽에 추가로 연결해야 합니다.)

// 3. 관심 스토어 등록 (POST /api/stores/:storeId/favorite)
storeRouter.post("/:storeId/favorite", authenticate, asyncHandler(storeController.toggleFavorite));

// 4. 관심 스토어 해제 (DELETE /api/stores/:storeId/favorite)
// 서비스 단의 토글 로직을 재사용하여 똑같이 매핑했습니다.
storeRouter.delete("/:storeId/favorite", authenticate, asyncHandler(storeController.toggleFavorite));

// 5. 스토어 수정 (PATCH /api/stores/:storeId)
storeRouter.patch(
  "/:storeId",
  authenticate,
  upload.single("image"),
  validate(UpdateStoreSchema),
  asyncHandler(storeController.updateStore)
);

// 6. 특정 스토어 상세 조회 (GET /api/stores/:storeId) -> :storeId 와 부딪히지 않게 가장 최하단 배치
storeRouter.get("/:storeId", asyncHandler(storeController.getStoreDetail));

export default storeRouter;
