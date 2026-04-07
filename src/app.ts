import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware";
import authRouter from "./models/auth/auth.router";
import userRouter from "./models/user/user.router";
import storeRouter from "./models/store/store.router";
import productRouter from "./models/product/product.router";
import inquiryRouter from "./models/inquiry/inquiry.router";
import reviewRouter from "./models/review/review.router";
import cartRouter from "./models/cart/cart.router";
import orderRouter from "./models/order/order.router";
import notificationRouter from "./models/notification/notification.router";
import dashboardRouter from "./models/dashboard/dashboard.router";

const app = express();

// 1. 기본 미들웨어 세팅
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
})); // 프론트엔드와 백엔드의 도메인이 달라도 통신 허용
app.use(express.json()); // JSON 바디 파싱 허용
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 바디 파싱 허용

// 2. 헬스 체크용 라우터 (서버가 살았는지 테스트)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Codi-IT 벡엔드 서버 정상 구동 중!" });
});

// 모든 도메인 API 라우팅
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/stores", storeRouter);
app.use("/api/products", productRouter);
app.use("/api/inquiries", inquiryRouter);
app.use("/api", reviewRouter); // /api/product/... 와 /api/review/... 동시 처리를 위해 /api로 마운트
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/dashboard", dashboardRouter);

// 3. 전역 에러 핸들러 (반드시 모든 라우터의 가장 아래에 위치해야 함!)
app.use(errorHandler);

export default app;
