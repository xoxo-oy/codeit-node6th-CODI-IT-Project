import { Request, Response } from "express";
import { ReviewService } from "./review.service";
import { responseMsg } from "../../lib/response";

export class ReviewController {
  private reviewService = new ReviewService();

  // GET /api/product/:productId/reviews
  public getProductReviews = async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || 10;
    
    // 리뷰 통계가 포함된 배열 및 메타 데이터 리턴
    const result = await this.reviewService.getProductReviews(productId, page, pageSize);
    return res.status(200).json(result); 
    // 주의: Swagger 명세서상 ReviewListResponseDto는 직접 응답 최상단에 포함됨을 가정
  };

  // POST /api/product/:productId/reviews
  public createReview = async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const review = await this.reviewService.createReview(req.user!.id, productId, req.body);
    return res.status(201).json(review);
  };

  // GET /api/review/:reviewId
  public getReviewDetail = async (req: Request, res: Response) => {
    const reviewId = req.params.reviewId as string;
    const review = await this.reviewService.getReviewDetail(reviewId);
    return res.status(200).json(review);
  };

  // PATCH /api/review/:reviewId
  public updateReview = async (req: Request, res: Response) => {
    const reviewId = req.params.reviewId as string;
    const review = await this.reviewService.updateReview(req.user!.id, reviewId, req.body);
    return res.status(200).json(review);
  };

  // DELETE /api/review/:reviewId
  public deleteReview = async (req: Request, res: Response) => {
    const reviewId = req.params.reviewId as string;
    await this.reviewService.deleteReview(req.user!.id, reviewId);
    return res.status(200).json({ success: true });
  };
}
