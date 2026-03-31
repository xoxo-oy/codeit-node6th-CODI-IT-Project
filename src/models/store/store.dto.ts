import { z } from "zod";

// 스토어 생성 스키마 (multipart/form-data)
export const CreateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(1, "스토어 이름을 입력해주세요."),
    address: z.string().min(1, "주소를 입력해주세요."),
    detailAddress: z.string().min(1, "상세 주소를 입력해주세요."),
    phoneNumber: z.string().min(1, "전화번호를 입력해주세요."),
    content: z.string().min(1, "스토어 설명을 입력해주세요."),
    // image 파라미터는 multer(req.file)가 별도로 처리하므로 body에는 포함되지 않음
  }),
});

// 스토어 수정 스키마
export const UpdateStoreSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    detailAddress: z.string().optional(),
    phoneNumber: z.string().optional(),
    content: z.string().optional(),
  }),
});

export type CreateStoreType = z.infer<typeof CreateStoreSchema>["body"];
export type UpdateStoreType = z.infer<typeof UpdateStoreSchema>["body"];
