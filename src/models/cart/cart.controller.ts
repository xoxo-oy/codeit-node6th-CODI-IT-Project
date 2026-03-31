import { Request, Response } from "express";
import { CartService } from "./cart.service";
import { responseMsg } from "../../lib/response";

export class CartController {
  private cartService = new CartService();

  // GET /api/cart
  public getMyCart = async (req: Request, res: Response) => {
    // authenticate 미들웨어를 거치므로 req.user 보장됨
    const cart = await this.cartService.getMyCart(req.user!.id);
    return res.status(200).json(cart);
  };

  // POST /api/cart
  public addCart = async (req: Request, res: Response) => {
    // 바디가 비어있으면(Frontend postCart()) 단순히 장바구니 존재 여부만 보장
    if (!req.body || Object.keys(req.body).length === 0) {
      const result = await this.cartService.ensureCart(req.user!.id);
      return res.status(201).json(result);
    }
    const item = await this.cartService.addCart(req.user!.id, req.body);
    return res.status(201).json(item);
  };

  // PATCH /api/cart (벌크 수정/동기화)
  public syncCart = async (req: Request, res: Response) => {
    const items = await this.cartService.syncCart(req.user!.id, req.body);
    return res.status(200).json(items); // 프론트엔드는 배열 형태를 직접 기대함
  };

  // PATCH /api/cart/:cartItemId (단일 수량 변경)
  public updateCartItem = async (req: Request, res: Response) => {
    const cartItemId = req.params.cartItemId as string;
    const item = await this.cartService.updateCartItem(req.user!.id, cartItemId, req.body);
    return res.status(200).json(item);
  };

  // DELETE /api/cart/:cartItemId
  public deleteCartItem = async (req: Request, res: Response) => {
    const cartItemId = req.params.cartItemId as string;
    await this.cartService.deleteCartItem(req.user!.id, cartItemId);
    return res.status(200).json({ success: true });
  };
}
