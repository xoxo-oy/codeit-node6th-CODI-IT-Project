import { Request, Response } from "express";
import { UserService } from "./user.service";
import { responseMsg } from "../../lib/response";

export class UserController {
  private userService = new UserService();

  public create = async (req: Request, res: Response) => {
    const createdUser = await this.userService.register(req.body);
    return res.status(201).json(createdUser);
  };

  public getMe = async (req: Request, res: Response) => {
    const user = await this.userService.getMe(req.user!.id);
    return res.status(200).json(user);
  };

  public updateMe = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    // multer 미들웨어(upload.single) 거쳐서 이미지가 있다면 req.file에 들어있습니다.
    let imagePath = undefined;
    if (req.file) {
      // 로컬 저장을 사용할 경우 /uploads/파일명 형식을 사용합니다.
      const baseUrl = process.env.BACKEND_URL || "";
      imagePath = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const updatedUser = await this.userService.updateMe(userId, req.body, imagePath);
    return res.status(200).json(updatedUser);
  };

  public getLikedStores = async (req: Request, res: Response) => {
    const stores = await this.userService.getLikedStores(req.user!.id);
    return res.status(200).json(stores);
  };

  public deleteUser = async (req: Request, res: Response) => {
    await this.userService.deleteUser(req.user!.id);
    return res.status(200).json({ success: true });
  };
}
