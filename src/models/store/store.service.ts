import { StoreRepository } from "./store.repository";
import { CreateStoreType, UpdateStoreType } from "./store.dto";
import { ForbiddenError, NotFoundError, ConflictError } from "../../lib/customErrors";

export class StoreService {
  private storeRepository = new StoreRepository();

  public async createStore(user: { id: string; type: string }, dto: CreateStoreType, imagePath?: string) {
    if (user.type !== "SELLER") {
      throw new ForbiddenError("스토어는 판매자(SELLER)만 등록할 수 있습니다.");
    }

    const existingStore = await this.storeRepository.findByUserId(user.id);
    if (existingStore) {
      throw new ConflictError("이미 스토어를 등록하셨습니다. (계정 당 1개만 등록 가능)");
    }

    const newStore = await this.storeRepository.createStore(user.id, dto, imagePath);
    return newStore;
  }

  public async getMyStore(userId: string) {
    const store = await this.storeRepository.findByUserId(userId);
    if (!store) {
      throw new NotFoundError("등록된 스토어가 없습니다.");
    }
    return store;
  }

  public async updateStore(user: { id: string }, storeId: string, dto: UpdateStoreType, imagePath?: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new NotFoundError("스토어를 찾을 수 없습니다.");
    if (store.userId !== user.id) throw new ForbiddenError("본인의 스토어만 수정할 수 있습니다.");

    return this.storeRepository.updateStore(storeId, dto, imagePath);
  }

  public async getStoreDetail(storeId: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new NotFoundError("스토어를 찾을 수 없습니다.");
    return store;
  }

  public async toggleFavorite(userId: string, storeId: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new NotFoundError("해당 스토어를 찾을 수 없습니다.");

    const existingFavorite = await this.storeRepository.findFavorite(userId, storeId);
    let status: "added" | "removed";

    if (existingFavorite) {
      // 이미 찜한 상태라면 -> 삭제 (찜 해제)
      await this.storeRepository.removeFavorite(existingFavorite.id);
      status = "removed";
    } else {
      // 찜하지 않은 상태라면 -> 추가 (찜하기)
      await this.storeRepository.addFavorite(userId, storeId);
      status = "added";
    }

    // 찜하기 처리 후 최신 favoriteCount를 포함한 스토어 정보를 다시 조회해서 반환합니다.
    const updatedStore = await this.storeRepository.findById(storeId);
    return { status, store: updatedStore };
  }
}
