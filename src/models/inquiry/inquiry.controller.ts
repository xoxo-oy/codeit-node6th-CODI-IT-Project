import { Request, Response } from "express";
import { InquiryService } from "./inquiry.service";
import { responseMsg } from "../../lib/response";

export class InquiryController {
  private inquiryService = new InquiryService();

  // GET /api/products/:productId/inquiries (public 가능? 명세에 따라 authenticate 분기)
  public getProductInquiries = async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    const result = await this.inquiryService.getProductInquiries(productId, page, pageSize);
    return res.status(200).json(result);
  };

  // POST /api/products/:productId/inquiries
  public createInquiry = async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const inquiry = await this.inquiryService.createInquiry(req.user!.id, productId, req.body);
    return res.status(201).json(inquiry);
  };

  // GET /api/inquiries (나의 문의내역 or 내 스토어 문의내역)
  public getMyInquiries = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await this.inquiryService.getInquiries(req.user!, page, pageSize);
    return res.status(200).json(result);
  };

  // PATCH /api/inquiries/:inquiryId
  public updateInquiry = async (req: Request, res: Response) => {
    const inquiryId = req.params.inquiryId as string;
    const inquiry = await this.inquiryService.updateInquiry(req.user!.id, inquiryId, req.body);
    return res.status(200).json(inquiry);
  };

  // DELETE /api/inquiries/:inquiryId
  public deleteInquiry = async (req: Request, res: Response) => {
    const inquiryId = req.params.inquiryId as string;
    await this.inquiryService.deleteInquiry(req.user!.id, inquiryId);
    return res.status(200).json({ success: true });
  };

  // POST /api/inquiries/:inquiryId/replies (판매자 답변)
  public createReply = async (req: Request, res: Response) => {
    const inquiryId = req.params.inquiryId as string;
    const reply = await this.inquiryService.createReply(req.user!.id, inquiryId, req.body);
    return res.status(201).json(reply);
  };
}
