import bcrypt from "bcrypt";
import { UserRepository } from "./user.repository";
import { CreateUserType, UpdateUserType } from "./user.dto";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../lib/customErrors";

export class UserService {
  private userRepository = new UserRepository();

  public async register(dto: CreateUserType) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError("이미 사용 중인 이메일입니다.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    // 회원가입 시 기본 등급(grade_green) 할당
    return this.userRepository.createUser({ ...dto, passwordHash, gradeId: "grade_green" });
  }

  // 내 정보 조회
  public async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("요청한 리소스를 찾을 수 없습니다."); // Swagger의 404 메시지
    }
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  // 내 정보 수정 (비밀번호 체크 로직 포함)
  public async updateMe(userId: string, dto: UpdateUserType, imagePath?: string) {
    const user = await this.userRepository.findUserWithPassword(userId);
    if (!user) throw new NotFoundError("존재하지 않는 유저 입니다.");

    // 1. 기존 비밀번호 일치 여부 2차 검증 (보안 요구사항 구현)
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("현재 비밀번호가 일치하지 않습니다.");
    }

    // 2. 수정할 항목 필터링
    const updateData: { name?: string; password?: string; image?: string } = {};
    if (dto.name) updateData.name = dto.name;
    if (imagePath) updateData.image = imagePath;

    // 만약 새 비밀번호(password) 항목이 들어왔다면 암호화해서 교체!
    if (dto.password && dto.password.trim() !== "") {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    // 3. DB 실제 수정 작업
    const updatedUser = await this.userRepository.updateUser(userId, updateData);
    return updatedUser;
  }

  // 회원 탈퇴
  public async deleteUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("존재하지 않는 유저 입니다.");

    await this.userRepository.deleteUser(userId);
  }

  // 찜(관심) 상점 리스트
  public async getLikedStores(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("존재하지 않는 유저 입니다.");

    const favoriteStores = await this.userRepository.findLikedStores(userId);
    return favoriteStores;
  }
}
