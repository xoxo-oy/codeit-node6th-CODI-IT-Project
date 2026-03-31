export class CustomError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends CustomError {
  constructor(message = "잘못된 요청입니다.") {
    super(400, message);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "인증이 필요합니다.") {
    super(401, message);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = "접근 권한이 없습니다.") {
    super(403, message);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "요청한 리소스를 찾을 수 없습니다.") {
    super(404, message);
  }
}

export class ConflictError extends CustomError {
  constructor(message = "이미 존재하는 데이터입니다.") {
    super(409, message);
  }
}

// 특정 비즈니스 로직 전용 에러 (예: 장바구니 품절 결제 에러)
export class OutOfStockError extends CustomError {
  constructor(message = "재고가 부족한 상품이 포함되어 있습니다.") {
    super(400, message); // 프론트엔드 명세서와 호환되도록 처리
  }
}
