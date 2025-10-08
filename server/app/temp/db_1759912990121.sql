-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: taskmanager
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `baocao`
--

DROP TABLE IF EXISTS `baocao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baocao` (
  `autoId` int NOT NULL AUTO_INCREMENT,
  `id` varchar(8) NOT NULL,
  `moTa` varchar(45) DEFAULT NULL,
  `tienDoCaNhan` int DEFAULT NULL,
  `trangThai` varchar(45) DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `idNguoiGui` varchar(8) DEFAULT NULL,
  `idPhanCong` varchar(8) DEFAULT NULL,
  `idDinhKem` varchar(8) DEFAULT NULL,
  `ngayCapNhat` datetime DEFAULT NULL,
  PRIMARY KEY (`autoId`),
  KEY `idNguoiGui` (`idNguoiGui`),
  KEY `idDinhKem` (`idDinhKem`),
  KEY `idPhanCong` (`idPhanCong`),
  CONSTRAINT `baocao_ibfk_1` FOREIGN KEY (`idNguoiGui`) REFERENCES `taikhoan` (`id`),
  CONSTRAINT `baocao_ibfk_2` FOREIGN KEY (`idDinhKem`) REFERENCES `file` (`id`),
  CONSTRAINT `baocao_ibfk_3` FOREIGN KEY (`idPhanCong`) REFERENCES `phancong` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baocao`
--

LOCK TABLES `baocao` WRITE;
/*!40000 ALTER TABLE `baocao` DISABLE KEYS */;
INSERT INTO `baocao` VALUES (1,'BC000001','Test',25,'Đang thực hiện',NULL,'AC000001','PC000002',NULL,NULL),(2,'BC000002','Test 2',30,'Đang thực hiện',NULL,'AC000001','PC000002',NULL,NULL),(3,'BC000003','Test 3',30,'Đang thực hiện',NULL,'AC000001','PC000002',NULL,NULL),(4,'BC000004','Test 3',35,'Đang thực hiện',NULL,'AC000001','PC000002',NULL,NULL),(5,'BC000005','Test 4',40,'Đang thực hiện',NULL,'AC000001','PC000002','FI000025',NULL),(6,'BC000006','Test',40,'Đang thực hiện',NULL,'AC000001','PC000002','FI000026',NULL),(7,'BC000007','Test',20,'Đang thực hiện',NULL,'AC000001','PC000007',NULL,NULL),(8,'BC000008','Test 2',25,'Đang thực hiện',NULL,'AC000001','PC000007','FI000028',NULL),(9,'BC000009','Test 2',30,'Đang thực hiện',NULL,'AC000001','PC000007','FI000029',NULL),(10,'BC000010','Test 2',35,'Đang thực hiện',NULL,'AC000001','PC000007','FI000030',NULL);
/*!40000 ALTER TABLE `baocao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `congviec`
--

DROP TABLE IF EXISTS `congviec`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congviec` (
  `id` varchar(8) NOT NULL,
  `tenCV` varchar(100) NOT NULL,
  `moTa` text,
  `ngayBD` date DEFAULT NULL,
  `ngayKT` date DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `idNguoiTao` varchar(8) DEFAULT NULL,
  `idNhomCV` varchar(8) DEFAULT NULL,
  `idDuAn` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idNguoiTao` (`idNguoiTao`),
  KEY `idNhomCV` (`idNhomCV`),
  KEY `idDuAn` (`idDuAn`),
  CONSTRAINT `congviec_ibfk_1` FOREIGN KEY (`idNguoiTao`) REFERENCES `taikhoan` (`id`),
  CONSTRAINT `congviec_ibfk_2` FOREIGN KEY (`idNhomCV`) REFERENCES `nhomcongviec` (`id`),
  CONSTRAINT `congviec_ibfk_3` FOREIGN KEY (`idDuAn`) REFERENCES `duan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `congviec`
--

LOCK TABLES `congviec` WRITE;
/*!40000 ALTER TABLE `congviec` DISABLE KEYS */;
INSERT INTO `congviec` VALUES ('CV000001','Thiết kế đặc tả','Thiết kế đặc tả hệ thống, vẽ các sơ đồ UML','2025-06-01','2026-06-06',NULL,'AC000001',NULL,'DA000001'),('CV000002','Thiết kế giao diện','Thiết kế UI cho trang dashboard','2024-06-01','2025-06-10',NULL,'AC000002',NULL,'DA000001'),('CV000003','Thiết kế backend','Thiết kế CRUD và xử lý server','2024-06-01','2025-06-10',NULL,'AC000001',NULL,'DA000001'),('CV000004','Tích hợp hệ thống','Thiết kế UI cho trang dashboard','2024-06-01','2024-06-10',NULL,'AC000002',NULL,'DA000001'),('CV000005','Thiết kế giao diện','Thiết kế UI cho trang dashboard','2024-06-01','2024-06-10','2025-06-04 21:32:48','AC000002',NULL,'DA000001'),('CV000006','Thiết kế giao diện','Thiết kế UI cho trang dashboard','2024-06-01','2024-06-10','2025-06-04 21:33:47','AC000002',NULL,'DA000001'),('CV000007','Thiết kế giao diện','Thiết kế UI cho trang dashboard','2024-06-01','2024-06-10','2025-06-04 21:38:24','AC000002',NULL,'DA000001'),('CV000008','Thiết kế giao diện','Thiết kế UI cho trang dashboard','2024-06-01','2024-06-10','2025-06-04 21:52:00','AC000002',NULL,'DA000001'),('CV000009','Test Hệ Thống','','2025-06-04','2025-06-04',NULL,'AC000001',NULL,'DA000001'),('CV000010','Deploy','','2025-06-04','2025-06-04','2025-06-04 21:54:43','AC000001',NULL,'DA000001'),('CV000011','Thiết kế đặc tả','','2025-06-01','2025-06-21','2025-06-05 10:37:05','AC000001',NULL,'DA000001'),('CV000012','Test Hệ Thống','','2025-06-01','2025-06-06','2025-06-05 10:40:19','AC000001',NULL,'DA000001'),('CV000013','Hoàn Chỉnh','','2025-06-06','2025-06-08',NULL,'AC000001',NULL,'DA000001'),('CV000014','Deploy','','2025-06-10','2025-06-10',NULL,'AC000001',NULL,'DA000001');
/*!40000 ALTER TABLE `congviec` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `duan`
--

DROP TABLE IF EXISTS `duan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `duan` (
  `id` varchar(8) NOT NULL,
  `tenDA` varchar(100) NOT NULL,
  `ngayBD` date DEFAULT NULL,
  `ngayKT` date DEFAULT NULL,
  `trangThai` enum('Chưa bắt đầu','Đang tiến hành','Đã hoàn thành') DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `idNguoiTao` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idNguoiTao` (`idNguoiTao`),
  CONSTRAINT `duan_ibfk_1` FOREIGN KEY (`idNguoiTao`) REFERENCES `taikhoan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `duan`
--

LOCK TABLES `duan` WRITE;
/*!40000 ALTER TABLE `duan` DISABLE KEYS */;
INSERT INTO `duan` VALUES ('DA000001','Dự Án Xây Dựng Hệ Thống','2025-05-01','2025-06-01','Đang tiến hành',NULL,'AC000001'),('DA000002','Dự Án Test','2025-06-01','2025-06-30','Đang tiến hành',NULL,'AC000001'),('DA000003','aaa','2025-06-05','2025-06-25','Chưa bắt đầu',NULL,'AC000001');
/*!40000 ALTER TABLE `duan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file`
--

DROP TABLE IF EXISTS `file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file` (
  `id` varchar(8) NOT NULL,
  `tenFile` varchar(200) DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `idNguoiTao` varchar(8) DEFAULT NULL,
  `idCongViec` varchar(8) DEFAULT NULL,
  `idPhanCong` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idNguoiTao` (`idNguoiTao`),
  KEY `idCongViec` (`idCongViec`),
  KEY `fk_File_idPhanCong` (`idPhanCong`),
  CONSTRAINT `file_ibfk_1` FOREIGN KEY (`idNguoiTao`) REFERENCES `taikhoan` (`id`),
  CONSTRAINT `file_ibfk_2` FOREIGN KEY (`idCongViec`) REFERENCES `congviec` (`id`),
  CONSTRAINT `fk_File_idPhanCong` FOREIGN KEY (`idPhanCong`) REFERENCES `phancong` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file`
--

LOCK TABLES `file` WRITE;
/*!40000 ALTER TABLE `file` DISABLE KEYS */;
INSERT INTO `file` VALUES ('FI000001','default.jpg',NULL,NULL,NULL,NULL),('FI000002','default.jpg',NULL,NULL,NULL,NULL),('FI000003','default.jpg',NULL,'AC000001','CV000001',NULL),('FI000004','default.jpg',NULL,'AC000001','CV000001',NULL),('FI000005','default.jpg',NULL,'AC000001','CV000001',NULL),('FI000006','M-TT-01-Phieugiaoviec.doc',NULL,'AC000001','CV000001',NULL),('FI000007','M-TT-01-Phieugiaoviec.doc',NULL,'AC000001','CV000001',NULL),('FI000008','M-TT-01-Phieugiaoviec.doc',NULL,'AC000001','CV000001',NULL),('FI000009','M-TT-01-Phieugiaoviec.doc',NULL,'AC000001','CV000001',NULL),('FI000010','ubnd phường (file mẫu) năm 2025 (1).xlsx',NULL,'AC000001','CV000001',NULL),('FI000011','db.sql',NULL,'AC000001','CV000001',NULL),('FI000012','db.sql',NULL,'AC000001',NULL,NULL),('FI000013','images (1).jpg',NULL,'AC000001',NULL,NULL),('FI000014','images (1).jpg',NULL,'AC000001','CV000001',NULL),('FI000015','Diagram 2025-05-23 14-08-40.png',NULL,'AC000001',NULL,NULL),('FI000016','Diagram 2025-05-23 14-08-40.png',NULL,'AC000001',NULL,NULL),('FI000017','db.sql',NULL,'AC000001',NULL,NULL),('FI000018','db.sql',NULL,'AC000001',NULL,NULL),('FI000019','db.sql',NULL,'AC000001',NULL,NULL),('FI000020','db.sql',NULL,'AC000001',NULL,NULL),('FI000021','default-avatar.png',NULL,'AC000001',NULL,NULL),('FI000022','db.sql',NULL,'AC000001',NULL,NULL),('FI000023','db.sql',NULL,'AC000001','CV000001',NULL),('FI000024','Untitled.sql',NULL,'AC000001','CV000001',NULL),('FI000025','Mo_ta_day_du_CSDL.docx',NULL,'AC000001','CV000001',NULL),('FI000026','minh hiển.pdf',NULL,'AC000001','CV000001',NULL),('FI000027','Diagram 2025-05-23 14-08-37.uxf',NULL,'AC000001','CV000001',NULL),('FI000028','default-avatar.png',NULL,'AC000001','CV000001',NULL),('FI000029','default-avatar.png',NULL,'AC000001','CV000001',NULL),('FI000030','default-avatar.png',NULL,'AC000001','CV000001',NULL),('FI000031','default-avatar.png',NULL,'AC000001','CV000001',NULL),('FI000032','db_1749359831147.sql',NULL,'AC000002','CV000001',NULL);
/*!40000 ALTER TABLE `file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichnghi`
--

DROP TABLE IF EXISTS `lichnghi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichnghi` (
  `id` varchar(8) NOT NULL,
  `tieuDe` text,
  `ngayBD` datetime DEFAULT NULL,
  `ngayKT` datetime DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `idNgayBu` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idNgayBu` (`idNgayBu`),
  CONSTRAINT `lichnghi_ibfk_1` FOREIGN KEY (`idNgayBu`) REFERENCES `ngaybu` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichnghi`
--

LOCK TABLES `lichnghi` WRITE;
/*!40000 ALTER TABLE `lichnghi` DISABLE KEYS */;
INSERT INTO `lichnghi` VALUES ('LN000001','30/4 - 1/5','2025-04-30 00:00:00','2025-05-02 00:00:00',NULL,'NB000001');
/*!40000 ALTER TABLE `lichnghi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichsuchuyengiao`
--

DROP TABLE IF EXISTS `lichsuchuyengiao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichsuchuyengiao` (
  `id` varchar(8) NOT NULL,
  `moTa` text,
  `idTruoc` varchar(8) DEFAULT NULL,
  `idSau` varchar(8) DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `trangThai` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idTruoc` (`idTruoc`),
  KEY `idSau` (`idSau`),
  CONSTRAINT `lichsuchuyengiao_ibfk_1` FOREIGN KEY (`idTruoc`) REFERENCES `phancong` (`id`),
  CONSTRAINT `lichsuchuyengiao_ibfk_2` FOREIGN KEY (`idSau`) REFERENCES `phancong` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichsuchuyengiao`
--

LOCK TABLES `lichsuchuyengiao` WRITE;
/*!40000 ALTER TABLE `lichsuchuyengiao` DISABLE KEYS */;
INSERT INTO `lichsuchuyengiao` VALUES ('CG000001','Chuyển giao do thay đổi nhân sự','PC000001','PC000004',NULL,'Đã nhận');
/*!40000 ALTER TABLE `lichsuchuyengiao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ngaybu`
--

DROP TABLE IF EXISTS `ngaybu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ngaybu` (
  `id` varchar(8) NOT NULL,
  `ngayBD` datetime DEFAULT NULL,
  `ngayKT` datetime DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ngaybu`
--

LOCK TABLES `ngaybu` WRITE;
/*!40000 ALTER TABLE `ngaybu` DISABLE KEYS */;
INSERT INTO `ngaybu` VALUES ('NB000001','2025-05-09 00:00:00','2025-05-09 00:00:00',NULL);
/*!40000 ALTER TABLE `ngaybu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhomcongviec`
--

DROP TABLE IF EXISTS `nhomcongviec`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhomcongviec` (
  `id` varchar(8) NOT NULL,
  `tenNhom` varchar(100) NOT NULL,
  `deactive` datetime DEFAULT NULL,
  `idDuAn` varchar(8) DEFAULT NULL,
  `idNguoiTao` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idDuAn` (`idDuAn`),
  KEY `idNguoiTao` (`idNguoiTao`),
  CONSTRAINT `nhomcongviec_ibfk_1` FOREIGN KEY (`idDuAn`) REFERENCES `duan` (`id`),
  CONSTRAINT `nhomcongviec_ibfk_2` FOREIGN KEY (`idNguoiTao`) REFERENCES `taikhoan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhomcongviec`
--

LOCK TABLES `nhomcongviec` WRITE;
/*!40000 ALTER TABLE `nhomcongviec` DISABLE KEYS */;
/*!40000 ALTER TABLE `nhomcongviec` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phancong`
--

DROP TABLE IF EXISTS `phancong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phancong` (
  `id` varchar(8) NOT NULL,
  `moTa` varchar(45) DEFAULT NULL,
  `ngayNhan` datetime DEFAULT NULL,
  `ngayHoanTat` datetime DEFAULT NULL,
  `doQuanTrong` int DEFAULT NULL,
  `tienDoCaNhan` int DEFAULT NULL,
  `trangThai` varchar(45) DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `idNguoiNhan` varchar(8) DEFAULT NULL,
  `idCongViec` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idNguoiNhan` (`idNguoiNhan`),
  KEY `idCongViec` (`idCongViec`),
  CONSTRAINT `phancong_ibfk_1` FOREIGN KEY (`idNguoiNhan`) REFERENCES `taikhoan` (`id`),
  CONSTRAINT `phancong_ibfk_2` FOREIGN KEY (`idCongViec`) REFERENCES `congviec` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phancong`
--

LOCK TABLES `phancong` WRITE;
/*!40000 ALTER TABLE `phancong` DISABLE KEYS */;
INSERT INTO `phancong` VALUES ('PC000001','Khảo sát yêu cầu','2024-06-01 00:00:00','2025-05-29 00:00:00',1,0,'Đã chuyển giao',NULL,'AC000001','CV000001'),('PC000002','Phân công','2024-06-01 00:00:00',NULL,1,40,'Đang thực hiện',NULL,'AC000001','CV000001'),('PC000003','Phân công thiết kế giao diện','2024-06-01 00:00:00',NULL,1,100,'Đã hoàn thành',NULL,'AC000002','CV000002'),('PC000004','Khảo sát yêu cầu','2024-06-01 00:00:00',NULL,1,0,'Chưa bắt đầu',NULL,'AC000002','CV000001'),('PC000005','Test',NULL,NULL,NULL,0,'Đã từ chối',NULL,'AC000003','CV000001'),('PC000006','Test 2','2025-06-06 00:00:00',NULL,NULL,0,'Đang thực hiện',NULL,'AC000001','CV000001'),('PC000007','Test','2025-06-10 00:00:00',NULL,2,35,'Đang thực hiện',NULL,'AC000001','CV000001'),('PC000008','111',NULL,NULL,1,0,'Chưa bắt đầu',NULL,'AC000003','CV000001'),('PC000009','222',NULL,NULL,1,0,'Chưa bắt đầu',NULL,'AC000003','CV000001');
/*!40000 ALTER TABLE `phancong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phienban`
--

DROP TABLE IF EXISTS `phienban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phienban` (
  `id` varchar(8) NOT NULL,
  `soPB` int DEFAULT NULL,
  `duongDan` text,
  `ngayUpload` datetime DEFAULT CURRENT_TIMESTAMP,
  `deactive` datetime DEFAULT NULL,
  `idFile` varchar(8) DEFAULT NULL,
  `trangThai` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idFile` (`idFile`),
  CONSTRAINT `phienban_ibfk_1` FOREIGN KEY (`idFile`) REFERENCES `file` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phienban`
--

LOCK TABLES `phienban` WRITE;
/*!40000 ALTER TABLE `phienban` DISABLE KEYS */;
INSERT INTO `phienban` VALUES ('PB000001',1,'uploads\\default.jpg','2025-05-27 10:34:42',NULL,'FI000001','Chờ duyệt'),('PB000002',1,'uploads\\default_1748529960724.jpg','2025-05-29 21:46:01',NULL,'FI000002','Chờ duyệt'),('PB000003',1,'uploads\\default_1748567663145.jpg','2025-05-30 08:14:23',NULL,'FI000003','Chờ duyệt'),('PB000004',1,'uploads\\default_1748567667028.jpg','2025-05-30 08:14:27',NULL,'FI000004','Chờ duyệt'),('PB000005',1,'uploads\\default_1748567669841.jpg','2025-05-30 08:14:30',NULL,'FI000005','Chờ duyệt'),('PB000006',1,'uploads\\M-TT-01-Phieugiaoviec_1748576859222.doc','2025-05-30 10:47:39',NULL,'FI000006','Chờ duyệt'),('PB000007',1,'uploads\\M-TT-01-Phieugiaoviec_1748577425606.doc','2025-05-30 10:57:06',NULL,'FI000007','Chờ duyệt'),('PB000008',1,'uploads\\M-TT-01-Phieugiaoviec_1748577427221.doc','2025-05-30 10:57:07',NULL,'FI000008','Chờ duyệt'),('PB000009',1,'uploads\\M-TT-01-Phieugiaoviec_1748577428344.doc','2025-05-30 10:57:08',NULL,'FI000009','Chờ duyệt'),('PB000010',1,'uploads\\ubnd phường (file mẫu) năm 2025 (1)_1748577591409.xlsx','2025-05-30 10:59:51',NULL,'FI000010','Chờ duyệt'),('PB000011',1,'uploads\\db_1748577694809.sql','2025-05-30 11:01:35',NULL,'FI000011','Chờ duyệt'),('PB000012',1,'uploads\\db_1749180209501.sql','2025-06-06 10:23:29',NULL,'FI000012','Chờ duyệt'),('PB000013',1,'uploads\\images (1)_1749180234070.jpg','2025-06-06 10:23:54',NULL,'FI000013','Chờ duyệt'),('PB000014',1,'uploads\\images (1)_1749180287257.jpg','2025-06-06 10:24:47',NULL,'FI000014','Chờ duyệt'),('PB000015',1,'uploads\\Diagram 2025-05-23 14-08-40_1749182259682.png','2025-06-06 10:57:40',NULL,'FI000015','Chờ duyệt'),('PB000016',1,'uploads\\Diagram 2025-05-23 14-08-40_1749182431709.png','2025-06-06 11:00:32',NULL,'FI000016','Chờ duyệt'),('PB000017',1,'uploads\\db_1749358832936.sql','2025-06-08 12:00:33',NULL,'FI000017','Chờ duyệt'),('PB000018',1,'uploads\\db_1749359024426.sql','2025-06-08 12:03:44',NULL,'FI000018','Chờ duyệt'),('PB000019',1,'uploads\\db_1749359115020.sql','2025-06-08 12:05:15',NULL,'FI000019','Chờ duyệt'),('PB000020',1,'uploads\\db_1749359272072.sql','2025-06-08 12:07:52',NULL,'FI000020','Chờ duyệt'),('PB000021',1,'uploads\\default-avatar_1749359283066.png','2025-06-08 12:08:03',NULL,'FI000021','Chờ duyệt'),('PB000022',1,'uploads\\db_1749359458932.sql','2025-06-08 12:10:59',NULL,'FI000022','Chờ duyệt'),('PB000023',1,'uploads\\db_1749359831147.sql','2025-06-08 12:17:11',NULL,'FI000023','Chờ duyệt'),('PB000024',1,'uploads\\Untitled_1749360156877.sql','2025-06-08 12:22:37',NULL,'FI000024','Chờ duyệt'),('PB000025',1,'uploads\\Mo_ta_day_du_CSDL_1749360753529.docx','2025-06-08 12:32:34',NULL,'FI000025','Chờ duyệt'),('PB000026',1,'uploads\\minh hiển_1749477295577.pdf','2025-06-09 20:54:56',NULL,'FI000026','Chờ duyệt'),('PB000027',1,'uploads\\Diagram 2025-05-23 14-08-37_1749477875280.uxf','2025-06-09 21:04:35',NULL,'FI000027','Chờ duyệt'),('PB000028',1,'uploads\\default-avatar_1749558591340.png','2025-06-10 19:29:51',NULL,'FI000028','Chờ duyệt'),('PB000029',1,'uploads\\default-avatar_1749558618944.png','2025-06-10 19:30:19',NULL,'FI000029','Chờ duyệt'),('PB000030',1,'uploads\\default-avatar_1749558687187.png','2025-06-10 19:31:27',NULL,'FI000030','Chờ duyệt'),('PB000031',1,'uploads\\default-avatar_1749611023643.png','2025-06-11 10:03:44',NULL,'FI000031','Chờ duyệt'),('PB000032',2,'uploads\\default-avatar_1749611598855.png','2025-06-11 10:13:19',NULL,'FI000030','Chờ duyệt'),('PB000033',2,'uploads\\363348756_250495777843712_8597872713684564055_n_1749612183424.jpg','2025-06-11 10:23:03',NULL,'FI000031','Đã duyệt'),('PB000034',1,'uploads\\db_1749359831147_1749646994051.sql','2025-06-11 20:03:14',NULL,'FI000032','Chờ duyệt');
/*!40000 ALTER TABLE `phienban` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phongban`
--

DROP TABLE IF EXISTS `phongban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phongban` (
  `id` varchar(8) NOT NULL,
  `tenPhong` varchar(100) NOT NULL,
  `phanQuyen` enum('Cao','Trung','Thấp') NOT NULL,
  `deactive` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phongban`
--

LOCK TABLES `phongban` WRITE;
/*!40000 ALTER TABLE `phongban` DISABLE KEYS */;
INSERT INTO `phongban` VALUES ('PH000001','CNTT','Thấp',NULL),('PH000002','Giám Đốc','Cao',NULL),('PH000003','Hạ Tầng','Thấp','2025-06-05 19:51:51'),('PH000004','CNTT 2','Trung','2025-06-05 19:45:22'),('PH000005','CNTT 2','Trung',NULL);
/*!40000 ALTER TABLE `phongban` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taikhoan`
--

DROP TABLE IF EXISTS `taikhoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taikhoan` (
  `id` varchar(8) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `vaiTro` varchar(45) NOT NULL,
  `tenNV` varchar(100) NOT NULL,
  `gioiTinh` enum('Nam','Nữ') NOT NULL,
  `SDT` varchar(15) DEFAULT NULL,
  `diaChi` varchar(200) DEFAULT NULL,
  `deactive` datetime DEFAULT NULL,
  `idPhong` varchar(8) DEFAULT NULL,
  `avatar` varchar(8) DEFAULT NULL,
  `admin` tinyint DEFAULT NULL,
  `updateAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idPhong` (`idPhong`),
  KEY `fk_TaiKhoan_avatar` (`avatar`),
  CONSTRAINT `fk_TaiKhoan_avatar` FOREIGN KEY (`avatar`) REFERENCES `file` (`id`),
  CONSTRAINT `taikhoan_ibfk_1` FOREIGN KEY (`idPhong`) REFERENCES `phongban` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taikhoan`
--

LOCK TABLES `taikhoan` WRITE;
/*!40000 ALTER TABLE `taikhoan` DISABLE KEYS */;
INSERT INTO `taikhoan` VALUES ('AC000001','test@example.com','$2b$10$qnpRoQShQQcba4SVxXBV3Oesp7.n.gUkvKkZRPCY9Yr8zpGTunYIu','Giám Đốc','Nguyen Van A','Nam','0123456789','123 Nguyen Trai, Ha Noi',NULL,'PH000001','FI000002',1,'2025-06-12 19:42:50'),('AC000002','test2@example.com','$2b$10$/tZU.I/7JmiRc/YyWXGvQeWOv8zAjLPpo9FxenRljKADYHG/1v5Xu','Nhân Viên','Nguyen Van B','Nam','0123456789','123 Nguyen Trai, Ha Noi',NULL,'PH000002','FI000001',0,'2025-06-05 19:54:44'),('AC000003','test11@gmail.com','$2b$10$NwydC2VWnplRtSUz2kH0I.F3bQtkG/GwQnj1pKyb6.IJ9o7QBdUY2','Nhân Viên','Nguyễn Test','Nữ','0123456789','',NULL,'PH000001','FI000001',NULL,'2025-06-05 15:47:58'),('AC000004','test12@gmail.com','$2b$10$Ghrcrzmi4cAN2LhxFPS7BuljDJY/2Dd3ZvFkKAtXcgqH4clZVQO9m','Trưởng Phòng','Nguyen Van Anh','Nam','','','2025-06-05 20:06:30','PH000005','FI000001',NULL,'2025-06-05 19:54:22'),('AC000005','test3@gmail.com','$2b$10$0JbPMx/vpY0eCX9/q4xGqOI53jJwezEH4qwxaSn2eHNwW5F9Ra8ha','Nhân Viên','Nguyen Van Anh','Nam','0123456789','',NULL,'PH000001','FI000001',NULL,'2025-06-05 20:04:41');
/*!40000 ALTER TABLE `taikhoan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thongbao`
--

DROP TABLE IF EXISTS `thongbao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thongbao` (
  `id` varchar(8) NOT NULL,
  `tieuDe` varchar(100) DEFAULT NULL,
  `noiDung` text,
  `ngayDang` datetime DEFAULT CURRENT_TIMESTAMP,
  `deactive` datetime DEFAULT NULL,
  `idNguoiDang` varchar(8) DEFAULT NULL,
  `idPhanCong` varchar(8) DEFAULT NULL,
  `idCongViec` varchar(8) DEFAULT NULL,
  `idNhomCV` varchar(8) DEFAULT NULL,
  `idDuAn` varchar(8) DEFAULT NULL,
  `idPhanHoi` varchar(8) DEFAULT NULL,
  `idPhienBan` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idNguoiDang` (`idNguoiDang`),
  KEY `idPhanCong` (`idPhanCong`),
  KEY `idCongViec` (`idCongViec`),
  KEY `idNhomCV` (`idNhomCV`),
  KEY `idDuAn` (`idDuAn`),
  KEY `idPhanHoi` (`idPhanHoi`),
  KEY `idPhienBan` (`idPhienBan`),
  CONSTRAINT `thongbao_ibfk_1` FOREIGN KEY (`idNguoiDang`) REFERENCES `taikhoan` (`id`),
  CONSTRAINT `thongbao_ibfk_2` FOREIGN KEY (`idPhanCong`) REFERENCES `phancong` (`id`),
  CONSTRAINT `thongbao_ibfk_3` FOREIGN KEY (`idCongViec`) REFERENCES `congviec` (`id`),
  CONSTRAINT `thongbao_ibfk_4` FOREIGN KEY (`idNhomCV`) REFERENCES `nhomcongviec` (`id`),
  CONSTRAINT `thongbao_ibfk_5` FOREIGN KEY (`idDuAn`) REFERENCES `duan` (`id`),
  CONSTRAINT `thongbao_ibfk_6` FOREIGN KEY (`idPhanHoi`) REFERENCES `thongbao` (`id`),
  CONSTRAINT `thongbao_ibfk_7` FOREIGN KEY (`idPhienBan`) REFERENCES `phienban` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thongbao`
--

LOCK TABLES `thongbao` WRITE;
/*!40000 ALTER TABLE `thongbao` DISABLE KEYS */;
INSERT INTO `thongbao` VALUES ('TB000001','Đánh giá file','test','2025-06-11 16:08:17',NULL,'AC000001',NULL,NULL,NULL,NULL,NULL,'PB000032'),('TB000002','Đánh giá file','test','2025-06-11 16:32:15',NULL,'AC000001',NULL,NULL,NULL,NULL,NULL,'PB000029');
/*!40000 ALTER TABLE `thongbao` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-12 20:37:14
