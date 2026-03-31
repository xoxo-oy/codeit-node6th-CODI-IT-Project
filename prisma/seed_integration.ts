import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️  통합 테스트를 위한 대규모 모크 데이터 주입 시작...");

  // 1. 기존 데이터 정리 (관계 순서 고려)
  // 알림, 답변, 문의, 리뷰, 주문상품, 주문, 장바구니상품, 장바구니, 재고, 상품, 스토어, 유저, 사이즈, 카테고리, 등급 순
  console.log("♻️  기존 데이터 초기화...");
  await prisma.notification.deleteMany();
  await prisma.inquiryReply.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.size.deleteMany();
  await prisma.category.deleteMany();
  await prisma.grade.deleteMany();

  // 2. 등급 및 사이즈, 카테고리 생성
  console.log("📁  기초 데이터 생성 (등급, 사이즈, 카테고리)...");
  await prisma.grade.create({ data: { id: "grade_green", name: "Green", minAmount: 0, rate: 0 } });
  
  const sizeS = await prisma.size.create({ data: { name: "S", sizeEn: "S", sizeKo: "소" } });
  const sizeM = await prisma.size.create({ data: { name: "M", sizeEn: "M", sizeKo: "중" } });
  const sizeL = await prisma.size.create({ data: { name: "L", sizeEn: "L", sizeKo: "대" } });
  const sizeFREE = await prisma.size.create({ data: { name: "FREE", sizeEn: "FREE", sizeKo: "프리" } });

  const catTop = await prisma.category.create({ data: { name: "상의" } });
  const catBottom = await prisma.category.create({ data: { name: "하의" } });
  const catOuter = await prisma.category.create({ data: { name: "아우터" } });
  const catShoes = await prisma.category.create({ data: { name: "신발" } });
  const catBag = await prisma.category.create({ data: { name: "가방" } });
  const catDress = await prisma.category.create({ data: { name: "원피스" } });
  const catSkirt = await prisma.category.create({ data: { name: "스커트" } });
  const catAcc = await prisma.category.create({ data: { name: "액세서리" } });

  const hashedPw = await bcrypt.hash("Test1234!", 10);

  // 3. 테스트 계정 생성
  console.log("👤  테스트 계정 생성 (Buyer & Seller)...");
  const buyer = await prisma.user.create({
    data: {
      email: "buyer@test.com",
      password: hashedPw,
      name: "착한구매자",
      type: "BUYER",
      gradeId: "grade_green",
      points: 100000, // 10만 포인트
    }
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@test.com",
      password: hashedPw,
      name: "열정셀러",
      type: "SELLER",
      gradeId: "grade_green",
    }
  });

  // 4. 셀러 스토어 생성
  const myStore = await prisma.store.create({
    data: {
      userId: seller.id,
      name: "성공한 셀러의 스토어",
      address: "서울특별시 강남구",
      detailAddress: "테헤란로 123",
      phoneNumber: "010-1111-2222",
      content: "최고의 상품만 엄선하여 판매하는 프리미엄 스토어입니다.",
      image: "https://placehold.co/400x400?text=Premium+Store",
    }
  });

  // 5. 상품 및 재고 생성 (15개 이상)
  console.log("📦  다양한 상품 및 재고 생성 중...");
  const products = [
    { name: "베이직 오버핏 반팔", price: 29000, catId: catTop.id, discount: 10 },
    { name: "린넨 스트라이프 셔츠", price: 45000, catId: catTop.id },
    { name: "프리미엄 코튼 후드티", price: 59000, catId: catTop.id },
    { name: "와이드 실루엣 데님", price: 68000, catId: catBottom.id },
    { name: "슬림핏 블랙 슬랙스", price: 39000, catId: catBottom.id, discount: 20 },
    { name: "클래식 치노 팬츠", price: 42000, catId: catBottom.id },
    { name: "헤비웨이트 트렌치 코트", price: 189000, catId: catOuter.id },
    { name: "데일리 바시티 자켓", price: 95000, catId: catOuter.id, discount: 15 },
    { name: "미니멀 가디건", price: 55000, catId: catOuter.id },
    { name: "어반 레더 스니커즈", price: 129000, catId: catShoes.id },
    { name: "컴포트 런닝화", price: 89000, catId: catShoes.id, discount: 5 },
    { name: "데저트 부츠", price: 155000, catId: catShoes.id },
    { name: "여행용 대용량 백팩", price: 79000, catId: catBag.id },
    { name: "시티 메신저 백", price: 49000, catId: catBag.id },
    { name: "가죽 토트백", price: 110000, catId: catBag.id },
    { name: "플로럴 쉬폰 원피스", price: 55000, catId: catDress.id },
    { name: "머메이드 롱 스커트", price: 38000, catId: catSkirt.id },
    { name: "실버 레이어드 목걸이", price: 15000, catId: catAcc.id },
  ];

  const createdProducts = [];
  for (const p of products) {
    const prod = await prisma.product.create({
      data: {
        storeId: myStore.id,
        categoryId: p.catId,
        name: p.name,
        price: p.price,
        discountRate: p.discount || 0,
        content: `${p.name}의 상세 설명입니다. 고품질 원단을 사용하여 착용감이 우수합니다.`,
        image: `https://placehold.co/600x600?text=${encodeURIComponent(p.name)}`,
      }
    });

    // 재고 생성 (FREE 사이즈거나 기본 S,M,L)
    if (p.catId === catBag.id) {
        await prisma.productStock.create({ data: { productId: prod.id, sizeId: sizeFREE.id, quantity: 50 } });
    } else {
        await prisma.productStock.create({ data: { productId: prod.id, sizeId: sizeS.id, quantity: 10 } });
        await prisma.productStock.create({ data: { productId: prod.id, sizeId: sizeM.id, quantity: 20 } });
        await prisma.productStock.create({ data: { productId: prod.id, sizeId: sizeL.id, quantity: 15 } });
    }
    createdProducts.push(prod);
  }

  // 6. 장바구니 데이터 (Buyer 에게 2건)
  console.log("🛒  장바구니 및 주문 내역 구축 중...");
  const myCart = await prisma.cart.create({ data: { userId: buyer.id } });
  await prisma.cartItem.create({
    data: { cartId: myCart.id, productId: createdProducts[0].id, sizeId: sizeM.id, quantity: 1 }
  });
  await prisma.cartItem.create({
    data: { cartId: myCart.id, productId: createdProducts[3].id, sizeId: sizeL.id, quantity: 2 }
  });

  // 7. 완료된 주문 내역 (Buyer 에게 3건 - 리뷰 작성용)
  const completedOrderItems = [];
  for (let i = 0; i < 3; i++) {
    const orderProd = createdProducts[i + 5];
    const order = await prisma.order.create({
      data: {
        userId: buyer.id,
        name: "착한구매자",
        phoneNumber: "010-1111-2222",
        address: "서울시 강남구 테헤란로 123",
        subtotal: orderProd.price,
        totalQuantity: 1,
        usePoint: 0,
        orderItems: {
          create: {
            productId: orderProd.id,
            sizeId: sizeM.id,
            quantity: 1,
            price: orderProd.price,
            isReviewed: i === 0 ? true : false, // 첫 번째 항목만 리뷰 작성된 것으로 설정
          }
        },
        payments: {
          create: {
            price: orderProd.price,
            status: "COMPLETED"
          }
        }
      },
      include: { orderItems: true }
    });
    completedOrderItems.push(order.orderItems[0]);
  }

  // 8. 문의 및 리뷰 데이터
  console.log("💬  문의 및 리뷰 샘플 생성...");
  const inquiry = await prisma.inquiry.create({
    data: {
      userId: buyer.id,
      productId: createdProducts[0].id,
      title: "사이즈 문의드려요",
      content: "180에 75인데 L 사이즈 입으면 맞을까요?",
      isSecret: false,
    }
  });

  // 판매자의 답변 작성
  await prisma.inquiryReply.create({
    data: {
      inquiryId: inquiry.id,
      userId: seller.id,
      content: "네, 파트너님! L 사이즈면 원하시는 세미오버핏으로 예쁘게 맞으실 것 같습니다 :)",
    }
  });

  // 리뷰 작성 (주문 상품과 연결)
  await prisma.review.create({
    data: {
      userId: buyer.id,
      productId: createdProducts[5].id, // 첫 번째 주문 상품의 productId와 일치
      orderItemId: completedOrderItems[0].id,
      rating: 5,
      content: "원단이 정말 탄탄하고 색감이 화면보다 더 예뻐요. 강력 추천합니다!",
    }
  });

  console.log("✅  통합 테스트 데이터 구축 완료!");
  console.log(`🔑  Buyer: buyer@test.com / Test1234!`);
  console.log(`🔑  Seller: seller@test.com / Test1234!`);
}

main()
  .catch((e) => {
    console.error("❌  시딩 중 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
