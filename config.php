<?php
/* =============================================================
   INTELLEXA '26 – Database Configuration
   File: config.php
   ============================================================= */

// ── Database credentials ──────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'intellexa26');
define('DB_USER', 'root');          // Change to your MySQL username
define('DB_PASS', '');              // Change to your MySQL password
define('DB_CHARSET', 'utf8mb4');

// ── Upload settings ───────────────────────────────────────────
define('UPLOAD_DIR', __DIR__ . '/uploads/');   // Absolute path
define('UPLOAD_URL', 'uploads/');              // Relative URL for frontend
define('MAX_FILE_SIZE', 5 * 1024 * 1024);      // 5 MB max
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

// ── App settings ──────────────────────────────────────────────
define('ADMIN_USER', 'admin');                 // Admin panel username
define('ADMIN_PASS', 'Intellexa@2026');        // Admin panel password

// ── Environment ───────────────────────────────────────────────
define('APP_ENV', 'development');  // Change to 'production' when deploying
define('APP_URL', 'http://localhost/intellexa26/');

// ── CORS origin (set to your frontend domain in production) ───
define('ALLOWED_ORIGIN', '*');

// =============================================================
//  PDO Connection – returns a singleton PDO instance
// =============================================================
function getDB(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // In production, never expose DB errors to the browser
            if (APP_ENV === 'development') {
                http_response_code(500);
                die(json_encode([
                    'success' => false,
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ]));
            } else {
                http_response_code(500);
                die(json_encode([
                    'success' => false,
                    'message' => 'Internal server error. Please try again later.'
                ]));
            }
        }
    }

    return $pdo;
}

// =============================================================
//  Helper: Send JSON response and exit
// =============================================================
function jsonResponse(bool $success, string $message, array $data = [], int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data,
    ]);
    exit;
}

// =============================================================
//  Helper: Sanitize string input
// =============================================================
function clean(string $value): string {
    return trim(htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8'));
}

// =============================================================
//  Helper: Count words in abstract
// =============================================================
function countWords(string $text): int {
    return str_word_count(trim($text));
}

// =============================================================
//  Create upload directory if not exists
// =============================================================
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
