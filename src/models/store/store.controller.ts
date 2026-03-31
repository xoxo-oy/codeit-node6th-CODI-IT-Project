import { Request, Response } from "express";
import { StoreService } from "./store.service";
import { responseMsg } from "../../lib/response";

export class StoreController {
  private storeService = new StoreService();

  // POST /api/stores
  public create = async (req: Request, res: Response) => {
    // multer-s3 로부터 S3 경로를 직접 파싱받음
    const imagePath = req.file ? (req.file as any).location : undefined;
    
    // Auth 미들웨어를 통과한 user 정보를 넘겨 SELLER 인지 로직에서 확인
    const store = await this.storeService.createStore(req.user!, req.body, imagePath);
    return res.status(201).json(store);
  };

  // GET /api/stores/detail/my
  public getMyStore = async (req: Request, res: Response) => {
    const store = await this.storeService.getMyStore(req.user!.id);
    return res.status(200).json(store);
  };

  // GET /api/stores/:storeId
  public getStoreDetail = async (req: Request, res: Response) => {
    const storeId = req.params.storeId as string;
    const store = await this.storeService.getStoreDetail(storeId);
    return res.status(200).json(store);
  };

  // PATCH /api/stores/:storeId
  public updateStore = async (req: Request, res: Response) => {
    const storeId = req.params.storeId as string;
    const imagePath = req.file ? (req.file as any).location : undefined;
    
    const store = await this.storeService.updateStore(req.user!, storeId, req.body, imagePath);
    return res.status(200).json(store);
  };

  // POST & DELETE /api/stores/:storeId/favorite
  public toggleFavorite = async (req: Request, res: Response) => {
    const storeId = req.params.storeId as string;
    const result = await this.storeService.toggleFavorite(req.user!.id, storeId);
    
    // 명세서 규격: status("added"/"removed") -> type("register"/"delete")
    const type = result.status === "added" ? "register" : "delete";
    const responseData = {
      type,
      store: result.store
    };

    if (type === "register") {
      return res.status(201).json(responseData);
    } else {
      return res.status(200).json(responseData);
    }
  };
}
