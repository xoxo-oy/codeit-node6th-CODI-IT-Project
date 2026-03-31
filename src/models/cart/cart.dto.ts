import { z } from "zod";

// 장바구니 추가 스키마
export const AddCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "상품 ID를 입력해주세요."),
    sizeId: z.number().int().min(1, "올바른 사이즈 ID를 입력해주세요."),
    quantity: z.number().int().min(1, "수량은 1개 이상이어야 합니다."),
  }),
});

// 장바구니 수량 수정 스키마
export const UpdateCartSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(1, "수량은 1개 이상이어야 합니다."),
  }),
});

// 장바구니 벌크 수정(동기화) 스키마 - Frontend patchCart 대응
export const SyncCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "상품 ID를 입력해주세요."),
    sizes: z.array(z.object({
      sizeId: z.number().int().min(1, "올바른 사이즈 ID를 입력해주세요."),
      quantity: z.number().int().min(1, "수량은 1개 이상이어야 합니다."),
    })).min(1, "최소 한 개 이상의 사이즈 옵션이 필요합니다."),
  }),
});

export type AddCartType = z.infer<typeof AddCartSchema>["body"];
export type UpdateCartType = z.infer<typeof UpdateCartSchema>["body"];
export type SyncCartType = z.infer<typeof SyncCartSchema>["body"];
