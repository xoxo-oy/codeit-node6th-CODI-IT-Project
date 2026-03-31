import { ProductRepository } from "./product.repository";
import { CreateProductType, UpdateProductType } from "./product.dto";
import { ForbiddenError, NotFoundError } from "../../lib/customErrors";
import { prisma } from "../../lib/prisma";

export class ProductService {
  private productRepository = new ProductRepository();

  public async createProduct(userId: string, dto: CreateProductType, imagePath?: string) {
    // 1. 해당 유저가 소유한 스토어가 있는지 먼저 확인 (판매자인지 및 스토어 개설여부 체크)
    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store) {
      throw new ForbiddenError("스토어가 없는 유저는 상품을 등록할 수 없습니다.");
    }

    // 2. 상품 등록 진행
    const product = await this.productRepository.createProduct(store.id, dto, imagePath);
    return product;
  }

  private cleanParam(val: any): string | undefined {
    if (val === undefined || val === null) return undefined;
    const str = String(val).trim();
    if (str === "" || str === "null" || str === "undefined" || str === "NaN") return undefined;
    return str;
  }

  public async getProductList(query: any) {
    // 1. Controller에서 전달받은 Query 파라미터(문자열)를 숫자 데이터로 파싱 (Swagger 규격 준수)
    const pageStr = this.cleanParam(query.page);
    const pageSizeStr = this.cleanParam(query.pageSize);
    
    const page = pageStr && !isNaN(Number(pageStr)) ? parseInt(pageStr) : 1;
    const pageSize = pageSizeStr && !isNaN(Number(pageSizeStr)) ? parseInt(pageSizeStr) : 16;
    
    const search = this.cleanParam(query.search);
    const sort = this.cleanParam(query.sort);
    
    const priceMinStr = this.cleanParam(query.priceMin);
    const priceMaxStr = this.cleanParam(query.priceMax);
    
    const priceMin = (priceMinStr && !isNaN(Number(priceMinStr))) ? parseInt(priceMinStr) : undefined;
    const priceMax = (priceMaxStr && !isNaN(Number(priceMaxStr))) ? parseInt(priceMaxStr) : undefined;
    
    const categoryName = this.cleanParam(query.categoryName);
    const storeId = this.cleanParam(query.favoriteStore); // Swagger parameter name

    // 2. 파싱된 데이터를 레포지토리에 전달
    return this.productRepository.findProducts({
      page,
      pageSize,
      search,
      sort,
      priceMin,
      priceMax,
      categoryName,
      storeId,
    });
  }

  public async getProductDetail(productId: string) {
    const product = await this.productRepository.findProductById(productId);
    if (!product) throw new NotFoundError("해당 상품을 찾을 수 없습니다.");
    return product;
  }

  public async updateProduct(userId: string, productId: string, dto: UpdateProductType, imagePath?: string) {
    // 1. 해당 상품이 존재하는지 파악
    const product = await this.productRepository.findProductById(productId);
    if (!product) throw new NotFoundError("해당 상품을 찾을 수 없습니다.");

    // 2. 권한 점검 (내 스토어의 상품인지 확인)
    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store || store.id !== product.storeId) {
      throw new ForbiddenError("본인의 스토어에 등록된 상품만 수정할 수 있습니다.");
    }

    // 3. 업데이트 데이터 조립
    const updateData: any = { ...dto };
    if (imagePath) updateData.image = imagePath;

    // TODO: discountDate 검증
    if (dto.categoryName) {
      const category = await this.productRepository.upsertCategory(dto.categoryName);
      updateData.category = { connect: { id: category.id } }; // 프리즈마 관계 수정 로직
      delete updateData.categoryName;
    }

    return this.productRepository.updateProduct(productId, updateData);
  }

  public async deleteProduct(userId: string, productId: string) {
    const product = await this.productRepository.findProductById(productId);
    if (!product) throw new NotFoundError("해당 상품을 찾을 수 없습니다.");

    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store || store.id !== product.storeId) {
      throw new ForbiddenError("본인 스토어의 상품만 삭제할 수 있습니다.");
    }

    await this.productRepository.deleteProduct(productId);
  }
}
