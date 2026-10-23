-- ============================================================
-- 实验五 数据表设计：个人主页（项目 / 文章 / 文章分类）
-- 数据库：personal_home  字符集：utf8mb4
-- ============================================================
CREATE DATABASE IF NOT EXISTS personal_home
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE personal_home;

-- ---------- 文章分类表（被 articles.category_id 外键引用） ----------
CREATE TABLE IF NOT EXISTS article_categories (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类编号（主键）',
  name   VARCHAR(50)  NOT NULL COMMENT '分类名称',
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章分类';

-- ---------- 项目表 ----------
CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目编号（主键）',
  name        VARCHAR(100) NOT NULL COMMENT '项目名称',
  state       VARCHAR(20)  NOT NULL DEFAULT '计划中' COMMENT '状态：已完成/进行中/计划中',
  year        INT          NOT NULL DEFAULT 2026 COMMENT '年份',
  role        VARCHAR(50)  DEFAULT '个人项目' COMMENT '我的角色',
  score       TINYINT UNSIGNED NOT NULL DEFAULT 80 COMMENT '评分 0-100',
  duration    VARCHAR(50)  DEFAULT '' COMMENT '时间跨度',
  link        VARCHAR(255) DEFAULT '' COMMENT '仓库链接',
  description VARCHAR(500) NOT NULL COMMENT '项目简介',
  tech        TEXT COMMENT '技术栈（JSON 数组）',
  highlights  TEXT COMMENT '实现要点（JSON 数组）',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目作品';

-- ---------- 文章表 ----------
CREATE TABLE IF NOT EXISTS articles (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文章编号（主键）',
  title       VARCHAR(200) NOT NULL COMMENT '标题',
  category_id INT UNSIGNED NOT NULL COMMENT '分类编号（外键 -> article_categories.id）',
  date        DATE         NOT NULL COMMENT '发布日期',
  tags        TEXT COMMENT '标签（JSON 数组）',
  views       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '阅读量',
  published   TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '是否发布：1 是 / 0 草稿',
  summary     VARCHAR(500) NOT NULL COMMENT '摘要',
  content     TEXT         NOT NULL COMMENT '正文',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_articles_category (category_id),
  KEY idx_articles_published (published),
  CONSTRAINT fk_article_category
    FOREIGN KEY (category_id) REFERENCES article_categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章';
