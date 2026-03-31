import { InquiryRepository } from "./inquiry.repository";
import { CreateInquiryType, UpdateInquiryType, ReplyType } from "./inquiry.dto";
import { NotFoundError, ForbiddenError } from "../../lib/customErrors";
import { prisma } from "../../lib/prisma";

export class InquiryService {
  private inquiryRepository = new InquiryRepository();

  public async getProductInquiries(productId: string, page = 1, pageSize = 10) {
    const list = await this.inquiryRepository.findByProductId(productId, (page - 1) * pageSize, pageSize);
    let total = await prisma.inquiry.count({ where: { productId } });
    return { list, page, pageSize, totalPages: Math.ceil(total / pageSize), total };
  }

  // 내 스토어에 달린 답변 대기중 문의 목록(SELLER) / 내가 남긴 문의 목록(BUYER) 분기 처리
  public async getInquiries(user: { id: string; type: string }, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    let list, total;
    if (user.type === "SELLER") {
      const store = await prisma.store.findUnique({ where: { userId: user.id } });
      if (!store) throw new NotFoundError("스토어가 없습니다.");
      list = await this.inquiryRepository.findByStoreId(store.id, skip, pageSize);
      total = await prisma.inquiry.count({ where: { product: { storeId: store.id } } });
    } else {
      list = await this.inquiryRepository.findByUserId(user.id, skip, pageSize);
      total = await prisma.inquiry.count({ where: { userId: user.id } });
    }
    return { list, page, pageSize, totalPages: Math.ceil(total / pageSize), total };
  }

  public async createInquiry(userId: string, productId: string, dto: CreateInquiryType) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("해당 상품을 찾을 수 없습니다.");
    return this.inquiryRepository.createInquiry(userId, productId, dto);
  }

  public async updateInquiry(userId: string, inquiryId: string, dto: UpdateInquiryType) {
    const inquiry = await this.inquiryRepository.findById(inquiryId);
    if (!inquiry) throw new NotFoundError("해당 문의글을 찾을 수 없습니다.");
    if (inquiry.userId !== userId) throw new ForbiddenError("본인의 문의만 수정할 수 있습니다.");
    return this.inquiryRepository.updateInquiry(inquiryId, dto);
  }

  public async deleteInquiry(userId: string, inquiryId: string) {
    const inquiry = await this.inquiryRepository.findById(inquiryId);
    if (!inquiry) throw new NotFoundError("해당 문의글을 찾을 수 없습니다.");
    if (inquiry.userId !== userId) throw new ForbiddenError("본인의 문의만 삭제할 수 있습니다.");
    return this.inquiryRepository.deleteInquiry(inquiryId);
  }

  // 판매자가 상품 문의에 답변 다는 로직
  public async createReply(userId: string, inquiryId: string, dto: ReplyType) {
    const inquiry = await this.inquiryRepository.findById(inquiryId);
    if (!inquiry) throw new NotFoundError("문의글을 찾을 수 없습니다.");

    // 권한 검사: 이 문의가 달린 스토어의 주인이 본인인지 확인
    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store || store.id !== inquiry.product.storeId) {
      throw new ForbiddenError("본인 스토어의 상품 문의에만 답변할 수 있습니다.");
    }

    if (inquiry.reply) {
      throw new ForbiddenError("이미 답변이 등록된 문의입니다.");
    }

    return this.inquiryRepository.createReply(userId, inquiryId, dto.content);
  }
}
