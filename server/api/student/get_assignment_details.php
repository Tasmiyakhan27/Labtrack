<?php
// 1. Headers (Allowing access from the React app)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

include_once '../../config/database.php';
include_once '../../middleware/auth.php'; 

// Verify the student is logged in
$userData = verifyToken(); 
$id = $_GET['id'] ?? null;

try {
    // A. FETCH ASSIGNMENT INFO FIRST
    $stmt = $conn->prepare("SELECT * FROM assignments WHERE id = ?");
    $stmt->execute([$id]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        echo json_encode(["success" => false, "message" => "Assignment not found"]);
        exit;
    }

    // B. GUARD 1: IP CHECK (Is the student in the lab?)
    $ALLOWED_NETWORKS = ['192.168.1.8', '127.0.0.1', '::1']; 
    $userIP = $_SERVER['REMOTE_ADDR'];

    $is_lab_ip = false;
    foreach ($ALLOWED_NETWORKS as $net) {
        if (strpos($userIP, $net) === 0) { $is_lab_ip = true; break; }
    }

    if (!$is_lab_ip) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "🚫 ACCESS DENIED: This workspace is only available on the College Lab Network."]);
        exit;
    }

    // C. GUARD 2: TIMETABLE CHECK (Is it the right time for this subject?)
    date_default_timezone_set('Asia/Kolkata');
    $day = date('l'); 
    $now = date('H:i:s');

    $timeSql = "SELECT id FROM timetables 
                WHERE grade = :grade AND batch = :batch AND subject_name = :subject 
                AND day_of_week = :day AND start_time <= :now AND end_time >= :now 
                LIMIT 1";
    
    $timeStmt = $conn->prepare($timeSql);
    $timeStmt->execute([
        ':grade'   => $userData->grade,
        ':batch'   => $userData->batch,
        ':subject' => $assignment['subject'],
        ':day'     => $day,
        ':now'     => $now
    ]);

    if (!$timeStmt->fetch()) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "⏳ LOCKED: You can only work on this during your scheduled $assignment[subject] lab slot."]);
        exit;
    }

    // IF BOTH PASS: Give the student the assignment data
    echo json_encode(["success" => true, "data" => $assignment]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server Error"]);
}