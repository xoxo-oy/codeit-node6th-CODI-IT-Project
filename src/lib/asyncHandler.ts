import { Request, Response, NextFunction } from "express";

// 모든 비동기 컨트롤러를 감싸서 try-catch를 생략하게 해주는 마법의 래퍼
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
