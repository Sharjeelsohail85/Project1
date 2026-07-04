-- InfinityFree / MySQL schema dump
-- Generated from Laravel sqlite migration state
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `uuid` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `categories_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `countries`;
CREATE TABLE `countries` (
  `uuid` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  UNIQUE KEY `countries_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` BIGINT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  KEY `password_resets_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `privacy_options`;
CREATE TABLE `privacy_options` (
  `uuid` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `privacy_options_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `uuid` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `remember_token` VARCHAR(255),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `last_name` VARCHAR(255) NOT NULL,
  `address` TEXT,
  `phone` VARCHAR(255),
  `registration_type` VARCHAR(255) DEFAULT 'general',
  `registration_reference_id` VARCHAR(255),
  `deleted_at` DATETIME,
  `confirmation_code` VARCHAR(255),
  `reconfirm_code` VARCHAR(255),
  `active` BIGINT NOT NULL DEFAULT '0',
  `country_id` VARCHAR(255) NOT NULL,
  `google_app_name` VARCHAR(255),
  `google_client_id` VARCHAR(255),
  `google_client_secret` VARCHAR(255),
  `google_api_key` VARCHAR(255),
  `google_folder_id` VARCHAR(255),
  `dropbox_key` VARCHAR(255),
  `dropbox_secret` VARCHAR(255),
  `dropbox_access_token` VARCHAR(255),
  `color` VARCHAR(255),
  `google_access_token` TEXT,
  `google_refresh_token` TEXT,
  `google_token_expires_at` DATETIME,
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `channels`;
CREATE TABLE `channels` (
  `uuid` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `active` BIGINT NOT NULL DEFAULT '0',
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  `privacy_option_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_channels_0` FOREIGN KEY (`privacy_option_id`) REFERENCES `privacy_options` (`uuid`),
  CONSTRAINT `fk_channels_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `channels_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `followers`;
CREATE TABLE `followers` (
  `uuid` VARCHAR(255) NOT NULL,
  `followed_to_id` VARCHAR(255) NOT NULL,
  `followed_by_id` VARCHAR(255) NOT NULL,
  `followed` BIGINT NOT NULL DEFAULT '1',
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_followers_0` FOREIGN KEY (`followed_by_id`) REFERENCES `users` (`uuid`),
  CONSTRAINT `fk_followers_1` FOREIGN KEY (`followed_to_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `followers_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sessionTokens`;
CREATE TABLE `sessionTokens` (
  `uuid` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `client_id` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiry_date` DATE,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  `device` VARCHAR(255) NOT NULL,
  `os` VARCHAR(255) NOT NULL,
  `os_version` VARCHAR(255),
  `ip` VARCHAR(255),
  `current_location` VARCHAR(255),
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_sessionTokens_0` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `sessiontokens_token_unique` (`token`),
  UNIQUE KEY `sessiontokens_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `uuid` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `active` BIGINT NOT NULL DEFAULT '0',
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_tags_0` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `tags_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_categories`;
CREATE TABLE `user_categories` (
  `uuid` VARCHAR(255) NOT NULL,
  `category_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  CONSTRAINT `fk_user_categories_0` FOREIGN KEY (`category_id`) REFERENCES `categories` (`uuid`),
  UNIQUE KEY `user_categories_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `uuid` VARCHAR(255) NOT NULL,
  `channel_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `subscribed` BIGINT NOT NULL DEFAULT '1',
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_subscriptions_0` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`uuid`),
  CONSTRAINT `fk_subscriptions_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `subscriptions_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_tags`;
CREATE TABLE `user_tags` (
  `uuid` VARCHAR(255) NOT NULL,
  `tag_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_user_tags_0` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  CONSTRAINT `fk_user_tags_1` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`uuid`),
  UNIQUE KEY `user_tags_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `videos`;
CREATE TABLE `videos` (
  `uuid` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` TEXT,
  `url` VARCHAR(255),
  `active` BIGINT NOT NULL DEFAULT '0',
  `admin_active` BIGINT NOT NULL DEFAULT '1',
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  `comment` BIGINT NOT NULL DEFAULT '1',
  `privacy_option_id` VARCHAR(255) NOT NULL,
  `embed` BIGINT NOT NULL DEFAULT '1',
  `thumbnail` VARCHAR(255),
  `channel_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_videos_0` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`uuid`),
  CONSTRAINT `fk_videos_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  CONSTRAINT `fk_videos_2` FOREIGN KEY (`privacy_option_id`) REFERENCES `privacy_options` (`uuid`),
  UNIQUE KEY `videos_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `channel_logs`;
CREATE TABLE `channel_logs` (
  `uuid` VARCHAR(255) NOT NULL,
  `channel_id` VARCHAR(255) NOT NULL,
  `video_id` VARCHAR(255) NOT NULL,
  `video_time` TEXT NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `ip` VARCHAR(255),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_channel_logs_0` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  CONSTRAINT `fk_channel_logs_1` FOREIGN KEY (`video_id`) REFERENCES `videos` (`uuid`),
  CONSTRAINT `fk_channel_logs_2` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`uuid`),
  UNIQUE KEY `channel_logs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `uuid` VARCHAR(255) NOT NULL,
  `video_id` VARCHAR(255) NOT NULL,
  `comment` TEXT NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_comments_0` FOREIGN KEY (`video_id`) REFERENCES `videos` (`uuid`),
  CONSTRAINT `fk_comments_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `comments_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `uuid` VARCHAR(255) NOT NULL,
  `video_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  `like_boolean` BIGINT NOT NULL DEFAULT '1',
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_likes_0` FOREIGN KEY (`video_id`) REFERENCES `videos` (`uuid`),
  CONSTRAINT `fk_likes_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `likes_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `video_history`;
CREATE TABLE `video_history` (
  `uuid` VARCHAR(255) NOT NULL,
  `video_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  CONSTRAINT `fk_video_history_0` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  CONSTRAINT `fk_video_history_1` FOREIGN KEY (`video_id`) REFERENCES `videos` (`uuid`),
  UNIQUE KEY `video_history_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `video_logs`;
CREATE TABLE `video_logs` (
  `uuid` VARCHAR(255) NOT NULL,
  `video_id` VARCHAR(255) NOT NULL,
  `video_time` TEXT NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `ip` VARCHAR(255),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_video_logs_0` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  CONSTRAINT `fk_video_logs_1` FOREIGN KEY (`video_id`) REFERENCES `videos` (`uuid`),
  UNIQUE KEY `video_logs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reply_comments`;
CREATE TABLE `reply_comments` (
  `uuid` VARCHAR(255) NOT NULL,
  `video_id` VARCHAR(255) NOT NULL,
  `comment_id` VARCHAR(255) NOT NULL,
  `comment` TEXT NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `level` BIGINT NOT NULL DEFAULT '1',
  `created_at` DATETIME,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  PRIMARY KEY (`uuid`),
  CONSTRAINT `fk_reply_comments_0` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`uuid`),
  CONSTRAINT `fk_reply_comments_1` FOREIGN KEY (`video_id`) REFERENCES `videos` (`uuid`),
  CONSTRAINT `fk_reply_comments_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`uuid`),
  UNIQUE KEY `reply_comments_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `migrations` (`migration`, `batch`) VALUES
('2014_10_12_000000_create_users_table', 1),
('2014_10_12_100000_create_password_resets_table', 1),
('2017_08_05_181503_add_columns_to_users_table', 1),
('2017_08_06_134559_add_columns1_to_users_table', 1),
('2017_08_08_123831_create_session_tokens_table', 1),
('2017_08_08_141328_add_columns_to_sessionTokens_table', 1),
('2017_08_08_190137_create_channels_table', 1),
('2017_08_10_180500_create_tags_table', 1),
('2017_08_11_114219_create_videos_table', 1),
('2017_08_15_150835_create_likes_table', 1),
('2017_08_15_161022_add_like_to_likes_table', 1),
('2017_08_15_173015_create_subscriptions_table', 1),
('2017_08_15_182907_create_privacy_options_table', 1),
('2017_08_15_195754_create_comments_table', 1),
('2017_08_15_195914_create_reply_comments_table', 1),
('2017_08_16_201308_add_comment_to_videos_table', 1),
('2017_08_19_070130_add_privacy_option_id_to_videos_table', 1),
('2017_08_19_105151_add_embed_to_videos_table', 1),
('2017_08_19_122135_create_followers_table', 1),
('2017_08_20_140605_add_thumbnail_to_videos_table', 1),
('2017_08_20_174711_add_channel_id_to_videos_table', 1),
('2017_08_21_152213_create_video_tags_table', 1),
('2017_08_25_181051_create_video_logs_table', 1),
('2017_08_25_192828_add_privacy_options_id_to_channels_table', 1),
('2017_08_25_193433_drop_video_tags_table', 1),
('2017_08_25_194103_create_user_tags_table', 1),
('2017_08_28_111958_create_channel_logs_table', 1),
('2017_08_28_182745_create_categories_table', 1),
('2017_08_28_191348_create_user_categories_table', 1),
('2017_09_08_064053_create_video_history_table', 1),
('2017_09_08_185941_create_countries_table', 1),
('2018_02_27_153604_add_google_columns_to_users_table', 1),
('2018_02_27_195950_add_columns2_to_users_table', 1),
('2018_02_28_070416_add_dropbox_columns_to_users_table', 1),
('2018_03_05_213036_add_dropbox_access_token_to_users_table', 1),
('2018_03_06_104447_add_color_to_users_table', 1),
('2026_03_01_020000_add_google_oauth_tokens_to_users_table', 1);

SET FOREIGN_KEY_CHECKS=1;
