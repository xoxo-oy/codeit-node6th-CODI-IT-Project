import { z } from "zod";

// 1. 문의글 작성 스키마 (BUYER)
export const CreateInquirySchema = z.object({
  body: z.object({
    title: z.string().min(1, "제목을 입력해주세요."),
    content: z.string().min(1, "문의 내용을 입력해주세요."),
    isSecret: z.boolean().optional().default(false), // 비밀글 여부
  }),
});

// 2. 문의글 수정 스키마 (BUYER)
export const UpdateInquirySchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    isSecret: z.boolean().optional(),
  }),
});

// 3. 문의 답변 작성/수정 스키마 (SELLER)
export const ReplySchema = z.object({
  body: z.object({
    content: z.string().min(1, "답변 내용을 입력해주세요."),
  }),
});

export type CreateInquiryType = z.infer<typeof CreateInquirySchema>["body"];
export type UpdateInquiryType = z.infer<typeof UpdateInquirySchema>["body"];
export type ReplyType = z.infer<typeof ReplySchema>["body"];
