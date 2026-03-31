import { z } from "zod";

const OrderItemSchema = z.object({
  productId: z.string().min(1, "상품 ID가 필요합니다."),
  sizeId: z.number().int().min(1, "사이즈 ID가 필요합니다."),
  quantity: z.number().int().min(1, "수량은 1 이상의 정수여야 합니다."),
});

// 주문 생성 스키마
export const CreateOrderSchema = z.object({
  body: z.object({
    name: z.string().min(1, "수령인 이름을 입력해주세요."),
    phoneNumber: z.string().min(1, "수령인 연락처를 입력해주세요."),
    address: z.string().min(1, "배송지 주소를 입력해주세요."),
    orderItems: z.array(OrderItemSchema).min(1, "주문할 상품이 최소 1개 이상이어야 합니다."),
    usePoint: z.number().int().min(0, "사용할 포인트는 0 이상이어야 합니다.").default(0),
  }),
});

// 주문 상태 변경 스키마 (취소나 발송 등)
export const UpdateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Pending", "Paid", "Shipping", "Delivered", "Cancelled"], {
      message: "올바른 주문 상태를 입력해주세요.",
    }),
  }),
});

export type CreateOrderType = z.infer<typeof CreateOrderSchema>["body"];
export type OrderItemType = z.infer<typeof OrderItemSchema>;
export type UpdateOrderStatusType = z.infer<typeof UpdateOrderStatusSchema>["body"];
