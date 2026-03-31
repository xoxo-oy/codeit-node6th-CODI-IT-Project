import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 데이터베이스 Mock Data Seeding 시작...");

  // 1. 카테고리 (Category)
  const categories = ["아우터", "상의", "바지", "신발", "가방", "모자"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { id: categories.indexOf(name) + 1 }, // AutoIncrement 대응
      update: {},
      create: { name },
    });
  }
  console.log("✅ 카테고리 목업 셋업 완료");

  // 2. 사이즈 (Size)
  const sizes = [
    { sizeEn: "S", sizeKo: "스몰" },
    { sizeEn: "M", sizeKo: "미디엄" },
    { sizeEn: "L", sizeKo: "라지" },
    { sizeEn: "XL", sizeKo: "엑스라지" },
    { sizeEn: "FREE", sizeKo: "프리" }, // 악세사리/모자/가방 용
  ];
  for (let i = 0; i < sizes.length; i++) {
    await prisma.size.upsert({
      where: { id: i + 1 },
      update: {},
      create: { name: sizes[i].sizeEn, sizeEn: sizes[i].sizeEn, sizeKo: sizes[i].sizeKo },
    });
  }
  console.log("✅ 사이즈 테이블 셋업 완료");

  // 3. 회원 등급 (Grade)
  const grades = [
    { id: "grade_green", name: "Green", rate: 0, minAmount: 0 },
    { id: "grade_silver", name: "Silver", rate: 5, minAmount: 100000 },
    { id: "grade_gold", name: "Gold", rate: 10, minAmount: 500000 },
    { id: "grade_vip", name: "VIP", rate: 15, minAmount: 1000000 },
  ];
  for (const grade of grades) {
    await prisma.grade.upsert({
      where: { id: grade.id },
      update: {},
      create: grade,
    });
  }
  console.log("✅ 회원 등급 정책 셋업 완료");

  // 4. 테스트 계정 (Buyer, Seller)
  const hashedPw = await bcrypt.hash("test!@#12", 10);
  
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@test.com" },
    update: {},
    create: {
      email: "buyer@test.com",
      password: hashedPw,
      name: "일반구매자",
      type: "BUYER",
      points: 50000,
      gradeId: "grade_green",
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@test.com" },
    update: {},
    create: {
      email: "seller@test.com",
      password: hashedPw,
      name: "나이키사장님",
      type: "SELLER",
      points: 0,
      gradeId: "grade_green",
    },
  });
  console.log("✅ 테스트 계정 세팅 완료 (buyer@test.com / seller@test.com, 비밀번호: test!@#12)");

  // 5. 스토어 및 상품 Mocking
  const store = await prisma.store.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      name: "Nike 스토어",
      address: "서울시 강남구",
      detailAddress: "테헤란로 123 2층",
      phoneNumber: "010-1234-5678",
      image: "https://placehold.co/200x200?text=Nike+Store",
      content: "나이키 공식 셀러입니다.",
      userId: seller.id,
    },
  });

  const products = [
    {
      id: "test-product-1",
      name: "나이키 에어 조던 1 하이",
      image: "https://placehold.co/600x400?text=Jordan+1",
      price: 159000,
      discountRate: 10,
      content: "나이키 전설의 조던!",
      categoryId: 4, // 신발
      stocks: [{ sizeId: 3, quantity: 100 }, { sizeId: 4, quantity: 50 }]
    },
    {
      id: "test-product-2",
      name: "오버핏 헤비 코튼 티셔츠",
      image: "https://placehold.co/600x400?text=Top+T-Shirt",
      price: 32000,
      discountRate: 0,
      content: "탄탄한 코튼 소재의 베이직 티셔츠",
      categoryId: 2, // 상의
      stocks: [{ sizeId: 1, quantity: 30 }, { sizeId: 2, quantity: 50 }, { sizeId: 3, quantity: 40 }]
    },
    {
      id: "test-product-3",
      name: "와이드 실루엣 데님 팬츠",
      image: "https://placehold.co/600x400?text=Denim+Pants",
      price: 58000,
      discountRate: 15,
      content: "트렌디한 와이드 핏의 데님",
      categoryId: 3, // 바지
      stocks: [{ sizeId: 1, quantity: 20 }, { sizeId: 2, quantity: 30 }]
    },
    {
      id: "test-product-4",
      name: "미니멀 캐시미어 코트",
      image: "https://placehold.co/600x400?text=Outer+Coat",
      price: 289000,
      discountRate: 5,
      content: "고급스러운 캐시미어 혼방 코트",
      categoryId: 1, // 아우터
      stocks: [{ sizeId: 2, quantity: 10 }, { sizeId: 3, quantity: 15 }]
    },
    {
      id: "test-product-5",
      name: "레더 메신저 백",
      image: "https://placehold.co/600x400?text=Messenger+Bag",
      price: 89000,
      discountRate: 0,
      content: "데일리로 활용하기 좋은 가죽 백",
      categoryId: 5, // 가방 (ACC 통합)
      stocks: [{ sizeId: 5, quantity: 100 }] // FREE
    },
    {
      id: "test-product-6",
      name: "나이키 헤리티지 86 볼캡",
      image: "https://placehold.co/600x400?text=Nike+Cap",
      price: 29000,
      discountRate: 0,
      content: "클래식한 디자인의 나이키 볼캡",
      categoryId: 6, // 모자
      stocks: [{ sizeId: 5, quantity: 200 }] // FREE
    }
  ];

  for (const p of products) {
    const { stocks, ...productData } = p;
    await prisma.product.upsert({
      where: { id: p.id },
      update: productData,
      create: {
        ...productData,
        storeId: store.id,
        productStocks: {
          create: stocks
        }
      },
    });
  }

  console.log("✅ 카테고리별 다양한 상품(재고 포함) 목업 세팅 완료");

  console.log("✅ 나이키 스토어 및 조던 상품(재고 포함) 목업 세팅 완료");
  console.log("🎉 Seeding이 성공적으로 끝났습니다!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
