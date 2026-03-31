import { Router } from "express";
import { ProductController } from "./product.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { CreateProductSchema, UpdateProductSchema } from "./product.dto";
import { asyncHandler } from "../../lib/asyncHandler";
import { InquiryController } from "../inquiry/inquiry.controller";
import { validate as inquiryValidate } from "../../middlewares/validate.middleware";
import { CreateInquirySchema } from "../inquiry/inquiry.dto";

const productRouter = Router();
const productController = new ProductController();
const inquiryController = new InquiryController();

// 1. 상품 등록: 인증 -> 폼데이터이미지(Multer) -> Zod -> 로직수행 (트랜잭션)
productRouter.post(
  "/",
  authenticate,
  upload.single("image"),
  validate(CreateProductSchema),
  asyncHandler(productController.create)
);

// 7. 특정 상품에 새로운 문의 등록 (POST /api/products/:productId/inquiries)
productRouter.post(
  "/:productId/inquiries",
  authenticate,
  inquiryValidate(CreateInquirySchema),
  asyncHandler(inquiryController.createInquiry)
);

// 2. 상품 리스트 조회 (필터링 및 페이징): 누구나(비회원도) 접근 가능
productRouter.get("/", asyncHandler(productController.getList));

// 3. 상품 상세 정보 수정: 내 상점의 상품인지 로직단 방어 필요
productRouter.patch(
  "/:productId",
  authenticate,
  upload.single("image"),
  validate(UpdateProductSchema),
  asyncHandler(productController.update)
);

// 4. 상품 삭제 (본인 스토어 체크 필요)
productRouter.delete("/:productId", authenticate, asyncHandler(productController.deleteProduct));

// 5. 상품 내역의 모든 문의 조회 (GET /api/products/:productId/inquiries)  - 누구나 접근 가능 가정
productRouter.get("/:productId/inquiries", asyncHandler(inquiryController.getProductInquiries));

// 6. 단일 상품 상세 조회 (누구나 접근): :productId가 잡히므로 가장 밑에 배치
productRouter.get("/:productId", asyncHandler(productController.getDetail));

export default productRouter;
