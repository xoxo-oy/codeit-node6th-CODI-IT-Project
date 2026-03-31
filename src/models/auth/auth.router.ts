import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { LoginSchema, RefreshSchema } from "./auth.dto";
import { asyncHandler } from "../../lib/asyncHandler";

const authRouter = Router();
const authController = new AuthController();

// 1. 로그인 (POST /api/auth/login)
authRouter.post("/login", validate(LoginSchema), asyncHandler(authController.login));

// 2. 리프레시 토큰 재발급 (POST /api/auth/refresh)
authRouter.post("/refresh", validate(RefreshSchema), asyncHandler(authController.refresh));

// 3. 로그아웃 (POST /api/auth/logout)
// 로그아웃은 본인이 누군지 알아야 하므로 authenticate 미들웨어(토큰 검증) 통과가 필수!
authRouter.post("/logout", authenticate, asyncHandler(authController.logout));

export default authRouter;
