import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * 프론트가 보낸 데이터(Body, Params, Query)가 Zod 스키마 규칙에 맞는지 검사하는 미들웨어
 */
export const validate = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 스키마에 맞게 파싱 진행
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next(); // 검증 통과 시 다음 로직(컨트롤러)으로 이동
    } catch (error) {
      // Zod 에러인 경우 error.middleware 로 던져서 400 에러 처리
      return next(error);
    }
  };
};
