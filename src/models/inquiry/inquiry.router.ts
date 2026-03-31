import { Router } from "express";
import { InquiryController } from "./inquiry.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { UpdateInquirySchema, ReplySchema } from "./inquiry.dto";
import { asyncHandler } from "../../lib/asyncHandler";

const inquiryRouter = Router();
const inquiryController = new InquiryController();

// 1. 내 문의 조회 / 상점에 달린 문의 조회 분기 (GET /api/inquiries)
inquiryRouter.get("/", authenticate, asyncHandler(inquiryController.getMyInquiries));

// 2. 작성한 문의글 수정 (PATCH /api/inquiries/:inquiryId)
inquiryRouter.patch(
  "/:inquiryId",
  authenticate,
  validate(UpdateInquirySchema),
  asyncHandler(inquiryController.updateInquiry)
);

// 3. 문의글 삭제 (DELETE /api/inquiries/:inquiryId)
inquiryRouter.delete("/:inquiryId", authenticate, asyncHandler(inquiryController.deleteInquiry));

// 4. 문의글 답변 작성 (POST /api/inquiries/:inquiryId/replies)
inquiryRouter.post(
  "/:inquiryId/replies",
  authenticate,
  validate(ReplySchema),
  asyncHandler(inquiryController.createReply)
);

export default inquiryRouter;
