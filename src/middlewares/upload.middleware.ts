import multer from "multer";
import multerS3 from "multer-s3";
import { s3Client, bucketName } from "../config/s3.config";
import path from "path";

// S3를 이용한 파일 저장 설정
const storage = multerS3({
  s3: s3Client,
  bucket: bucketName,
  acl: "public-read", // 이미지는 대중에게 공개되어야 함 (필요시 수정)
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    // 파일명 중복 방지를 위한 랜덤 키 + 원본 파일명 확장자 유지
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `uploads/${Date.now()}_${basename}${extension}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});
