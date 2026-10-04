-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: trungtamngoaingu
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `diem`
--

DROP TABLE IF EXISTS `diem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem` (
  `ma_diem` int NOT NULL AUTO_INCREMENT,
  `ma_xep_lop` int NOT NULL,
  `diem_tong_ket` decimal(4,2) DEFAULT NULL,
  PRIMARY KEY (`ma_diem`),
  UNIQUE KEY `uq_diem_xeplop` (`ma_xep_lop`),
  CONSTRAINT `fk_diem_xeplop` FOREIGN KEY (`ma_xep_lop`) REFERENCES `xep_lop` (`ma_xep_lop`),
  CONSTRAINT `check_diem_tong_ket` CHECK (((`diem_tong_ket` >= 0) and (`diem_tong_ket` <= 10)))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem`
--

LOCK TABLES `diem` WRITE;
/*!40000 ALTER TABLE `diem` DISABLE KEYS */;
INSERT INTO `diem` VALUES (3,3,8.50),(4,4,7.50);
/*!40000 ALTER TABLE `diem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diem_danh`
--

DROP TABLE IF EXISTS `diem_danh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem_danh` (
  `ma_diem_danh` int NOT NULL AUTO_INCREMENT,
  `ma_xep_lop` int NOT NULL,
  `ngay_hoc` date NOT NULL,
  `trang_thai` enum('Có mặt','Vắng mặt') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Có mặt',
  `ghi_chu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ma_diem_danh`),
  UNIQUE KEY `uq_diemdanh_xeplop_ngay` (`ma_xep_lop`,`ngay_hoc`),
  CONSTRAINT `fl_diemdanh_xeplop` FOREIGN KEY (`ma_xep_lop`) REFERENCES `xep_lop` (`ma_xep_lop`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem_danh`
--

LOCK TABLES `diem_danh` WRITE;
/*!40000 ALTER TABLE `diem_danh` DISABLE KEYS */;
INSERT INTO `diem_danh` VALUES (13,3,'2026-10-05','Có mặt',NULL),(14,4,'2026-10-05','Vắng mặt','Nghỉ có phép'),(15,3,'2026-10-07','Có mặt',NULL),(16,4,'2026-10-07','Có mặt',NULL),(17,3,'2026-10-09','Vắng mặt',NULL),(18,4,'2026-10-09','Có mặt',NULL);
/*!40000 ALTER TABLE `diem_danh` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giao_vien`
--

DROP TABLE IF EXISTS `giao_vien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giao_vien` (
  `ma_giao_vien` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int NOT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chuyen_mon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ma_giao_vien`),
  UNIQUE KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `fk_giaovien_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giao_vien`
--

LOCK TABLES `giao_vien` WRITE;
/*!40000 ALTER TABLE `giao_vien` DISABLE KEYS */;
INSERT INTO `giao_vien` VALUES (1,2,'Nguyễn Văn Minh','1990-05-15','Nam','minh.nguyen@gmail.com','0912345678','Tiếng Anh giao tiếp',1);
/*!40000 ALTER TABLE `giao_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hoc_vien`
--

DROP TABLE IF EXISTS `hoc_vien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hoc_vien` (
  `ma_hoc_vien` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `ho_ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ma_hoc_vien`),
  UNIQUE KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `fk_hocvien_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hoc_vien`
--

LOCK TABLES `hoc_vien` WRITE;
/*!40000 ALTER TABLE `hoc_vien` DISABLE KEYS */;
INSERT INTO `hoc_vien` VALUES (1,3,'Nguyễn Văn An','2005-03-12','Nam','an.nguyen@gmail.com','0987654321','Hà Nội',1),(2,4,'Trần Thu Hà','2005-08-20','Nữ','ha.tran@gmail.com','0976543210','Hà Nội',1);
/*!40000 ALTER TABLE `hoc_vien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khoa_hoc`
--

DROP TABLE IF EXISTS `khoa_hoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khoa_hoc` (
  `ma_khoa_hoc` int NOT NULL AUTO_INCREMENT,
  `ten_khoa_hoc` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `so_buoi` int DEFAULT NULL,
  `muc_tieu` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ma_khoa_hoc`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khoa_hoc`
--

LOCK TABLES `khoa_hoc` WRITE;
/*!40000 ALTER TABLE `khoa_hoc` DISABLE KEYS */;
INSERT INTO `khoa_hoc` VALUES (1,'Tiếng Anh giao tiếp A2','Khóa học tiếng Anh giao tiếp trình độ A2',36,'Nâng cao khả năng giao tiếp tiếng Anh cơ bản',1);
/*!40000 ALTER TABLE `khoa_hoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_hoc`
--

DROP TABLE IF EXISTS `lich_hoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_hoc` (
  `ma_lich` int NOT NULL AUTO_INCREMENT,
  `ma_lop` int NOT NULL,
  `thu` enum('Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật') COLLATE utf8mb4_unicode_ci NOT NULL,
  `gio_bat_dau` time NOT NULL,
  `gio_ket_thuc` time NOT NULL,
  `phong_hoc` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ma_lich`),
  UNIQUE KEY `uq_lichhoc_lop_thu_gio` (`ma_lop`,`thu`,`gio_bat_dau`),
  CONSTRAINT `fk_lichhoc_lophoc` FOREIGN KEY (`ma_lop`) REFERENCES `lop_hoc` (`ma_lop`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_hoc`
--

LOCK TABLES `lich_hoc` WRITE;
/*!40000 ALTER TABLE `lich_hoc` DISABLE KEYS */;
INSERT INTO `lich_hoc` VALUES (1,1,'Thứ 2','19:00:00','21:00:00','P301'),(2,1,'Thứ 4','19:00:00','21:00:00','P301'),(3,1,'Thứ 6','19:00:00','21:30:00','P301');
/*!40000 ALTER TABLE `lich_hoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lop_hoc`
--

DROP TABLE IF EXISTS `lop_hoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lop_hoc` (
  `ma_lop` int NOT NULL AUTO_INCREMENT,
  `ma_khoa_hoc` int NOT NULL,
  `ma_giao_vien` int DEFAULT NULL,
  `ten_lop` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `si_so_toi_da` int NOT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `trang_thai` enum('Sắp mở','Đang học','Đã kết thúc') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sắp mở',
  PRIMARY KEY (`ma_lop`),
  KEY `fk_lophoc_khoahoc` (`ma_khoa_hoc`),
  KEY `fk_lophoc_giaovien` (`ma_giao_vien`),
  CONSTRAINT `fk_lophoc_giaovien` FOREIGN KEY (`ma_giao_vien`) REFERENCES `giao_vien` (`ma_giao_vien`),
  CONSTRAINT `fk_lophoc_khoahoc` FOREIGN KEY (`ma_khoa_hoc`) REFERENCES `khoa_hoc` (`ma_khoa_hoc`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lop_hoc`
--

LOCK TABLES `lop_hoc` WRITE;
/*!40000 ALTER TABLE `lop_hoc` DISABLE KEYS */;
INSERT INTO `lop_hoc` VALUES (1,1,1,'A2-01',25,'2026-10-05','2027-01-05','Đang học');
/*!40000 ALTER TABLE `lop_hoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tai_khoan`
--

DROP TABLE IF EXISTS `tai_khoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tai_khoan` (
  `ma_tai_khoan` int NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vai_tro` enum('Quản trị viên','Giáo viên','Học viên') COLLATE utf8mb4_unicode_ci NOT NULL,
  `trang_thai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ma_tai_khoan`),
  UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tai_khoan`
--

LOCK TABLES `tai_khoan` WRITE;
/*!40000 ALTER TABLE `tai_khoan` DISABLE KEYS */;
INSERT INTO `tai_khoan` VALUES (1,'admin','88888888','Quản trị viên',1),(2,'gv001','88888888','Giáo viên',1),(3,'hv001','88888888','Học viên',1),(4,'hv002','88888888','Học viên',1);
/*!40000 ALTER TABLE `tai_khoan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tai_lieu`
--

DROP TABLE IF EXISTS `tai_lieu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tai_lieu` (
  `ma_tai_lieu` int NOT NULL AUTO_INCREMENT,
  `ma_lop` int NOT NULL,
  `ten_tai_lieu` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duong_dan_file` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_dang` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mo_ta` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ma_tai_lieu`),
  KEY `fk_tailieu_lophoc` (`ma_lop`),
  CONSTRAINT `fk_tailieu_lophoc` FOREIGN KEY (`ma_lop`) REFERENCES `lop_hoc` (`ma_lop`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tai_lieu`
--

LOCK TABLES `tai_lieu` WRITE;
/*!40000 ALTER TABLE `tai_lieu` DISABLE KEYS */;
INSERT INTO `tai_lieu` VALUES (1,1,'Unit 1 - Grammar','/uploads/tai_lieu/unit1_grammar.pdf','2026-10-03 21:24:31','Tài liệu ngữ pháp Unit 1');
/*!40000 ALTER TABLE `tai_lieu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `xep_lop`
--

DROP TABLE IF EXISTS `xep_lop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `xep_lop` (
  `ma_xep_lop` int NOT NULL AUTO_INCREMENT,
  `ma_hoc_vien` int NOT NULL,
  `ma_lop` int NOT NULL,
  `ngay_xep` date NOT NULL,
  `trang_thai` enum('Đang học','Đã hoàn thành','Đã rời lớp') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Đang học',
  PRIMARY KEY (`ma_xep_lop`),
  UNIQUE KEY `fk_xeplop_hocvien_lop` (`ma_hoc_vien`,`ma_lop`),
  KEY `fk_xeplop_lophoc` (`ma_lop`),
  CONSTRAINT `fk_xeplop_hocvien` FOREIGN KEY (`ma_hoc_vien`) REFERENCES `hoc_vien` (`ma_hoc_vien`),
  CONSTRAINT `fk_xeplop_lophoc` FOREIGN KEY (`ma_lop`) REFERENCES `lop_hoc` (`ma_lop`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `xep_lop`
--

LOCK TABLES `xep_lop` WRITE;
/*!40000 ALTER TABLE `xep_lop` DISABLE KEYS */;
INSERT INTO `xep_lop` VALUES (3,1,1,'2026-10-03','Đang học'),(4,2,1,'2026-10-03','Đang học');
/*!40000 ALTER TABLE `xep_lop` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-04 12:41:21
