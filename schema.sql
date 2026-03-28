-- =============================================================
--  INTELLEXA '26 – Database Schema
--  File   : schema.sql
--  Engine : MySQL 5.7+ / MariaDB 10.3+
--  Run    : mysql -u root -p < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS intellexa26
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE intellexa26;

-- =============================================================
--  TABLE 1: registrations
-- =============================================================
CREATE TABLE IF NOT EXISTS registrations (
    id                  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,

    -- Personal Information
    full_name           VARCHAR(150)    NOT NULL,
    year_of_study       VARCHAR(20)     NOT NULL,
    degree              VARCHAR(30)     NOT NULL,
    department          VARCHAR(150)    NOT NULL,
    college_name        VARCHAR(200)    NOT NULL,
    college_location    VARCHAR(150)    NOT NULL,
    email               VARCHAR(180)    NOT NULL,
    phone               CHAR(10)        NOT NULL,
    referral_code       VARCHAR(60)     DEFAULT NULL,

    -- Payment
    transaction_id      VARCHAR(120)    NOT NULL,
    screenshot_path     VARCHAR(350)    NOT NULL,

    -- Meta
    registered_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address          VARCHAR(45)     DEFAULT NULL,
    status              ENUM('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',

    UNIQUE KEY uq_email       (email),
    UNIQUE KEY uq_transaction (transaction_id),
    INDEX      idx_phone      (phone),
    INDEX      idx_status     (status),
    INDEX      idx_reg_date   (registered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================
--  TABLE 2: events  (master list)
-- =============================================================
CREATE TABLE IF NOT EXISTS events (
    id          TINYINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    event_name  VARCHAR(100)      NOT NULL UNIQUE,
    event_type  ENUM('workshop','technical','nontechnical') NOT NULL,
    is_active   TINYINT(1)        NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO events (event_name, event_type) VALUES
    ('NEXA AI Workshop',                 'workshop'),
    ('AI Prompt Arena',                  'technical'),
    ('Paper Presentation',               'technical'),
    ('Web Design Clash',                 'technical'),
    ('Code Relay',                       'technical'),
    ('IPL Auction',                      'nontechnical'),
    ('Photography Contest', 'nontechnical'),
    ('Brain Blitz Quiz',                 'nontechnical'),
    ('MindLink Challenge',               'nontechnical');


-- =============================================================
--  TABLE 3: registration_events  (many-to-many)
-- =============================================================
CREATE TABLE IF NOT EXISTS registration_events (
    id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    registration_id  INT UNSIGNED     NOT NULL,
    event_id         TINYINT UNSIGNED NOT NULL,
    UNIQUE KEY uq_reg_event (registration_id, event_id),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id)        REFERENCES events(id)        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================
--  TABLE 4: paper_submissions
-- =============================================================
CREATE TABLE IF NOT EXISTS paper_submissions (
    id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    registration_id  INT UNSIGNED     NOT NULL UNIQUE,
    team_name        VARCHAR(150)     NOT NULL,
    member_count     TINYINT UNSIGNED NOT NULL,
    abstract_text    TEXT             NOT NULL,
    word_count       SMALLINT UNSIGNED NOT NULL,
    submitted_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================
--  TABLE 5: paper_team_members
-- =============================================================
CREATE TABLE IF NOT EXISTS paper_team_members (
    id             INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    paper_id       INT UNSIGNED     NOT NULL,
    member_number  TINYINT UNSIGNED NOT NULL,
    member_name    VARCHAR(150)     NOT NULL,
    UNIQUE KEY uq_paper_member (paper_id, member_number),
    FOREIGN KEY (paper_id) REFERENCES paper_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================
--  VIEW: v_full_registrations
-- =============================================================
CREATE OR REPLACE VIEW v_full_registrations AS
SELECT
    r.id,
    r.full_name,
    r.year_of_study,
    r.degree,
    r.department,
    r.college_name,
    r.college_location,
    r.email,
    r.phone,
    r.referral_code,
    GROUP_CONCAT(e.event_name ORDER BY e.event_name SEPARATOR ', ') AS events_selected,
    r.transaction_id,
    r.screenshot_path,
    r.status,
    r.registered_at
FROM registrations r
LEFT JOIN registration_events re ON re.registration_id = r.id
LEFT JOIN events e               ON e.id = re.event_id
GROUP BY r.id;