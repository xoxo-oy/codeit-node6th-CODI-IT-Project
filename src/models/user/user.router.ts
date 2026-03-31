import { Router } from "express";
import { UserController } from "./user.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { CreateUserSchema, UpdateUserSchema } from "./user.dto";
import { asyncHandler } from "../../lib/asyncHandler";

const userRouter = Router();
const userController = new UserController();

// [1] 회원가입 (POST /api/users) -> 검열관: validate
userRouter.post("/", validate(CreateUserSchema), asyncHandler(userController.create));

// [2] 내 정보 조회 (GET /api/users/me) -> 검열관: authenticate (토큰 필수)
userRouter.get("/me", authenticate, asyncHandler(userController.getMe));

// [3] 내 정보 수정 (PATCH /api/users/me) 
// 검열관 1: 토큰 (authenticate)
// 검열관 2: 이미지 폼데이터 처리 (upload.single('image'))
// 검열관 3: 입력값 정책 검사 (validate)
userRouter.patch(
  "/me",
  authenticate,
  upload.single("image"), // 먼저 multer가 파싱해야 body에 string 데이터가 나타납니다.
  validate(UpdateUserSchema),
  asyncHandler(userController.updateMe)
);

// [4] 내 관심 스토어 목록 조회 (GET /api/users/me/likes)
userRouter.get("/me/likes", authenticate, asyncHandler(userController.getLikedStores));

// [5] 회원 탈퇴 (DELETE /api/users/delete)
userRouter.delete("/delete", authenticate, asyncHandler(userController.deleteUser));

export default userRouter;
