import { z } from "zod";

// 1. 회원가입 DTO
export const CreateUserSchema = z.object({
  body: z.object({
    email: z.string().email("유효한 이메일 형식이 아닙니다."),
    password: z
      .string()
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
        "비밀번호는 영문, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다."
      ),
    name: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다."),
    type: z.enum(["BUYER", "SELLER"], {
      message: "유저 타입은 BUYER 또는 SELLER만 가능합니다.",
    }),
  }),
});

// 2. 내 정보 수정 DTO (multipart/form-data로 오기 때문에 모두 string 처리됨)
export const UpdateUserSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."), // 필수 검증
    name: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다.").optional(),
    password: z
      .string()
      .min(8, "새 비밀번호는 최소 8자 이상이어야 합니다.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
        "비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다."
      )
      .optional()
      .or(z.literal("")), // 빈 문자열이 올 수도 있으므로 허용
  }),
});

export type CreateUserType = z.infer<typeof CreateUserSchema>["body"];
export type UpdateUserType = z.infer<typeof UpdateUserSchema>["body"];
