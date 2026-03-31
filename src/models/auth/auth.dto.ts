import { z } from "zod";

// 1. 로그인 스키마
export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email("유효한 이메일 형식이 아닙니다."),
    password: z.string().min(1, "비밀번호를 입력해주세요."),
  }),
});

// 2. 리프레시 토큰 재발급 스키마 (본문으로 받을경우)
export const RefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh Token이 제공되지 않았습니다."),
  }),
});

export type LoginType = z.infer<typeof LoginSchema>["body"];
export type RefreshType = z.infer<typeof RefreshSchema>["body"];
