<?php
/* =============================================================
   INTELLEXA '26 – Admin Panel
   File: admin.php
   ============================================================= */
require_once 'config.php';
session_start();

$loginError = '';

if (isset($_GET['logout'])) { session_destroy(); header('Location: admin.php'); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_login'])) {
    if ($_POST['username'] === ADMIN_USER && $_POST['password'] === ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: admin.php'); exit;
    } else { $loginError = 'Invalid username or password.'; }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status']) && isset($_SESSION['admin_logged_in'])) {
    $regId     = (int)$_POST['reg_id'];
    $newStatus = in_array($_POST['new_status'], ['pending','confirmed','rejected']) ? $_POST['new_status'] : 'pending';
    getDB()->prepare("UPDATE registrations SET status=:s WHERE id=:id")->execute([':s'=>$newStatus,':id'=>$regId]);
    header('Location: admin.php?updated=1'); exit;
}

$registrations = [];
$stats = ['total'=>0,'confirmed'=>0,'pending'=>0,'rejected'=>0];

if (isset($_SESSION['admin_logged_in'])) {
    $pdo = getDB();
    $stats = $pdo->query("
        SELECT COUNT(*) AS total,
               SUM(status='confirmed') AS confirmed,
               SUM(status='pending')   AS pending,
               SUM(status='rejected')  AS rejected
        FROM registrations")->fetch();

    $filterStatus = $_GET['status'] ?? 'all';
    $search       = clean($_GET['search'] ?? '');
    $where = []; $params = [];

    if ($filterStatus !== 'all') { $where[] = 'r.status=:status'; $params[':status'] = $filterStatus; }
    if (!empty($search))         { $where[] = '(r.full_name LIKE :s OR r.email LIKE :s OR r.college_name LIKE :s)'; $params[':s'] = '%'.$search.'%'; }
    $whereSQL = $where ? 'WHERE '.implode(' AND ',$where) : '';

    $stmt = $pdo->prepare("
        SELECT r.id, r.full_name, r.year_of_study, r.degree, r.department,
               r.college_name, r.college_location, r.email, r.phone, r.referral_code,
               GROUP_CONCAT(e.event_name ORDER BY e.event_name SEPARATOR ', ') AS events_selected,
               r.transaction_id, r.screenshot_path, r.status, r.registered_at,
               ps.team_name, ps.member_count, ps.word_count
        FROM registrations r
        LEFT JOIN registration_events re ON re.registration_id = r.id
        LEFT JOIN events e               ON e.id = re.event_id
        LEFT JOIN paper_submissions ps   ON ps.registration_id = r.id
        $whereSQL GROUP BY r.id ORDER BY r.registered_at DESC");
    $stmt->execute($params);
    $registrations = $stmt->fetchAll();
}

function statusBadge(string $s): string {
    $map = ['confirmed'=>'#16a34a','pending'=>'#d97706','rejected'=>'#dc2626'];
    $c = $map[$s] ?? '#888';
    return "<span style='background:$c;color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase'>$s</span>";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>INTELLEXA '26 – Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet"/>
<style>
:root{--navy:#0f3260;--navy2:#1a4f8a;--blue:#3b82c4;--glow:#38bdf8;--bg:#ddeeff;--white:#fff;--text:#0d2a4a;--muted:#5b7fa6;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
.topbar{background:linear-gradient(135deg,var(--navy),var(--navy2));border-bottom:3px solid var(--glow);padding:14px 32px;display:flex;align-items:center;justify-content:space-between;}
.topbar h1{font-family:'Orbitron',sans-serif;font-size:16px;color:#fff;letter-spacing:3px;}
.logout-btn{padding:7px 18px;background:rgba(56,189,248,0.15);color:#93c5fd;border:1px solid var(--glow);border-radius:8px;text-decoration:none;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;transition:.2s;}
.logout-btn:hover{background:rgba(56,189,248,0.3);}
/* Login */
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 60px);padding:20px;}
.login-card{background:#fff;border-radius:16px;padding:40px 44px;width:100%;max-width:400px;box-shadow:0 16px 50px rgba(26,79,138,0.18),0 0 0 2px rgba(59,130,196,0.15);}
.login-card h2{font-family:'Orbitron',sans-serif;font-size:15px;color:var(--navy);letter-spacing:2px;margin-bottom:26px;text-align:center;}
.lbl{font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:var(--navy);letter-spacing:1.5px;text-transform:uppercase;display:block;margin-bottom:5px;}
.inp{width:100%;padding:11px 13px;border:2px solid rgba(59,130,196,0.25);border-radius:9px;font-size:14px;color:var(--text);background:#f0f8ff;outline:none;margin-bottom:16px;transition:.2s;}
.inp:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(59,130,196,0.12);}
.login-btn{width:100%;padding:12px;background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border:2px solid var(--glow);border-radius:9px;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:.2s;}
.login-btn:hover{background:linear-gradient(135deg,var(--blue),var(--navy2));}
.login-err{color:#dc2626;font-size:12px;font-weight:600;margin-bottom:12px;text-align:center;}
/* Dashboard */
.admin-wrap{padding:28px 32px;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:26px;}
.stat-card{padding:18px 22px;border-radius:12px;background:#fff;border:1px solid rgba(59,130,196,0.2);text-align:center;box-shadow:0 4px 12px rgba(59,130,196,0.08);}
.stat-num{font-family:'Orbitron',sans-serif;font-size:26px;font-weight:900;color:var(--navy2);}
.stat-lbl{font-family:'Rajdhani',sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-top:3px;}
.toolbar{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;}
.toolbar input,.toolbar select{padding:8px 12px;border:2px solid rgba(59,130,196,0.25);border-radius:8px;background:#fff;color:var(--text);font-size:13px;outline:none;font-family:'Rajdhani',sans-serif;}
.toolbar input:focus,.toolbar select:focus{border-color:var(--blue);}
.toolbar button{padding:8px 20px;background:var(--navy2);color:#fff;border:none;border-radius:8px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;cursor:pointer;}
.toolbar button:hover{background:var(--blue);}
.table-wrap{overflow-x:auto;border-radius:12px;box-shadow:0 4px 16px rgba(59,130,196,0.1);border:1px solid rgba(59,130,196,0.15);}
table{width:100%;border-collapse:collapse;font-size:13px;}
thead{background:linear-gradient(135deg,var(--navy),var(--navy2));}
thead th{padding:12px 13px;text-align:left;font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;white-space:nowrap;}
tbody tr{background:#fff;border-bottom:1px solid rgba(59,130,196,0.08);transition:.15s;}
tbody tr:nth-child(even){background:#f0f8ff;}
tbody tr:hover{background:#dbeeff;}
tbody td{padding:10px 13px;color:var(--text);vertical-align:middle;}
.view-link{display:inline-block;padding:3px 10px;background:rgba(59,130,196,0.1);border:1px solid rgba(59,130,196,0.3);border-radius:6px;color:var(--blue);font-size:11px;text-decoration:none;font-weight:600;}
.view-link:hover{background:rgba(59,130,196,0.2);}
.sf{display:flex;align-items:center;gap:5px;}
.sf select{padding:3px 7px;border:1px solid rgba(59,130,196,0.25);border-radius:6px;background:#f0f8ff;color:var(--text);font-size:11px;outline:none;}
.sf button{padding:3px 9px;background:var(--navy);color:#fff;border:1px solid var(--glow);border-radius:5px;font-size:11px;cursor:pointer;font-weight:700;}
.sf button:hover{background:var(--blue);}
.no-data{text-align:center;padding:36px;color:var(--muted);font-size:14px;}
.alert-ok{padding:9px 18px;background:rgba(22,163,74,0.1);border:1px solid #16a34a;border-radius:8px;color:#16a34a;font-size:13px;margin-bottom:18px;}
</style>
</head>
<body>
<div class="topbar">
  <h1>INTELLEXA '26 — ADMIN</h1>
  <?php if (isset($_SESSION['admin_logged_in'])): ?>
    <a href="admin.php?logout=1" class="logout-btn">Logout</a>
  <?php endif; ?>
</div>

<?php if (!isset($_SESSION['admin_logged_in'])): ?>
<div class="login-wrap">
  <div class="login-card">
    <h2>Admin Login</h2>
    <?php if ($loginError): ?><div class="login-err"><?= htmlspecialchars($loginError) ?></div><?php endif; ?>
    <form method="POST">
      <label class="lbl" for="username">Username</label>
      <input class="inp" type="text" id="username" name="username" placeholder="Admin username" required />
      <label class="lbl" for="password">Password</label>
      <input class="inp" type="password" id="password" name="password" placeholder="Password" required />
      <button class="login-btn" type="submit" name="admin_login">LOGIN →</button>
    </form>
  </div>
</div>

<?php else: ?>
<div class="admin-wrap">
  <?php if (isset($_GET['updated'])): ?>
    <div class="alert-ok">✔ Status updated successfully.</div>
  <?php endif; ?>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-num"><?=(int)$stats['total']?></div><div class="stat-lbl">Total</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#16a34a"><?=(int)$stats['confirmed']?></div><div class="stat-lbl">Confirmed</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#d97706"><?=(int)$stats['pending']?></div><div class="stat-lbl">Pending</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#dc2626"><?=(int)$stats['rejected']?></div><div class="stat-lbl">Rejected</div></div>
  </div>

  <form class="toolbar" method="GET">
    <input type="text" name="search" value="<?=htmlspecialchars($_GET['search']??'')?>" placeholder="Search name / email / college…" style="flex:1;min-width:200px;" />
    <select name="status">
      <option value="all"       <?=$filterStatus==='all'      ?'selected':''?>>All</option>
      <option value="pending"   <?=$filterStatus==='pending'  ?'selected':''?>>Pending</option>
      <option value="confirmed" <?=$filterStatus==='confirmed'?'selected':''?>>Confirmed</option>
      <option value="rejected"  <?=$filterStatus==='rejected' ?'selected':''?>>Rejected</option>
    </select>
    <button type="submit">Filter</button>
    <a href="admin.php" style="padding:8px 16px;background:#fff;border:1px solid rgba(59,130,196,0.3);border-radius:8px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;text-decoration:none;">Reset</a>
  </form>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th><th>Name</th><th>Year</th><th>Degree</th><th>Dept</th>
          <th>College</th><th>Location</th><th>Email</th><th>Phone</th>
          <th>Referral</th><th>Events</th><th>Txn ID</th><th>Screenshot</th>
          <th>Paper Team</th><th>Date</th><th>Status</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($registrations)): ?>
          <tr><td colspan="17" class="no-data">No registrations found.</td></tr>
        <?php else: foreach ($registrations as $row): ?>
          <tr>
            <td><?=(int)$row['id']?></td>
            <td><?=htmlspecialchars($row['full_name'])?></td>
            <td><?=htmlspecialchars($row['year_of_study'])?></td>
            <td><?=htmlspecialchars($row['degree'])?></td>
            <td><?=htmlspecialchars($row['department'])?></td>
            <td><?=htmlspecialchars($row['college_name'])?></td>
            <td><?=htmlspecialchars($row['college_location'])?></td>
            <td><?=htmlspecialchars($row['email'])?></td>
            <td><?=htmlspecialchars($row['phone'])?></td>
            <td><?=htmlspecialchars($row['referral_code']??'—')?></td>
            <td><?=htmlspecialchars($row['events_selected']??'—')?></td>
            <td><?=htmlspecialchars($row['transaction_id'])?></td>
            <td><?php if($row['screenshot_path']): ?><a class="view-link" href="<?=htmlspecialchars($row['screenshot_path'])?>" target="_blank">View</a><?php else: echo '—'; endif; ?></td>
            <td><?php if($row['team_name']): ?><?=htmlspecialchars($row['team_name'])?><br><small style="color:var(--muted)"><?=(int)$row['member_count']?> members · <?=(int)$row['word_count']?> words</small><?php else: echo '—'; endif; ?></td>
            <td style="white-space:nowrap"><?=date('d M y H:i',strtotime($row['registered_at']))?></td>
            <td><?=statusBadge($row['status'])?></td>
            <td>
              <form class="sf" method="POST">
                <input type="hidden" name="reg_id" value="<?=(int)$row['id']?>" />
                <select name="new_status">
                  <option value="pending"   <?=$row['status']==='pending'   ?'selected':''?>>Pending</option>
                  <option value="confirmed" <?=$row['status']==='confirmed' ?'selected':''?>>Confirmed</option>
                  <option value="rejected"  <?=$row['status']==='rejected'  ?'selected':''?>>Rejected</option>
                </select>
                <button type="submit" name="update_status">Save</button>
              </form>
            </td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</div>
<?php endif; ?>
</body>
</html>
