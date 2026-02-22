<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

include_once '../../config/database.php';

$student_id = $_GET['student_id'] ?? '';
$grade = $_GET['grade'] ?? '';
$batch = $_GET['batch'] ?? '';

if(empty($student_id) || empty($grade) || empty($batch)) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

$response = [
    "next_lab" => null,
    "assignments" => [],
    "scores" => [],
    "upcoming_labs" => []
];

try {
    
    // We look for a lab scheduled today or in the future
    $currentDay = date('l'); // e.g., "Monday"
    $currentTime = date('H:i:s');
    
    // Simple logic: Find the next lab for this batch
    $sqlTimer = "SELECT * FROM timetable 
                 WHERE grade = :grade AND batch = :batch 
                 AND day_of_week = :day
                 AND start_time > :time
                 ORDER BY start_time ASC LIMIT 1";
                 
    $stmt = $conn->prepare($sqlTimer);
    $stmt->execute([':grade' => $grade, ':batch' => $batch, ':day' => $currentDay, ':time' => $currentTime]);
    
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Calculate milliseconds difference for the frontend
        $labTime = strtotime(date('Y-m-d') . ' ' . $row['start_time']);
        $now = time();
        $diff = $labTime - $now; // seconds
        
        $response['next_lab'] = [
            "title" => $row['subject_name'],
            "seconds_left" => $diff,
            "start_time" => $row['start_time']
        ];
    }

    // ---------------------------------------------------------
    // 2. GET ASSIGNMENTS OVERVIEW (For Progress Cards)
    // ---------------------------------------------------------
    $sqlAssign = "
        SELECT a.title, a.deadline,
               CASE WHEN s.id IS NOT NULL THEN 'Submitted' 
                    WHEN a.deadline < NOW() THEN 'Overdue'
                    ELSE 'Pending' END as status
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = :sid
        WHERE a.grade = :grade AND a.batch = :batch
        ORDER BY a.deadline ASC LIMIT 3
    ";
    
    $stmt = $conn->prepare($sqlAssign);
    $stmt->execute([':grade' => $grade, ':batch' => $batch, ':sid' => $student_id]);
    $response['assignments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. GET EXAM SCORES
    /*$sqlScores = "SELECT subject_name, score_obtained, total_score, feedback 
                  FROM exam_scores 
                  WHERE student_id = :sid 
                  ORDER BY published_date DESC LIMIT 3";
    $stmt = $conn->prepare($sqlScores);
    $stmt->execute([':sid' => $student_id]);
    $response['scores'] = $stmt->fetchAll(PDO::FETCH_ASSOC);*/

    // 4. GET UPCOMING LABS LIST
    $sqlLabs = "SELECT subject_name, subject_code, start_time, room_number, day_of_week
                FROM timetable
                WHERE grade = :grade AND batch = :batch
                LIMIT 3";
    $stmt = $conn->prepare($sqlLabs);
    $stmt->execute([':grade' => $grade, ':batch' => $batch]);
    $response['upcoming_labs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);


    echo json_encode(["success" => true, "data" => $response]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>