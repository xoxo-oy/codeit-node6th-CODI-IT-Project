import { ReviewRepository } from "./review.repository";
import { CreateReviewType, UpdateReviewType } from "./review.dto";
import { NotFoundError, ForbiddenError, ConflictError } from "../../lib/customErrors";
import { prisma } from "../../lib/prisma";

export class ReviewService {
  private reviewRepository = new ReviewRepository();

  public async getProductReviews(productId: string, page = 1, pageSize = 10) {
    const listData = await this.reviewRepository.findByProductId(productId, (page - 1) * pageSize, pageSize);
    const total = listData.stats._count.id;
    return {
      reviewsCount: total,
      reviewsRating: listData.stats._avg.rating ? Number(listData.stats._avg.rating.toFixed(1)) : 0,
      reviews: listData.reviews,
      meta: { total, page, limit: pageSize, hasNextPage: page * pageSize < total },
    };
  }

  public async createReview(userId: string, productId: string, dto: CreateReviewType) {
    // 1. 상품 존재 확인
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("요청한 리소스를 찾을 수 없습니다."); // Swagger 에러메시지 매칭

    // 2. 이미 해당 주문상품(orderItemId)에 대해 리뷰를 작성했는지 확인
    const existingReview = await prisma.review.findUnique({ where: { orderItemId: dto.orderItemId } });
    if (existingReview) {
      throw new ConflictError("이미 해당 주문에 대한 리뷰를 작성하셨습니다.");
    }

    // 3. 리뷰 생성 및 주문 아이템 상태 업데이트 (트랜잭션)
    return prisma.$transaction(async (tx) => {
      const review = await this.reviewRepository.createReview(userId, productId, dto, tx);
      await tx.orderItem.update({
        where: { id: dto.orderItemId },
        data: { isReviewed: true },
      });
      return review;
    });
  }

  public async getReviewDetail(reviewId: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError("존재하지 않는 리뷰입니다.");
    return review;
  }

  public async updateReview(userId: string, reviewId: string, dto: UpdateReviewType) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError("존재하지 않는 리뷰입니다.");
    if (review.userId !== userId) throw new ForbiddenError("본인의 리뷰만 수정할 수 있습니다.");
    return this.reviewRepository.updateReview(reviewId, dto);
  }

  public async deleteReview(userId: string, reviewId: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError("존재하지 않는 리뷰입니다.");
    if (review.userId !== userId) throw new ForbiddenError("본인의 리뷰만 삭제할 수 있습니다.");
    return this.reviewRepository.deleteReview(reviewId);
  }
}
