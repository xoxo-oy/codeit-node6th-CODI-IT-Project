import { z } from "zod";

// 1. 리뷰 작성 스키마 (BUYER)
export const CreateReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1, "최소 1점 이상 주셔야 합니다.").max(5, "최대 5점까지 가능합니다."),
    content: z.string().min(10, "리뷰 내용은 최소 10자 이상 작성해주세요."),
    orderItemId: z.string().min(1, "주문 정보가 필요합니다."),
  }),
});

// 2. 리뷰 수정 스키마
export const UpdateReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    content: z.string().min(10).optional(),
  }),
});

export type CreateReviewType = z.infer<typeof CreateReviewSchema>["body"];
export type UpdateReviewType = z.infer<typeof UpdateReviewSchema>["body"];
