<?php
// server/api/student/get_student_assignments.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

include_once '../../config/database.php';

$student_id = $_GET['student_id'] ?? '';
$grade = $_GET['grade'] ?? '';
$batch = $_GET['batch'] ?? '';

if(empty($student_id) || empty($grade) || empty($batch)) {
    echo json_encode(["success" => false, "message" => "Missing student details."]);
    exit;
}

try {
    // 1. SMART GRADE MATCHING
    // This fixes the issue where Faculty saves "1st Year" but Student is "1"
    $grade_variants = [$grade]; // Start with the exact value
    
    if ($grade == '1' || $grade == '1st Year') {
        $grade_variants = ['1', '1st Year', 'FY', 'First Year'];
    } elseif ($grade == '2' || $grade == '2nd Year') {
        $grade_variants = ['2', '2nd Year', 'SY', 'Second Year'];
    } elseif ($grade == '3' || $grade == '3rd Year') {
        $grade_variants = ['3', '3rd Year', 'TY', 'Third Year'];
    } elseif ($grade == '4' || $grade == '4th Year') {
        $grade_variants = ['4', '4th Year', 'Final Year'];
    }

    // Convert array to comma-separated string for SQL (e.g., "'1','1st Year','FY'")
    $grade_list = "'" . implode("','", $grade_variants) . "'";

    // 2. THE QUERY
    // matches ANY valid grade name AND (Exact Batch OR 'All')
    $sql = "
        SELECT 
            a.id, a.title, a.subject, a.description, 
            a.deadline, a.type, a.attachment_path, a.batch,
            s.status AS submission_status,
            s.marks
        FROM assignments a
        LEFT JOIN submissions s 
            ON a.id = s.assignment_id AND s.student_id = :sid
        WHERE a.grade IN ($grade_list) 
          AND (a.batch = :batch OR a.batch = 'All' OR a.batch = 'All Batches')
        ORDER BY a.deadline ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':sid'   => $student_id,
        ':batch' => $batch
    ]);
    
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Process Status (Pending/Missed)
    $current_time = new DateTime();
    foreach($assignments as &$row) {
        $deadline = new DateTime($row['deadline']);
        
        if ($row['submission_status']) {
            $row['display_status'] = $row['submission_status'];
        } else {
            if ($current_time > $deadline) {
                $row['display_status'] = 'Missed';
            } else {
                $row['display_status'] = 'Pending';
            }
        }
    }

    echo json_encode(["success" => true, "data" => $assignments]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>