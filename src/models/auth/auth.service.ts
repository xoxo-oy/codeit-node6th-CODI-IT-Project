import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { LoginType, RefreshType } from "./auth.dto";
import { UnauthorizedError, NotFoundError } from "../../lib/customErrors";
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../../lib/constants";

export class AuthService {
  private authRepository = new AuthRepository();

  public async login(dto: LoginType) {
    // 1. 유저 찾기 (비밀번호, 등급 포함)
    const user = await this.authRepository.findUserForLogin(dto.email);
    if (!user) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 2. 비밀번호 불일치 검사 (Bcrypt)
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // 3. JWT Payload 생성
    const payload = { id: user.id, type: user.type, email: user.email };

    // 4. Access, Refresh 토큰 발급
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    // 5. DB에 Refresh Token 저장 (세션 탈취 방지, 다중 기기는 고려안함)
    await this.authRepository.saveRefreshToken(user.id, refreshToken);

    // 6. 응답할 때 보안상 위험한 비밀번호 및 RefreshToken 필드는 제거
    const { password, refreshToken: _rt, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken, // 명세서 요구가 바디 리턴이라면 바디에도 담음
    };
  }

  public async refresh(dto: RefreshType) {
    // 1. Refresh Token 검증
    let decoded;
    try {
      decoded = jwt.verify(dto.refreshToken, JWT_REFRESH_SECRET) as { id: string };
    } catch (err) {
      throw new UnauthorizedError("유효하지 않거나 만료된 Refresh Token입니다.");
    }

    // 2. DB에 존재하는 유저 & 저장된 토큰과 동일한지 크로스체크
    const user = await this.authRepository.findUserById(decoded.id);
    if (!user || user.refreshToken !== dto.refreshToken) {
      throw new UnauthorizedError("유효하지 않은 Refresh Token입니다.");
    }

    // 3. 새로운 Access Token 발급
    const payload = { id: user.id, type: user.type, email: user.email };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

    return { accessToken: newAccessToken };
  }

  public async logout(userId: string) {
    // DB에서 유저의 Refresh Token 데이터 삭제(무효화)
    await this.authRepository.saveRefreshToken(userId, null);
    return { message: "성공적으로 로그아웃되었습니다." };
  }
}
