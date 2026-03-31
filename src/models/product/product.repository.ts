import { prisma } from "../../lib/prisma";
import { CreateProductType, UpdateProductType } from "./product.dto";
import { Prisma } from "@prisma/client";

// 프론트엔드 영어 카테고리명과 DB 한국어 카테고리명 매핑
const CATEGORY_MAP: { [key: string]: string } = {
  TOP: "상의",
  BOTTOM: "하의",
  OUTER: "아우터",
  SHOES: "신발",
  BAG: "가방",
  DRESS: "원피스",
  SKIRT: "스커트",
  ACC: "액세서리",
};

const DEFAULT_IMAGE = "https://placehold.co/600x400?text=Codi-IT+Product";

export class ProductRepository {

  // 공통 상품 데이터 평탄화(Mapping) 헬퍼
  private mapProduct(p: any) {
    if (!p) return null;
    const { productStocks, ...rest } = p;
    return {
      ...rest,
      storeName: p.store?.name || "알 수 없는 스토어",
      discountPrice: p.price * (1 - (p.discountRate || 0) / 100),
      stocks: productStocks ? productStocks.map((ps: any) => ({
        id: ps.id,
        quantity: ps.quantity,
        size: ps.size,
      })) : [],
      reviewsCount: p.reviewsCount || 0,
      reviewsRating: p.reviewsRating || 0,
      sales: p.sales || 0,
    };
  }

  // 카테고리 이름으로 조회, 없으면 생성
  public async upsertCategory(name: string) {
    let category = await prisma.category.findFirst({ where: { name } });
    if (!category) {
      category = await prisma.category.create({ data: { name } });
    }
    return category;
  }

  // 1. 상품 등록 트랜잭션 (상품 기본 정보 + 사이즈별 재고를 동시에 생성)
  public async createProduct(storeId: string, data: CreateProductType, imagePath?: string) {
    const category = await this.upsertCategory(data.categoryName);

    return prisma.$transaction(async (tx: any) => {
      const product = await tx.product.create({
        data: {
          storeId,
          categoryId: category.id,
          name: data.name,
          price: data.price,
          content: data.content,
          image: imagePath || DEFAULT_IMAGE,
          discountRate: data.discountRate || 0,
          discountStartTime: data.discountStartTime ? new Date(data.discountStartTime) : null,
          discountEndTime: data.discountEndTime ? new Date(data.discountEndTime) : null,
        },
      });

      const stockData = data.stocks.map((stock) => ({
        productId: product.id,
        sizeId: stock.sizeId,
        quantity: stock.quantity,
      }));
      await tx.productStock.createMany({ data: stockData });

      return product;
    });
  }

  // 2. 다중 필터 및 정렬 기반의 상품 검색 (페이징 포함)
  public async findProducts(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: string;
    priceMin?: number;
    priceMax?: number;
    categoryName?: string;
    storeId?: string;
    size?: string;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 16;
    const skip = (page - 1) * pageSize;

    const whereCondition: Prisma.ProductWhereInput = {};

    if (params.search) {
      whereCondition.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { content: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if ((params.priceMin && params.priceMin > 0) || (params.priceMax && params.priceMax > 0)) {
      whereCondition.price = {};
      if (params.priceMin && params.priceMin > 0) whereCondition.price.gte = params.priceMin;
      if (params.priceMax && params.priceMax > 0) whereCondition.price.lte = params.priceMax;
    }

    if (params.size && params.size.trim() !== "") {
      whereCondition.productStocks = {
        some: {
          size: { name: params.size }
        }
      };
    }

    if (params.categoryName && params.categoryName.trim() !== "") {
      const categoryIdNum = Number(params.categoryName);
      // 숫자인 경우 (단, 0보다 커야 함) ID로 검색, 문자열인 경우 이름으로 검색
      if (!isNaN(categoryIdNum) && categoryIdNum > 0) {
        whereCondition.categoryId = categoryIdNum;
      } else {
        const mappedName = CATEGORY_MAP[params.categoryName.toUpperCase()] || params.categoryName;
        if (mappedName && mappedName.trim() !== "") {
          whereCondition.category = { name: mappedName };
        }
      }
    }

    if (params.storeId && params.storeId.trim() !== "") {
      whereCondition.storeId = params.storeId;
    }
    
    if (params.size && params.size.trim() !== "") {
      whereCondition.productStocks = { some: { size: { name: params.size } } };
    }

    let orderByCondition: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: "desc" };
    if (params.sort === "lowPrice") orderByCondition = { price: "asc" };
    else if (params.sort === "highPrice") orderByCondition = { price: "desc" };
    else if (params.sort === "latest") orderByCondition = { createdAt: "desc" };
    else if (params.sort === "salesRanking") {
      // 명세서 규격: 판매순 (실제 판매량 컬럼 부재 시 인기/최신 혼합)
      orderByCondition = [{ createdAt: "desc" }, { name: "asc" }];
    }
    // 디버그 로그 파일 기록 추가
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../../../../api_debug.log');
    const logEntry = `[${new Date().toISOString()}] Where: ${JSON.stringify(whereCondition, null, 2)}\n`;
    fs.appendFileSync(logPath, logEntry);

    const [totalItems, products] = await prisma.$transaction([
      prisma.product.count({ where: whereCondition }),
      prisma.product.findMany({
        where: whereCondition,
        orderBy: orderByCondition,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { 
          store: { select: { name: true } }, 
          productStocks: { include: { size: true } }, 
          category: { select: { name: true } } 
        },
      }),
    ]);

    return {
      list: products.map(p => this.mapProduct(p)),
      totalCount: totalItems,
      meta: { total: totalItems, page, pageSize, totalPages: Math.ceil(totalItems / pageSize) },
    };
  }

  // 상품 상세 조회
  public async findProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        store: true, 
        category: true, 
        productStocks: { 
          include: { size: true } 
        } 
      },
    });

    return this.mapProduct(product);
  }

  // 상품 업데이트
  public async updateProduct(productId: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  // 6. 상품 삭제
  public async deleteProduct(productId: string) {
    return prisma.$transaction(async (tx: any) => {
      await tx.productStock.deleteMany({ where: { productId } });
      return tx.product.delete({ where: { id: productId } });
    });
  }
}
