<?php
// server/api/student/get_assignment_details.php

// 1. HANDLE CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// 2. HANDLE PREFLIGHT
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../config/database.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(["success" => false, "message" => "Missing Assignment ID"]);
    exit;
}

try {
    // 3. Fetch Assignment Data
    $stmt = $conn->prepare("SELECT * FROM assignments WHERE id = ?");
    $stmt->execute([$id]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        echo json_encode(["success" => false, "message" => "Assignment not found"]);
        exit;
    }

    // ======================================================
    // 4. STRICT SECURITY CHECKS (ACTIVE)
    // ======================================================

    // --- A. IP ADDRESS CHECK ---
    // Update this list with your actual Lab IP range
    $ALLOWED_NETWORKS = ['192.168.1.6','10.249.232.115', '127.0.0.1', '::1']; 
    $userIP = $_SERVER['REMOTE_ADDR'];

    function isAllowedIP($ip, $allowed_networks) {
        foreach ($allowed_networks as $network) {
            // Check if user IP starts with the allowed network prefix
            if (strpos($ip, $network) === 0) return true;
        }
        return false;
    }

    if (!isAllowedIP($userIP, $ALLOWED_NETWORKS)) {
        echo json_encode([
            "success" => false, 
            "message" => "🚫 Location Restricted: You must be connected to the College Lab Network ($userIP)."
        ]);
        exit;
    }

    // --- B. TIMETABLE CHECK ---
    date_default_timezone_set('Asia/Kolkata'); 
    $currentDate = date('Y-m-d'); 
    $currentTime = date('H:i:s'); 

    // Check if class is scheduled RIGHT NOW
    $sql = "SELECT id FROM timetables 
            WHERE grade = :grade 
            AND batch = :batch
            AND subject_name = :subject
            AND date = :todayDate       
            AND start_time <= :now 
            AND end_time >= :now";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':grade'    => $assignment['grade'],
        ':batch'    => $assignment['batch'],
        ':subject'  => $assignment['subject'],
        ':todayDate'=> $currentDate,
        ':now'      => $currentTime
    ]);

    $activeSession = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$activeSession) {
        echo json_encode([
            "success" => false, 
            "message" => "⏳ Locked: This assignment is only available during the scheduled lab time."
        ]);
        exit;
    }

    // 5. Return Success (Only if checks pass)
    echo json_encode(["success" => true, "data" => $assignment]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server Error: " . $e->getMessage()]);
}
?>