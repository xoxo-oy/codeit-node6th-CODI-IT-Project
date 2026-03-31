import { Request, Response, NextFunction } from "express";
import { CustomError } from "../lib/customErrors";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Zod 유효성 검사 에러 (클라이언트가 파라미터를 잘못 보낸 경우)
  if (err instanceof ZodError) {
    const zodError = err as ZodError<any>;
    return res.status(400).json({
      statusCode: 400,
      message: zodError.issues[0]?.message || "입력값이 올바르지 않습니다.",
      error: "Bad Request",
    });
  }

  // 2. 비즈니스 로직 실패 에러 (우리가 직접 정의한 CustomError)
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      error: err.name,
    });
  }

  // 3. 서버 내부 다운 등 알 수 없는 에러
  console.error("🔥 [Server Fatal Error]:", err.message);
  console.error(err.stack); // 상세 스택 출력
  return res.status(500).json({
    statusCode: 500,
    message: "서버 내부에서 알 수 없는 에러가 발생했습니다.",
    error: "Internal Server Error",
  });
};
