import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  private authService = new AuthService();

  // 로그인 API
  public login = async (req: Request, res: Response) => {
    // Service에서 Access/Refresh Token과 안전한 User 객체를 반환받음
    const loginResult = await this.authService.login(req.body);

    // 로그인은 생성 행위로 보고 보통 201을 응답 (요구사항 Swagger 기준)
    return res.status(201).json(loginResult);
  };

  // 리프레시 토큰으로 액세스 토큰 재발급 API
  public refresh = async (req: Request, res: Response) => {
    const refreshResult = await this.authService.refresh(req.body);
    
    // 재발급 성공 (200 OK)
    return res.status(200).json(refreshResult);
  };

  // 로그아웃 API (토큰을 무효화시킴)
  public logout = async (req: Request, res: Response) => {
    // Auth 미들웨어(authenticate)를 통과했다면 req.user가 무조건 존재합니다.
    const userId = req.user!.id;
    const logoutResult = await this.authService.logout(userId);

    return res.status(200).json(logoutResult);
  };
}
