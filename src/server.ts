import app from "./app";

// 포트 번호: .env에 없으면 8000번 기본 사용
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 [Server] Codi-IT 서버가 http://localhost:${PORT} 포트에서 성공적으로 시작되었습니다!`);
});
