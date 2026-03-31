import { PrismaClient } from "@prisma/client";

// 여러 파일에서 각각 인스턴스를 생성하지 않도록 싱글톤(Singleton) 패턴으로 하나만 만듭니다.
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
