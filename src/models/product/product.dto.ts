import { z } from "zod";

// 프론트엔드에서 multipart/form-data 로 전송될 때, 
// Array나 Object는 보통 JSON 문자열 형태(JSON.stringify)로 오게 됩니다.
// 따라서 문자열인 경우 JSON.parse를 시도하도록 preprocess(사전처리)를 추가합니다.
const jsonStringPreprocessor = (val: any) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

// 1. 상품 등록 스키마 (POST /api/products)
export const CreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, "상품 이름을 입력해주세요."),
    price: z.preprocess((val) => Number(val), z.number().min(0, "가격은 0원 이상이어야 합니다.")),
    content: z.string().min(1, "상품 상세 설명을 입력해주세요."),
    categoryName: z.string().min(1, "카테고리 이름을 입력해주세요."),
    
    // stocks 배열을 문자열에서 객체 배열로 변환
    stocks: z.preprocess(
      jsonStringPreprocessor,
      z.array(
        z.object({
          sizeId: z.preprocess((val) => Number(val), z.number().min(1, "사이즈 ID가 필요합니다.")),
          quantity: z.preprocess((val) => Number(val), z.number().min(0, "수량은 0 이상이어야 합니다.")),
        })
      ).min(1, "최소 1개 이상의 사이즈/재고 정보가 필요합니다.")
    ),

    // 할인 관련 필드 (선택)
    discountRate: z.preprocess((val) => (val ? Number(val) : undefined), z.number().min(0).max(100).optional()),
    discountStartTime: z.string().optional(),
    discountEndTime: z.string().optional(),
  }),
});

// 2. 상품 수정 스키마 (PATCH /api/products/:productId)
export const UpdateProductSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    price: z.preprocess((val) => (val ? Number(val) : undefined), z.number().min(0).optional()),
    content: z.string().optional(),
    categoryName: z.string().optional(),
    discountRate: z.preprocess((val) => (val !== undefined ? Number(val) : undefined), z.number().min(0).max(100).optional()),
    discountStartTime: z.string().optional(),
    discountEndTime: z.string().optional(),
    isSoldOut: z.preprocess(jsonStringPreprocessor, z.boolean().optional()),
  }),
});

export type CreateProductType = z.infer<typeof CreateProductSchema>["body"];
export type UpdateProductType = z.infer<typeof UpdateProductSchema>["body"];
