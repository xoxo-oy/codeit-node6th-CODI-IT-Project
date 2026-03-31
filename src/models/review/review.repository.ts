import { prisma } from "../../lib/prisma";
import { CreateReviewType, UpdateReviewType } from "./review.dto";

export class ReviewRepository {
  // 특정 상품의 리뷰 목록 및 평균 평점 통계 조회
  public async findByProductId(productId: string, skip: number, take: number) {
    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      })
    ]);

    return { reviews, stats };
  }

  // 리뷰 단건 상세 조회
  public async findById(reviewId: string) {
    return prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // 리뷰 생성 (해당 주문 아이템에 대해 이미 리뷰를 썼는지 Unique 검사가 스키마에 걸려있음)
  public async createReview(userId: string, productId: string, data: CreateReviewType, tx?: any) {
    const client = tx || prisma;
    return client.review.create({
      data: {
        userId,
        productId,
        orderItemId: data.orderItemId,
        rating: data.rating,
        content: data.content,
      },
    });
  }

  public async updateReview(reviewId: string, data: UpdateReviewType) {
    return prisma.review.update({
      where: { id: reviewId },
      data,
    });
  }

  public async deleteReview(reviewId: string) {
    return prisma.review.delete({ where: { id: reviewId } });
  }

  // 주문 아이템 검증용 함수
  public async findOrderItem(orderItemId: string, userId: string) {
    // order 모듈이 완성되기 전이므로 Prisma를 통해 해당 orderItem이 존재하는지 기초 쿼리만 진행
    return prisma.orderItem.findFirst({
      where: { 
        id: orderItemId,
      }
    });
  }
}
