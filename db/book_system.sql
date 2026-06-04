-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: book_system
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `t_book`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_book` (
  `book_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '图书唯一标识',
  `book_isbn` varchar(30) NOT NULL COMMENT '图书ISBN编号',
  `book_name` varchar(100) NOT NULL COMMENT '图书名称',
  `book_author` varchar(50) NOT NULL COMMENT '图书作者',
  `book_publisher` varchar(100) NOT NULL COMMENT '出版社',
  `category_id` int unsigned NOT NULL COMMENT '分类ID（关联t_book_category）',
  `book_position` varchar(50) NOT NULL COMMENT '馆藏位置（如A区3排5号）',
  `book_desc` text COMMENT '图书简介',
  `book_cover` varchar(255) DEFAULT NULL,
  `book_stock` int unsigned NOT NULL DEFAULT '0' COMMENT '总库存数量',
  `book_available` int unsigned NOT NULL DEFAULT '0' COMMENT '可借阅数量',
  PRIMARY KEY (`book_id`),
  UNIQUE KEY `uk_book_isbn` (`book_isbn`) COMMENT 'ISBN编号唯一',
  KEY `idx_category_id` (`category_id`) COMMENT '分类ID索引，提升关联查询效率',
  CONSTRAINT `fk_book_category` FOREIGN KEY (`category_id`) REFERENCES `t_book_category` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_book`
--

LOCK TABLES `t_book` WRITE;
/*!40000 ALTER TABLE `t_book` DISABLE KEYS */;
INSERT INTO `t_book` VALUES (4,'9787020138500','活着','余华','人民文学出版社',8,'A区3排5号','讲述福贵一生的苦难与坚韧，中国当代文学巅峰之作','book_covers/HuoZhe.jpg',5,1),(5,'9787532752676','百年孤独','加西亚·马尔克斯','上海译文出版社',8,'A区3排6号','魔幻现实主义经典，讲述布恩迪亚家族七代传奇','book_covers/BaiNianGuDu.jpg',5,1),(6,'9787020027090','红楼梦','曹雪芹','人民文学出版社',9,'A区4排1号','中国古典小说巅峰之作，四大名著之首','book_covers/HongLouMong.jpg',5,4),(7,'9787532747702','我与地坛','史铁生','上海译文出版社',9,'A区4排2号','关于生命与苦难的思考，被誉为中国当代散文之冠','book_covers/WoYuDiTang.jpg',5,3),(8,'9787508647357','人类简史','尤瓦尔·赫拉利','中信出版社',11,'B区2排3号','从认知革命到文明巅峰，讲述人类如何成为世界主宰','book_covers/RenLeiJianShi.jpg',5,2),(9,'9787111428028','明朝那些事儿','当年明月','浙江人民出版社',11,'B区2排4号','以幽默笔触讲述大明三百年历史，通俗史学经典','book_covers/MingChao.jpg',5,3),(10,'9787508681807','乌合之众','古斯塔夫·勒庞','中信出版社',12,'B区5排1号','研究群体心理的经典著作，揭示大众行为的奥秘','book_covers/WuHeZhiZhong.jpg',5,2),(11,'9787100007715','苏菲的世界','乔斯坦·贾德','商务印书馆',13,'C区1排2号','哲学入门神作，以小说形式系统介绍西方哲学史','book_covers/World.jpg',5,1),(12,'9787115428028','Python编程：从入门到实践','Eric Matthes','人民邮电出版社',14,'D区3排1号','零基础学Python的最佳入门书，包含项目实战','book_covers/Python.jpg',5,0),(13,'9787115428011','深度学习','Ian Goodfellow','人民邮电出版社',17,'E区2排5号','AI领域奠基之作，覆盖数学基础与深度学习实践','book_covers/DeepLearning.jpg',5,4);
/*!40000 ALTER TABLE `t_book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_book_category`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_book_category` (
  `category_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '分类唯一标识',
  `category_name` varchar(50) NOT NULL COMMENT '分类名称（如小说、科技）',
  `category_desc` varchar(200) DEFAULT NULL COMMENT '分类描述',
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_category_name` (`category_name`) COMMENT '分类名称唯一'
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书分类表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_book_category`
--

LOCK TABLES `t_book_category` WRITE;
/*!40000 ALTER TABLE `t_book_category` DISABLE KEYS */;
INSERT INTO `t_book_category` VALUES (8,'小说','包含长篇小说、中篇小说、短篇小说等虚构文学作品'),(9,'文学名著','中外经典文学作品，如《红楼梦》《百年孤独》等'),(10,'诗歌散文','诗歌、散文、随笔等抒情类文学作品'),(11,'历史','中国史、世界史、史学研究等历史类书籍'),(12,'社科','社会学、心理学、经济学、政治学等社会科学类'),(13,'哲学','东西方哲学、伦理学、逻辑学等哲学类书籍'),(14,'计算机编程','编程语言、算法、数据结构、Web开发等'),(15,'数据库','关系型数据库、NoSQL、数据库优化等'),(16,'人工智能','机器学习、深度学习、自然语言处理等'),(17,'推理悬疑','侦探推理、悬疑惊悚、犯罪小说等'),(18,'科幻奇幻','科幻小说、奇幻小说、玄幻小说等'),(19,'传记','人物传记、自传、回忆录等纪实类作品'),(20,'艺术','绘画、音乐、建筑、影视等艺术类书籍'),(21,'教育','教育学、教育心理学、教学方法等教育类书籍'),(22,'生活','健康养生、美食烹饪、家居生活等生活类书籍');
/*!40000 ALTER TABLE `t_book_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_book_note`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_book_note` (
  `note_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '心得ID',
  `user_id` int unsigned NOT NULL COMMENT '发表用户ID（关联t_user.user_id）',
  `book_id` int unsigned DEFAULT NULL COMMENT '关联书籍ID（关联t_book.book_id，可选）',
  `content` text NOT NULL COMMENT '心得内容',
  `like_count` int unsigned NOT NULL DEFAULT '0' COMMENT '点赞数',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0=下架 1=正常',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`note_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_book_id` (`book_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户读书心得表（所有人可发表/浏览）';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_book_note`
--

LOCK TABLES `t_book_note` WRITE;
/*!40000 ALTER TABLE `t_book_note` DISABLE KEYS */;
INSERT INTO `t_book_note` VALUES (8,17,4,'123444444',0,1,'2026-04-04 13:10:47',NULL),(9,17,6,'品读《红楼梦》，仿佛走进一座繁华又悲凉的封建世家。书中以贾史王薛四大家族兴衰为背景，围绕贾宝玉、林黛玉、薛宝钗的爱恨纠葛展开，描绘出众多鲜活灵动的人物。大观园里的诗情画意、日常百态，尽显人间烟火；可盛极必衰，家族落寞、佳人离散，终究落得一场空。这本书不仅揭露了封建礼教的束缚与腐朽，也道尽了人生无常、世事浮沉。繁华皆是泡影，命运自有定数，让人在唏嘘中读懂人情冷暖、世事变迁。',1,1,'2026-05-10 12:33:54','2026-05-10 12:34:16');
/*!40000 ALTER TABLE `t_book_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_borrow_apply`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_borrow_apply` (
  `apply_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `apply_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `apply_status` tinyint DEFAULT '0' COMMENT '0-待审核 1-审核通过 2-审核拒绝',
  `operator_id` int DEFAULT NULL COMMENT '审核管理员ID',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`apply_id`),
  KEY `user_id` (`user_id`),
  KEY `book_id` (`book_id`),
  CONSTRAINT `t_borrow_apply_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`),
  CONSTRAINT `t_borrow_apply_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `t_book` (`book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_borrow_apply`
--

LOCK TABLES `t_borrow_apply` WRITE;
/*!40000 ALTER TABLE `t_borrow_apply` DISABLE KEYS */;
INSERT INTO `t_borrow_apply` VALUES (83,17,4,'2026-04-04 11:17:55',1,1,'2026-04-04 11:21:35'),(84,17,6,'2026-04-04 11:17:58',1,1,'2026-04-04 11:21:36'),(85,17,8,'2026-04-04 11:18:01',1,1,'2026-04-04 11:21:36'),(86,17,12,'2026-04-04 11:18:03',1,1,'2026-04-04 11:21:37'),(87,17,10,'2026-04-04 11:18:06',2,1,'2026-04-04 11:21:38'),(88,17,4,'2026-04-04 11:21:58',0,NULL,NULL),(89,17,4,'2026-04-04 12:36:55',1,1,'2026-06-02 18:43:00'),(90,20,4,'2026-04-04 12:45:53',1,1,'2026-06-02 18:37:36'),(91,20,5,'2026-04-04 12:50:38',1,1,'2026-06-02 18:37:30');
/*!40000 ALTER TABLE `t_borrow_apply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_borrow_record`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_borrow_record` (
  `borrow_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '借阅记录唯一标识',
  `user_id` int unsigned NOT NULL COMMENT '用户ID（关联t_user）',
  `book_id` int unsigned NOT NULL COMMENT '图书ID（关联t_book）',
  `borrow_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '借阅时间',
  `borrow_deadline` datetime NOT NULL COMMENT '应还时间（如借阅后30天）',
  `return_time` datetime DEFAULT NULL COMMENT '实际归还时间（未归还为NULL）',
  `borrow_status` tinyint NOT NULL DEFAULT '1' COMMENT '借阅状态：1=已借阅，2=已归还，3=逾期未还',
  `operator_id` int unsigned NOT NULL COMMENT '操作人ID（管理员ID/自助借阅为0）',
  `renew_count` int DEFAULT '0' COMMENT '续借次数',
  PRIMARY KEY (`borrow_id`),
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_book_id` (`book_id`) COMMENT '图书ID索引',
  KEY `idx_borrow_status` (`borrow_status`) COMMENT '借阅状态索引，便于筛选查询',
  CONSTRAINT `fk_borrow_book` FOREIGN KEY (`book_id`) REFERENCES `t_book` (`book_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_borrow_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书借阅记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_borrow_record`
--

LOCK TABLES `t_borrow_record` WRITE;
/*!40000 ALTER TABLE `t_borrow_record` DISABLE KEYS */;
INSERT INTO `t_borrow_record` VALUES (87,17,4,'2026-04-04 11:21:35','2026-05-04 11:21:36','2026-06-02 19:49:40',2,1,0),(88,17,6,'2026-04-04 11:21:36','2026-05-04 11:21:36','2026-04-04 11:26:07',2,1,0),(89,17,8,'2026-05-04 11:21:36','2026-06-04 11:21:37',NULL,1,1,0),(90,17,12,'2026-05-04 11:21:37','2026-06-04 11:21:38',NULL,1,1,0),(91,20,5,'2026-06-02 18:37:30','2026-07-02 18:37:31',NULL,1,1,0),(92,20,4,'2026-06-02 18:37:36','2026-07-02 18:37:37',NULL,1,1,0),(93,17,4,'2026-06-02 18:43:00','2026-07-02 18:43:00',NULL,1,1,0);
/*!40000 ALTER TABLE `t_borrow_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_feedback`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_feedback` (
  `feedback_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '反馈ID',
  `user_id` int unsigned DEFAULT NULL COMMENT '提交反馈的用户ID（可空）',
  `feedback_content` varchar(1000) NOT NULL COMMENT '反馈内容',
  `feedback_type` varchar(30) NOT NULL DEFAULT '借书' COMMENT '反馈类型：借书、还书、押金、其他',
  `cabinet_address` varchar(255) DEFAULT NULL COMMENT '书柜地址',
  `reply_content` varchar(1000) DEFAULT NULL COMMENT '管理员回复内容',
  `reply_admin_id` int unsigned DEFAULT NULL COMMENT '回复的管理员ID（可空）',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0=未处理 1=已回复 2=已关闭',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `reply_time` datetime DEFAULT NULL COMMENT '回复时间',
  PRIMARY KEY (`feedback_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户反馈表（全局给所有管理员查看）';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_feedback`
--

LOCK TABLES `t_feedback` WRITE;
/*!40000 ALTER TABLE `t_feedback` DISABLE KEYS */;
INSERT INTO `t_feedback` VALUES (3,17,'试一下','借书',NULL,NULL,NULL,0,'2026-04-04 13:09:43',NULL);
/*!40000 ALTER TABLE `t_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_message`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_message` (
  `message_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '消息唯一标识',
  `user_id` int unsigned NOT NULL COMMENT '接收消息的用户ID（关联t_user）',
  `message_content` varchar(500) NOT NULL COMMENT '消息内容（如逾期提醒文本）',
  `message_type` varchar(30) NOT NULL COMMENT '消息类型：overdue_reminder=逾期提醒，borrow_apply=借阅申请，return_apply=归还申请',
  `related_borrow_id` int unsigned DEFAULT NULL COMMENT '关联的借阅记录ID（关联t_borrow_record）',
  `related_apply_id` int unsigned DEFAULT NULL COMMENT '关联的申请ID（借阅/归还申请）',
  `is_read` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已读：0=未读，1=已读',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '消息创建时间',
  PRIMARY KEY (`message_id`),
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引，便于查询用户所有消息',
  KEY `idx_borrow_id` (`related_borrow_id`) COMMENT '借阅ID索引，便于关联逾期提醒',
  KEY `idx_message_type` (`message_type`) COMMENT '消息类型索引，便于筛选特定类型消息',
  KEY `idx_create_time` (`create_time`) COMMENT '创建时间索引，便于按时间排序',
  CONSTRAINT `fk_message_borrow` FOREIGN KEY (`related_borrow_id`) REFERENCES `t_borrow_record` (`borrow_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_message_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户消息提醒表（逾期提醒/申请通知等）';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_message`
--

LOCK TABLES `t_message` WRITE;
/*!40000 ALTER TABLE `t_message` DISABLE KEYS */;
INSERT INTO `t_message` VALUES (62,17,'【图书逾期提醒】尊敬的Hell，您借阅的《活着》已逾期5天，请尽快归还图书，感谢配合！','overdue_reminder',87,NULL,0,'2026-05-10 10:24:57'),(63,17,'【图书逾期提醒】尊敬的Hell，您借阅的《活着》已逾期7天，请尽快归还图书，感谢配合！','overdue_reminder',87,NULL,0,'2026-05-11 12:53:45'),(64,17,'【图书逾期提醒】尊敬的Hell，您借阅的《活着》已逾期29天，请尽快归还图书，感谢配合！','overdue_reminder',87,NULL,0,'2026-06-02 18:04:56');
/*!40000 ALTER TABLE `t_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_notice`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_notice` (
  `notice_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `admin_id` int unsigned NOT NULL COMMENT '发表管理员ID（关联t_user.user_id）',
  `title` varchar(100) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `is_top` tinyint NOT NULL DEFAULT '0' COMMENT '是否置顶：0=否 1=是',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0=下架 1=正常',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`notice_id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_is_top` (`is_top`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统通知表（仅管理员可发表，用户浏览）';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_notice`
--

LOCK TABLES `t_notice` WRITE;
/*!40000 ALTER TABLE `t_notice` DISABLE KEYS */;
INSERT INTO `t_notice` VALUES (3,1,'闭馆通知','尊敬的各位读者：因场馆维护整理、设备检修及图书盘点工作需要，图书馆将临时闭馆，现将有关事宜通知如下：1.闭馆时间：即日起至另行通知2.闭馆期间暂停入馆阅览、图书借阅、归还及所有线下服务。3.已借阅图书顺延归还期限，不产生逾期罚款，请各位读者放心。恢复开馆时间将另行发布通知，敬请关注公告。由此给您带来的不便，敬请谅解',0,1,'2026-05-10 16:03:16',NULL);
/*!40000 ALTER TABLE `t_notice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_overdue_record`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_overdue_record` (
  `overdue_id` int NOT NULL AUTO_INCREMENT COMMENT '逾期记录ID（主键）',
  `borrow_id` int unsigned NOT NULL COMMENT '关联借阅记录ID（外键，关联t_borrow_record.borrow_id）',
  `user_id` int unsigned NOT NULL COMMENT '用户ID（冗余，便于查询）',
  `book_id` int unsigned NOT NULL COMMENT '图书ID（冗余，便于查询）',
  `overdue_days` int NOT NULL DEFAULT '0' COMMENT '逾期天数',
  `fine_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '逾期罚款金额',
  `fine_status` tinyint NOT NULL DEFAULT '0' COMMENT '罚款状态：0-未缴纳，1-已缴纳',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '逾期记录创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`overdue_id`),
  KEY `idx_borrow_id` (`borrow_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_fine_status` (`fine_status`),
  CONSTRAINT `fk_overdue_borrow` FOREIGN KEY (`borrow_id`) REFERENCES `t_borrow_record` (`borrow_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书逾期记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_overdue_record`
--

LOCK TABLES `t_overdue_record` WRITE;
/*!40000 ALTER TABLE `t_overdue_record` DISABLE KEYS */;
INSERT INTO `t_overdue_record` VALUES (1,87,17,4,6,3.00,0,'2026-05-10 10:01:33','2026-05-10 10:01:33'),(2,87,17,4,30,15.00,0,'2026-06-02 19:49:40','2026-06-02 19:49:40');
/*!40000 ALTER TABLE `t_overdue_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_renew_apply`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_renew_apply` (
  `renew_apply_id` int NOT NULL AUTO_INCREMENT COMMENT '续借申请ID',
  `borrow_id` int unsigned NOT NULL COMMENT '借阅记录ID',
  `user_id` int unsigned NOT NULL COMMENT '用户ID',
  `apply_status` tinyint DEFAULT '0' COMMENT '申请状态：0-待审核 1-通过 2-拒绝',
  `operator_id` int DEFAULT NULL COMMENT '审核人ID',
  `apply_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`renew_apply_id`),
  KEY `borrow_id` (`borrow_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `t_renew_apply_ibfk_1` FOREIGN KEY (`borrow_id`) REFERENCES `t_borrow_record` (`borrow_id`),
  CONSTRAINT `t_renew_apply_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书续借申请表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_renew_apply`
--

LOCK TABLES `t_renew_apply` WRITE;
/*!40000 ALTER TABLE `t_renew_apply` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_renew_apply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_return_apply`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_return_apply` (
  `return_apply_id` int NOT NULL AUTO_INCREMENT,
  `borrow_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `apply_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `apply_status` tinyint DEFAULT '0' COMMENT '0-待审核 1-审核通过 2-审核拒绝',
  `operator_id` int DEFAULT NULL COMMENT '审核管理员ID',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`return_apply_id`),
  KEY `borrow_id` (`borrow_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `t_return_apply_ibfk_1` FOREIGN KEY (`borrow_id`) REFERENCES `t_borrow_record` (`borrow_id`),
  CONSTRAINT `t_return_apply_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_return_apply`
--

LOCK TABLES `t_return_apply` WRITE;
/*!40000 ALTER TABLE `t_return_apply` DISABLE KEYS */;
INSERT INTO `t_return_apply` VALUES (17,88,17,'2026-04-04 11:22:18',1,1,'2026-04-04 11:26:07'),(24,90,17,'2026-04-04 11:52:45',0,NULL,NULL),(25,89,17,'2026-04-04 11:55:49',0,NULL,NULL),(26,87,17,'2026-04-04 12:19:02',1,1,'2026-06-02 19:49:40');
/*!40000 ALTER TABLE `t_return_apply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_sms_code`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_sms_code` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_phone` varchar(20) NOT NULL COMMENT '手机号',
  `sms_code` varchar(6) NOT NULL COMMENT '6位验证码',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`user_phone`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='短信验证码表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_sms_code`
--

LOCK TABLES `t_sms_code` WRITE;
/*!40000 ALTER TABLE `t_sms_code` DISABLE KEYS */;
/*!40000 ALTER TABLE `t_sms_code` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `t_user`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_user` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识',
  `user_name` varchar(50) NOT NULL COMMENT '登录/显示用户名',
  `user_pwd` varchar(100) NOT NULL COMMENT '加密后的密码（MD5/BCrypt）',
  `user_phone` varchar(20) NOT NULL COMMENT '用户手机号',
  `user_role` tinyint NOT NULL DEFAULT '1' COMMENT '用户角色：1=普通读者，2=管理员',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '信息更新时间',
  `user_avatar` varchar(255) DEFAULT NULL COMMENT '头像URL地址',
  `user_gender` tinyint DEFAULT '0' COMMENT '性别：0=未知，1=男，2=女',
  `user_region` varchar(100) DEFAULT NULL COMMENT '地区（省/市/区）',
  `borrow_count` int NOT NULL DEFAULT '0' COMMENT '当前正在借阅的图书数量',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_user_name` (`user_name`) COMMENT '用户名唯一',
  UNIQUE KEY `uk_user_phone` (`user_phone`) COMMENT '手机号唯一'
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_user`
--

LOCK TABLES `t_user` WRITE;
/*!40000 ALTER TABLE `t_user` DISABLE KEYS */;
INSERT INTO `t_user` VALUES (1,'zyh','$2a$10$gnf.RHpNxlhehEQpqJwRgOMmajFCoG42/mMFL6obDZHAyt0gOowSu','18179684175',2,'2026-01-06 17:07:16','2026-03-29 20:36:13','book_covers/photo.jpg',0,NULL,0),(17,'Hell','$2a$10$MbyNdK4zQKJjglAv34Mt5uB6kx.M9dlinImYWy9f7FzImUlkRZNJ.','19178684175',1,'2026-03-09 22:16:36','2026-06-02 19:49:40','book_covers/UserPhoto.jpg',0,'北京市',3),(18,'zs','$2a$10$ZW9WMFHpjlfeBbrZPVTPd.ZI5B0lmgRW5oF3I9uxdNGfRFBRE8Ppi','19178684170',1,'2026-03-09 22:18:10','2026-04-04 11:17:20',NULL,0,NULL,0),(19,'ll','$2a$10$h7czVbTM1.SigZ8N8Cr4ROlHZbkBmfpYKpEC9bUbxFJWaaTgL7RtC','19179694175',1,'2026-03-09 22:36:15','2026-04-04 11:17:20',NULL,0,NULL,0),(20,'wjp','$2a$10$w3eVsSdkXjLOkf7oPhQ5U.SK3qtS.wsLt.sEbIlrSICH5.w9mok4S','17870675368',1,'2026-04-02 16:20:15','2026-06-02 18:37:36',NULL,0,NULL,2),(23,'lyh','$2a$10$X5L7qPSF9VeEtOD.70u2K.DJjEUOGU5p6GhmZGbA4zi1GGkj1FYn6','18179684174',1,'2026-04-04 13:08:46','2026-04-04 13:08:46',NULL,0,NULL,0);
/*!40000 ALTER TABLE `t_user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 10:56:57
