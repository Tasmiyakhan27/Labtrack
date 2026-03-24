<?php
// server/api/faculty/dashboard_data.php

// 1. ENABLE ERROR REPORTING (Helps debug 500 errors)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
// --- NEW: Added Authorization to allowed headers ---
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- NEW: Handle Preflight Requests for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. INCLUDE DATABASE & MIDDLEWARE
if (!file_exists('../../config/database.php')) {
    http_response_code(500);
    echo json_encode(["message" => "Critical: database.php not found."]);
    exit();
}
require '../../config/database.php';
// --- NEW: SECURE MIDDLEWARE ---
include_once '../../middleware/auth.php'; 

// --- NEW: VERIFY TOKEN & GET REAL ID ---
$userData = verifyToken(); 
$faculty_id = $userData->id; 

try {
    $response = [];

    // --- METRIC 1: TOTAL STUDENTS ---
    // (Count distinct students who have submitted work to this faculty)
    $sqlStudents = "SELECT COUNT(DISTINCT s.student_id) as count 
                    FROM submissions s
                    JOIN assignments a ON s.assignment_id = a.id
                    WHERE a.faculty_id = ?";
    $stmt = $conn->prepare($sqlStudents);
    $stmt->execute([$faculty_id]);
    $response['total_students'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // --- METRIC 2: ACTIVE ASSIGNMENTS ---
    // (Assignments where deadline is in the future)
    $sqlActive = "SELECT COUNT(*) as count FROM assignments 
                  WHERE faculty_id = ? AND deadline >= NOW()";
    $stmt = $conn->prepare($sqlActive);
    $stmt->execute([$faculty_id]);
    $response['active_assignments'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // --- METRIC 3: PENDING REVIEWS ---
    // (Submissions that haven't been graded yet)
    $sqlPending = "SELECT COUNT(*) as count 
                   FROM submissions s
                   JOIN assignments a ON s.assignment_id = a.id
                   WHERE a.faculty_id = ? AND s.marks IS NULL";
    $stmt = $conn->prepare($sqlPending);
    $stmt->execute([$faculty_id]);
    $response['pending_reviews'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // --- METRIC 4: CLASSES TODAY ---
    $current_day = date('l'); // e.g., "Monday"
    $sqlClasses = "SELECT * FROM timetables 
                   WHERE faculty_id = ? AND day_of_week = ? 
                   ORDER BY start_time ASC";
    $stmt = $conn->prepare($sqlClasses);
    $stmt->execute([$faculty_id, $current_day]);
    $response['today_classes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- ACTIVITY FEED (RECENT SUBMISSIONS) ---
    // Instead of a separate 'activity_logs' table, we just pull the latest 5 submissions
    $sqlFeed = "SELECT s.submitted_at as created_at, st.full_name as student, a.title as assignment
                FROM submissions s
                JOIN students st ON s.student_id = st.id
                JOIN assignments a ON s.assignment_id = a.id
                WHERE a.faculty_id = ?
                ORDER BY s.submitted_at DESC LIMIT 5";
    $stmt = $conn->prepare($sqlFeed);
    $stmt->execute([$faculty_id]);
    $recent_activity = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the feed to match Frontend expectations
    $formatted_feed = [];
    foreach($recent_activity as $act) {
        $formatted_feed[] = [
            "message" => "{$act['student']} submitted {$act['assignment']}",
            "type" => "submission",
            "created_at" => $act['created_at']
        ];
    }
    $response['recent_activity'] = $formatted_feed;

    // RETURN JSON
    echo json_encode($response);

} catch (PDOException $e) {
    http_response_code(500);
    // Generic error message for deployment security
    echo json_encode(["message" => "Database Error occurred."]);
}
?>