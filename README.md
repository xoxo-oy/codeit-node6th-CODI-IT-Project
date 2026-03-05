### CODI-IT 프로젝트

[문서화 노션 링크](https://www.notion.so/31333bcd14368142808dcc923dc1885a?source=copy_link)

### 팀원 구성

- 오윤 ([개인 Github 링크](https://github.com/xoxo-oy))

### 프로젝트 소개

- 패션 이커머스 플랫폼 백엔드 시스템 구축
- 프로젝트 기간: 2026.02.26 ~ 2024.04.02
- 기술 스택
  - Backend: Express.js, PrismaORM
  - Database: PostgreSQL
  - 공통 Tool: Git & Github, Notion

### 구현 기능 상세

- 오윤

추후 작성 예정

### 파일 구조 (도메인형 레이어드 아키텍처)

```text
src/
├── app.ts                  # Express 앱 설정 (Body-parser, 미들웨어 등록 등)
├── server.ts               # 서버 실행 엔트리 포인트 (포트 열기)
│
├── lib/                    # 프로젝트 전역 사용 라이브러리/공용 설정
│   ├── constants/          # 환경변수(.env) 및 전역 에러 코드 등 관리
│   └── prisma/             # Prisma Client 인스턴스 초기화 설정
│
├── middlewares/            # 공용 미들웨어 격리 구역
│
└── models/                 # 기능(도메인)별 모듈 폴더
    ├── user/               # [유저 및 스토어 찜하기 도메인]
    ├── product/            # [상품, 사이즈, 카테고리 도메인]
    ├── store/              # [스토어 도메인]
    ├── cart/               # [장바구니 도메인]
    ├── order/              # [주문 및 결제 도메인]
    ├── review/             # [리뷰 도메인]
    ├── inquiry/            # [문의 및 답변 도메인]
    └── alarm/              # [알림 및 SSE 도메인]
```

### 구현 홈페이지

(개발한 홈페이지에 대한 링크 게시)

https://example.com

### 프로젝트 회고록

(제작한 발표자료 링크 혹은 첨부파일 첨부)
