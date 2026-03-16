<?php
/* =============================================================
   INTELLEXA '26 – Registration API
   File   : register.php
   Method : POST  (multipart/form-data)
   ============================================================= */

require_once 'config.php';

header('Access-Control-Allow-Origin: '  . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    jsonResponse(false, 'Only POST requests are allowed.', [], 405);

/* =============================================================
   STEP 1 – Collect & sanitise input
   ============================================================= */
$fullName         = clean($_POST['full_name']        ?? '');
$yearOfStudy      = clean($_POST['year_of_study']    ?? '');
$degree           = clean($_POST['degree']           ?? '');
$department       = clean($_POST['department']       ?? '');
$collegeName      = clean($_POST['college_name']     ?? '');
$collegeLocation  = clean($_POST['college_location'] ?? '');
$email            = filter_var(trim($_POST['email']  ?? ''), FILTER_SANITIZE_EMAIL);
$phone            = preg_replace('/\D/', '', $_POST['phone'] ?? '');
$referralCode     = clean($_POST['referral_code']    ?? '');
$transactionId    = clean($_POST['transaction_id']   ?? '');
$eventsRaw        = $_POST['events']                 ?? '[]';

$isPaper          = isset($_POST['is_paper']) && $_POST['is_paper'] === '1';
$teamName         = clean($_POST['team_name']        ?? '');
$memberCount      = (int)($_POST['member_count']     ?? 0);
$memberNames      = json_decode($_POST['member_names'] ?? '[]', true) ?? [];
$abstractText     = trim($_POST['abstract']          ?? '');

$validYears   = ['I Year','II Year','III Year','IV Year'];
$validDegrees = ['B.E.','B.Tech','M.E.','M.Tech','MCA','MBA'];

/* =============================================================
   STEP 2 – Server-side validation
   ============================================================= */
$errors = [];

if (empty($fullName))                               $errors[] = 'Full name is required.';
if (empty($yearOfStudy))                            $errors[] = 'Year of study is required.';
if (empty($degree))                                 $errors[] = 'Degree is required.';
if (empty($department))                             $errors[] = 'Department is required.';
if (empty($collegeName))                            $errors[] = 'College name is required.';
if (empty($collegeLocation))                        $errors[] = 'College location is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))     $errors[] = 'Valid email is required.';
if (!preg_match('/^\d{10}$/', $phone))              $errors[] = 'Phone must be exactly 10 digits.';
if (empty($transactionId))                          $errors[] = 'Transaction ID is required.';

$events = json_decode($eventsRaw, true);
if (empty($events) || !is_array($events))           $errors[] = 'Select at least one event.';

/* Screenshot */
if (!isset($_FILES['screenshot']) || $_FILES['screenshot']['error'] !== UPLOAD_ERR_OK) {
    $errors[] = 'Transaction screenshot is required.';
} else {
    $file     = $_FILES['screenshot'];
    $mimeType = mime_content_type($file['tmp_name']);
    if ($file['size'] > MAX_FILE_SIZE)              $errors[] = 'Screenshot must be under 5 MB.';
    if (!in_array($mimeType, ALLOWED_TYPES))        $errors[] = 'Screenshot must be JPG, PNG, or WEBP.';
}

/* Paper Presentation */
if ($isPaper) {
    if (empty($teamName))                           $errors[] = 'Team name is required.';
    if ($memberCount < 1 || $memberCount > 10)      $errors[] = 'Member count must be 1–10.';
    foreach ($memberNames as $i => $n)
        if (empty(trim($n)))                        $errors[] = 'Member ' . ($i+1) . ' name is required.';
    $wc = countWords($abstractText);
    if ($wc < 250 || $wc > 300)                     $errors[] = "Abstract must be 250–300 words (current: $wc).";
}

if (!empty($errors)) jsonResponse(false, 'Validation failed.', ['errors' => $errors], 422);

/* =============================================================
   STEP 3 – Handle file upload
   ============================================================= */
$file       = $_FILES['screenshot'];
$ext        = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$safeExt    = in_array($ext, ['jpg','jpeg','png','webp']) ? $ext : 'jpg';
$fileName   = 'txn_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $safeExt;
$uploadPath = UPLOAD_DIR . $fileName;
$uploadUrl  = UPLOAD_URL . $fileName;

if (!move_uploaded_file($file['tmp_name'], $uploadPath))
    jsonResponse(false, 'Failed to save screenshot. Please try again.', [], 500);

/* =============================================================
   STEP 4 – Database transaction
   ============================================================= */
$pdo = getDB();

try {
    $pdo->beginTransaction();

    /* 4a. Insert registration */
    $stmtReg = $pdo->prepare("
        INSERT INTO registrations
            (full_name, year_of_study, degree, department,
             college_name, college_location, email, phone, referral_code,
             transaction_id, screenshot_path, ip_address)
        VALUES
            (:full_name, :year_of_study, :degree, :department,
             :college_name, :college_location, :email, :phone, :referral_code,
             :transaction_id, :screenshot_path, :ip_address)
    ");

    $stmtReg->execute([
        ':full_name'        => $fullName,
        ':year_of_study'    => $yearOfStudy,
        ':degree'           => $degree,
        ':department'       => $department,
        ':college_name'     => $collegeName,
        ':college_location' => $collegeLocation,
        ':email'            => $email,
        ':phone'            => $phone,
        ':referral_code'    => $referralCode ?: null,
        ':transaction_id'   => $transactionId,
        ':screenshot_path'  => $uploadUrl,
        ':ip_address'       => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);

    $registrationId = (int)$pdo->lastInsertId();

    /* 4b. Link events */
    $stmtEvent   = $pdo->prepare("SELECT id FROM events WHERE event_name = :name AND is_active = 1");
    $stmtLinkEvt = $pdo->prepare("INSERT IGNORE INTO registration_events (registration_id, event_id) VALUES (:r, :e)");

    foreach ($events as $evtName) {
        $stmtEvent->execute([':name' => clean($evtName)]);
        $row = $stmtEvent->fetch();
        if ($row) $stmtLinkEvt->execute([':r' => $registrationId, ':e' => $row['id']]);
    }

    /* 4c. Paper Presentation extras */
    if ($isPaper) {
        $wc = countWords($abstractText);
        $pdo->prepare("
            INSERT INTO paper_submissions
                (registration_id, team_name, member_count, abstract_text, word_count)
            VALUES (:r, :t, :mc, :ab, :wc)
        ")->execute([':r'=>$registrationId,':t'=>$teamName,':mc'=>$memberCount,':ab'=>$abstractText,':wc'=>$wc]);

        $paperId    = (int)$pdo->lastInsertId();
        $stmtMember = $pdo->prepare("INSERT INTO paper_team_members (paper_id, member_number, member_name) VALUES (:p,:n,:name)");
        foreach ($memberNames as $idx => $name)
            $stmtMember->execute([':p'=>$paperId,':n'=>$idx+1,':name'=>clean($name)]);
    }

    $pdo->commit();

    jsonResponse(true, 'Registration successful!', [
        'registration_id' => $registrationId,
        'name'            => $fullName,
        'email'           => $email,
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    if (file_exists($uploadPath)) unlink($uploadPath);

    if ($e->getCode() === '23000')
        jsonResponse(false, 'This email or transaction ID is already registered.', [], 409);

    jsonResponse(false,
        APP_ENV === 'development' ? 'DB Error: ' . $e->getMessage() : 'Server error. Please try again.',
        [], 500);
}