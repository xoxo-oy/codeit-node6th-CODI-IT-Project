import { prisma } from "../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../lib/customErrors";

export class DashboardService {
  public async getDashboardStats(userId: string) {
    // 1. 권한 체크 : SELLER이고 스토어가 있는지
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { stores: true } });
    if (!user || user.type !== "SELLER" || !user.stores) {
      throw new ForbiddenError("스토어가 등록된 판매자만 접근 가능합니다.");
    }
    const storeId = user.stores.id;

    // 2. 해당 스토어 상품들의 모든 주문 항목(OrderItem) 불러오기
    // 실제 서비스에선 날짜별 쿼리를 개별로 쏘거나 groupBy로 최적화하지만 여기서는 O(N) 필터링 (데이터 작음 가정)
    const storeOrderItems = await prisma.orderItem.findMany({
      where: {
        product: { storeId },
      },
      include: {
        product: true,
        order: { select: { createdAt: true } },
      },
    });

    // 3. 현재 시간 기준 날짜 객체들
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 이번 주 일요일 시작
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 날짜별 통계 구조체
    const stats = {
      today: { sales: 0, orderCount: 0 },
      week: { sales: 0, orderCount: 0 },
      month: { sales: 0, orderCount: 0 },
      year: { sales: 0, orderCount: 0 },
    };

    // 상품별 매출 집계 (Top Sales 용도)
    const productRevenueMap: Record<string, { name: string; sales: number }> = {};
    const priceRangeMap = { "0~5만": 0, "5~10만": 0, "10만+": 0 };

    storeOrderItems.forEach((item: any) => {
      const orderDate = item.order.createdAt;
      const revenue = item.price * item.quantity;
      const productId = item.productId;

      // 시간별 매출 추가
      if (orderDate >= startOfToday) { stats.today.sales += revenue; stats.today.orderCount++; }
      if (orderDate >= startOfWeek) { stats.week.sales += revenue; stats.week.orderCount++; }
      if (orderDate >= startOfMonth) { stats.month.sales += revenue; stats.month.orderCount++; }
      if (orderDate >= startOfYear) { stats.year.sales += revenue; stats.year.orderCount++; }

      // 상품별 매출 추가
      if (!productRevenueMap[productId]) {
        productRevenueMap[productId] = { name: item.product.name, sales: 0 };
      }
      productRevenueMap[productId].sales += revenue;

      // 가격대 비율 추가용 데이터 누적 (단가가 어느 가격대 였는지)
      if (item.price < 50000) priceRangeMap["0~5만"] += item.quantity;
      else if (item.price < 100000) priceRangeMap["5~10만"] += item.quantity;
      else priceRangeMap["10만+"] += item.quantity;
    });

    // Top 5 정렬
    const topSales = Object.values(productRevenueMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 반환 포맷 (Swagger 형식 참조)
    return {
      today: stats.today,
      week: stats.week,
      month: stats.month,
      year: stats.year,
      topSales,
      priceRange: [
        { range: "0~5만", count: priceRangeMap["0~5만"] },
        { range: "5~10만", count: priceRangeMap["5~10만"] },
        { range: "10만+", count: priceRangeMap["10만+"] },
      ],
    };
  }
}
