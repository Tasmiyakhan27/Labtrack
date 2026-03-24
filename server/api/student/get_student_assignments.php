<?php
// server/api/student/get_student_assignments.php

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
    $student_id = $userData->id;

    // 2. SMART GRADE VARIANTS
    $grade_variants = [$student_grade];
    if (str_contains($student_grade, '1')) $grade_variants = ['1', '1st Year', 'FY'];
    elseif (str_contains($student_grade, '2')) $grade_variants = ['2', '2nd Year', 'SY'];
    elseif (str_contains($student_grade, '3')) $grade_variants = ['3', '3rd Year', 'TY'];
    
    $grade_list = "'" . implode("','", $grade_variants) . "'";

    // 3. STRICT SQL: Joins with submissions but filters by Token Batch
    $sql = "SELECT a.*, s.status AS submission_status, s.marks
            FROM assignments a
            LEFT JOIN submissions s 
                ON a.id = s.assignment_id AND s.student_id = :sid
            WHERE a.grade IN ($grade_list) 
            AND (a.batch = :batch OR a.batch = 'All' OR a.batch = 'All Batches')
            ORDER BY a.deadline ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':sid'   => $student_id,
        ':batch' => $student_batch
    ]);
    
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process "Missed" vs "Pending" status
    $now = new DateTime();
    foreach($assignments as &$row) {
        if (!$row['submission_status']) {
            $row['display_status'] = ($now > new DateTime($row['deadline'])) ? 'Missed' : 'Pending';
        } else {
            $row['display_status'] = $row['submission_status'];
        }
    }

    echo json_encode(["success" => true, "data" => $assignments]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized Access"]);
}
?>