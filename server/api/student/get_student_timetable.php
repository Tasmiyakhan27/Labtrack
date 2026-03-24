<?php
// server/api/student/get_student_timetable.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../middleware/auth.php'; 

try {
    // 1. SECURE IDENTIFICATION: Get student info from the Token
    $userData = verifyToken(); 
    $student_grade = $userData->grade;
    $student_batch = $userData->batch;

    // 2. STRICT SQL: Match Grade AND (Specific Batch OR 'All')
    // This prevents Batch 2 from seeing Batch 3 data.
    $sql = "SELECT * FROM timetables 
            WHERE grade = :grade 
            AND (batch = :batch OR batch = 'All' OR batch = 'All Batches')
            ORDER BY date ASC, start_time ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':grade' => $student_grade, 
        ':batch' => $student_batch
    ]);
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["message" => "Session Expired. Please login again."]);
}
?>