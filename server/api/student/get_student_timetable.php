<?php
// server/api/student/get_student_timetable.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

include_once '../../config/database.php';

$grade = $_GET['grade'] ?? '';
$batch = $_GET['batch'] ?? '';

if(empty($grade) || empty($batch)) {
    echo json_encode([]);
    exit;
}

try {
    // UPDATED: Order by DATE first, then START_TIME
    // This ensures classes are listed chronologically
    $sql = "SELECT * FROM timetables 
            WHERE grade = :grade 
            AND batch = :batch 
            ORDER BY date ASC, start_time ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':grade' => $grade, ':batch' => $batch]);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "DB Error: " . $e->getMessage()]);
}
?>