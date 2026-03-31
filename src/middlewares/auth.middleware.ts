import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../lib/customErrors";
import { JWT_SECRET } from "../lib/constants";

// req.user 타입 확장을 위한 인터페이스 병합 (TypeScript 고오급 스킬)
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; type: string; email: string };
    }
  }
}

/**
 * 프론트엔드에서 보낸 Authorization 헤더의 Bearer 토큰을 까보고 유효성 검사하는 수문장
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("인증 토큰이 제공되지 않았습니다."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; type: string; email: string };
    req.user = payload; // 다음 컨트롤러에서 유저 신원(ID, 권한)을 쓸 수 있게 부착!
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError("토큰이 만료되었습니다. Refresh Token을 이용해 재발급 받아주세요."));
    }
    return next(new UnauthorizedError("유효하지 않은 토큰입니다."));
  }
};
