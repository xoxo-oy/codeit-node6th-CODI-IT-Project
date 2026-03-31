import { prisma } from "../../lib/prisma";
import { CreateInquiryType, UpdateInquiryType, ReplyType } from "./inquiry.dto";

export class InquiryRepository {
  // 특정 상품의 문의 목록 조회 (페이지네이션 적용)
  public async findByProductId(productId: string, skip: number, take: number) {
    return prisma.inquiry.findMany({
      where: { productId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } }, 
        reply: true // 판매자 답변도 같이 로드
      },
    });
  }

  // 상점 단위(내 스토어에 달린) 문의 목록 조회 (판매자용)
  public async findByStoreId(storeId: string, skip: number, take: number) {
    return prisma.inquiry.findMany({
      where: { product: { storeId } },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { 
        product: { select: { name: true } },
        user: { select: { name: true } },
        reply: true
      },
    });
  }

  // 본인이 남긴 문의 목록 조회 (구매자용)
  public async findByUserId(userId: string, skip: number, take: number) {
    return prisma.inquiry.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true } }, reply: true },
    });
  }

  public async findById(id: string) {
    return prisma.inquiry.findUnique({
      where: { id },
      include: { product: { select: { storeId: true } }, reply: true },
    });
  }

  public async createInquiry(userId: string, productId: string, data: CreateInquiryType) {
    return prisma.inquiry.create({
      data: {
        userId,
        productId,
        title: data.title,
        content: data.content,
        isSecret: data.isSecret,
        status: "WaitingAnswer"
      },
    });
  }

  public async updateInquiry(id: string, data: UpdateInquiryType) {
    return prisma.inquiry.update({
      where: { id },
      data,
    });
  }

  public async deleteInquiry(id: string) {
    return prisma.inquiry.delete({ where: { id } });
  }

  // 답변 관련 처리 (SELLER용)
  public async createReply(userId: string, inquiryId: string, content: string) {
    return prisma.$transaction(async (tx: any) => {
      const reply = await tx.inquiryReply.create({
        data: { inquiryId, userId, content }
      });
      // 답변이 달렸으므로 문의 상태 업데이트
      await tx.inquiry.update({
        where: { id: inquiryId },
        data: { status: "Answered" }
      });
      return reply;
    });
  }
}
