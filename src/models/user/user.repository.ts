import { prisma } from '../../lib/prisma';
import { CreateUserType } from './user.dto';

export class UserRepository {
  public async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  // 내 정보 조회를 위해 ID로 유저 검색 (등급 포함)
  public async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { grade: true },
    });
  }

  // 비밀번호 검증용 전체 데이터 조회
  public async findUserWithPassword(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  public async createUser(
    userData: CreateUserType & { passwordHash: string; gradeId?: string }
  ) {
    return prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: userData.passwordHash,
        type: userData.type,
        gradeId: userData.gradeId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        points: true,
        image: true,
        createdAt: true,
        grade: true,
      },
    });
  }

  // 내 정보 수정 로직
  public async updateUser(
    id: string,
    data: { name?: string; password?: string; image?: string }
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        points: true,
        image: true,
        createdAt: true,
        grade: true,
      },
    });
  }

  // 회원 탈퇴
  public async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  // 내가 찜한 스토어 목록 조회
  public async findLikedStores(userId: string) {
    return prisma.favoriteStore.findMany({
      where: { userId },
      include: {
        store: true, // 스토어 원본 데이터도 같이 가져옵니다.
      },
    });
  }
}
