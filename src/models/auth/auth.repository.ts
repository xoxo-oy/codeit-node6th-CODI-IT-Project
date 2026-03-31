import { prisma } from "../../lib/prisma";

export class AuthRepository {
  // 사용자를 이메일로 찾되, 로그인 검증을 위해 해시된 비밀번호(password)까지 모두 가져옵니다.
  public async findUserForLogin(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { grade: true } // 나중에 응답으로 내려줄 때 등급이 필요하기 때문에 Join(include)
    });
  }

  // 사용자를 ID로 찾을 때 (리프레시 토큰 대조용 등)
  public async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  // 데이터베이스에 사용자의 Refresh Token을 저장(Update)
  public async saveRefreshToken(userId: string, refreshToken: string | null) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
