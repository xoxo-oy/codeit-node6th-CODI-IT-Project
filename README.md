### 🚀 CODI-IT (Backend)
**패션 이커머스 플랫폼 백엔드 시스템**

[문서화 노션 링크](https://www.notion.so/31333bcd14368142808dcc923dc1885a?source=copy_link)

---

### 👨‍💻 팀원 구성
- **오윤** ([개인 Github](https://github.com/xoxo-oy))

---

### 📝 프로젝트 소개
CODI-IT은 사용자에게 최적화된 패션 쇼핑 경험을 제공하기 위한 고성능 백엔드 API 서버입니다. 도메인 주도 설계(DDD)의 장점을 결합한 레이어드 아키텍처를 채택하여 유지보수성과 확장성을 확보했습니다.

- **프로젝트 기간**: 2026.02.26 ~ 2026.04.02
- **주요 기술 스택**:
  - **Runtime**: Node.js (TypeScript)
  - **Framework**: Express.js
  - **Database**: PostgreSQL
  - **ORM**: Prisma
  - **Infrastructure**: AWS RDS, AWS S3
  - **Authentication**: JWT (Json Web Token)
  - **Real-time**: SSE (Server-Sent Events)

---

### ✨ 구현 기능 상세

#### 1. 인증 및 유저 관리 (Auth & User)
- **보안 인증**: JWT 기반의 Access Token 발급 및 미들웨어를 통한 권한 검증.
- **회원가입/로그인**: 유효성 검사(Zod)를 포함한 회원 관리 로직.
- **프로필 관리**: 유저 프로필 수정 및 클라우드(S3) 기반 이미지 업로드 연동.
- **찜하기**: 관심 있는 스토어를 즐겨찾기에 등록하고 관리하는 기능.

#### 2. 상품 및 스토어 시스템 (Product & Store)
- **상품 관리**: 다중 필터링 검색(카테고리, 사이즈), 상품 등록/수정/삭제.
- **스토어 관리**: 셀러 권한 확인을 통한 스토어 생성 및 관리.
- **데이터 모델링**: 상품-사이즈-재고 간의 복잡한 연관 관계를 Prisma로 관리.

#### 3. 쇼핑 프로세스 (Cart & Order)
- **장바구니**: 실시간 수량 업데이트 및 유저별 담은 상품 관리.
- **주문 및 결제**: 가상 결제 프로세스 구현 및 트랜잭션을 통한 재고 차감 및 주문 내역 생성.
- **주문 이력**: 과거 주문 내역 및 상세 결제 정보 조회.

#### 4. 커뮤니케이션 및 알림 (Review, Inquiry & Alarm)
- **리뷰 시스템**: 상품별 구매 후기 작성 및 평점 관리.
- **문의(Inquiry)**: 1:1 상품 문의 및 셀러의 답변 처리 시스템.
- **실시간 알림**: SSE(Server-Sent Events)를 활용한 주문 상태 변경 알림 제공.

---

### 🏗 파일 구조 (도메인형 레이어드 아키텍처)
본 프로젝트는 관심사의 분리(SoC)를 극대화하기 위해 도메인 단위의 레이어드 아키텍처를 따릅니다.

```text
src/
├── app.ts                  # Express 앱 설정 및 미들웨어 등록
├── server.ts               # 서버 실행 및 포트 바인딩
│
├── lib/                    # 프로젝트 전역 유틸리티 및 공용 설정
│   ├── prisma.ts           # Prisma Client Singleton 인스턴스
│   └── response.ts         # 통일된 응답/에러 처리를 위한 유틸리티
│
├── middlewares/            # 인증, 업로드, 유효성 검사 등 공용 미들웨어
│
└── models/                 # 도메인 기반 모듈 레이어
    ├── user/               # [유저 도메인]
    ├── product/            # [상품 도메인]
    ├── store/              # [스토어 도메인]
    ├── cart/               # [장바구니 도메인]
    ├── order/              # [주문 도메인]
    ├── review/             # [리뷰 도메인]
    ├── inquiry/            # [문의 도메인]
    └── alarm/              # [알림 도메인]
```

**각 도메인 내부 구조:**
- `*.router.ts`: 엔드포인트 정의 및 미들웨어 연결
- `*.controller.ts`: 요청 파싱 및 응답 처리
- `*.service.ts`: 핵심 비즈니스 로직 및 트랜잭션 처리
- `*.repository.ts`: 데이터베이스 접근(Prisma) 로직 캡슐화

---

### 🚧 개발 환경 설정

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정 (`.env`)**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/db"
   JWT_SECRET="your_secret_key"
   AWS_S3_BUCKET_NAME="your_bucket"
   # ...기타 AWS 설정
   ```

3. **서버 실행**
   ```bash
   npm run dev
   ```
