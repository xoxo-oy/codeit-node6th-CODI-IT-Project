import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { responseMsg } from "../../lib/response";

export class ProductController {
  private productService = new ProductService();

  // POST /api/products
  public create = async (req: Request, res: Response) => {
    const userId = req.user!.id; // auth.middleware 통과 보장
    const baseUrl = process.env.BACKEND_URL || "";
    const imagePath = req.file ? `${baseUrl}/uploads/${req.file.filename}` : undefined;

    const product = await this.productService.createProduct(userId, req.body, imagePath);
    return res.status(201).json(product);
  };

  // GET /api/products
  public getList = async (req: Request, res: Response) => {
    const listData = await this.productService.getProductList(req.query);
    return res.status(200).json(listData);
  };

  // GET /api/products/:productId
  public getDetail = async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const product = await this.productService.getProductDetail(productId);
    return res.status(200).json(product);
  };

  // PATCH /api/products/:productId
  public update = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const productId = req.params.productId as string;
    const baseUrl = process.env.BACKEND_URL || "";
    const imagePath = req.file ? `${baseUrl}/uploads/${req.file.filename}` : undefined;

    const product = await this.productService.updateProduct(userId, productId, req.body, imagePath);
    return res.status(200).json(product);
  };

  // DELETE /api/products/:productId
  public deleteProduct = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const productId = req.params.productId as string;

    await this.productService.deleteProduct(userId, productId);
    return res.status(200).json({ success: true });
  };
}
