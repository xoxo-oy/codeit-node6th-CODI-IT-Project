import { prisma } from "../../lib/prisma";
import { CreateStoreType, UpdateStoreType } from "./store.dto";

export class StoreRepository {
  // 스토어 단일 개수 확인용 (한 유저는 1개의 스토어만 가질 수 있음)
  public async findByUserId(userId: string) {
    const store = await prisma.store.findUnique({
      where: { userId },
      include: {
        _count: { select: { favoriteStores: true } }
      }
    });
    if (!store) return null;
    const { _count, ...rest } = store;
    return { ...rest, favoriteCount: _count.favoriteStores };
  }

  // 스토어 ID로 스토어 찾기
  public async findById(id: string) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: { select: { favoriteStores: true } }
      }
    });
    if (!store) return null;
    const { _count, ...rest } = store;
    return { ...rest, favoriteCount: _count.favoriteStores };
  }

  // 스토어 생성
  public async createStore(userId: string, data: CreateStoreType, imagePath?: string) {
    return prisma.store.create({
      data: {
        userId,
        name: data.name,
        address: data.address,
        detailAddress: data.detailAddress,
        phoneNumber: data.phoneNumber,
        content: data.content,
        // 이미지가 전달되지 않았을 경우 스키마 기본값(placeholderS3.png)이 들어가거나 빈값으로 처리
        image: imagePath || "https://placeholder.com/store.png",
      },
      include: {
        user: { select: { name: true, email: true } } // 응답에 유저 정보 일부 조인
      }
    });
  }

  // 스토어 업데이트
  public async updateStore(storeId: string, data: UpdateStoreType, imagePath?: string) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        ...data,
        ...(imagePath && { image: imagePath }), // 이미지가 새로 업로드되었다면 덮어쓰기
      },
    });
  }

  // ------------------- 찜(Favorite) 기능 -------------------
  
  // 찜 기록 조회 (이미 찜했는지 확인)
  public async findFavorite(userId: string, storeId: string) {
    return prisma.favoriteStore.findFirst({
      where: { userId, storeId },
    });
  }

  // 찜하기 (데이터베이스에 추가)
  public async addFavorite(userId: string, storeId: string) {
    return prisma.favoriteStore.create({
      data: { userId, storeId },
    });
  }

  // 찜 해제 (데이터베이스에서 삭제)
  public async removeFavorite(favoriteId: string) {
    return prisma.favoriteStore.delete({
      where: { id: favoriteId },
    });
  }
}
