<?php
// server/api/student/student_dashboard.php (Update filename as needed)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
// --- NEW: Added Authorization to allowed headers ---
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- NEW: Handle Preflight Requests for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
// --- NEW: SECURE MIDDLEWARE ---
include_once '../../middleware/auth.php'; 

// --- NEW: VERIFY TOKEN & GET REAL ID ---
$userData = verifyToken(); 
$verified_student_id = $userData->id; 

// Keep the Indian Timezone
date_default_timezone_set('Asia/Kolkata'); 

// We no longer trust $_GET['student_id']
$student_id = $verified_student_id; 
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
    // FIX 1: We now grab the exact Date, not just the Day of the week
    $currentDate = date('Y-m-d'); 
    $currentTime = date('H:i:s');
    
    // --- 1. GET NEXT LAB TODAY (Fixed to check actual DATE) ---
    $sqlTimer = "SELECT * FROM timetables 
                 WHERE grade = :grade AND batch = :batch 
                 AND date = :currentDate
                 AND start_time > :currentTime
                 ORDER BY start_time ASC LIMIT 1";
                 
    $stmt = $conn->prepare($sqlTimer);
    $stmt->execute([
        ':grade' => $grade, 
        ':batch' => $batch, 
        ':currentDate' => $currentDate, 
        ':currentTime' => $currentTime
    ]);
    
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $labTime = strtotime($row['date'] . ' ' . $row['start_time']);
        $now = time();
        $diff = $labTime - $now; 
        
        $response['next_lab'] = [
            "title" => $row['subject_name'],
            "seconds_left" => $diff,
            "start_time" => $row['start_time']
        ];
    }

    // --- 2. GET ASSIGNMENTS OVERVIEW ---
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

    // --- 3. GET EXAM SCORES ---
    $sqlScores = "
        SELECT 
            a.subject AS subject_name, 
            s.marks AS score_obtained, 
            a.max_marks AS total_score, 
            s.feedback 
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.student_id = :sid AND s.marks IS NOT NULL AND s.marks != ''
        ORDER BY s.submitted_at DESC LIMIT 3
    ";
                  
    $stmt = $conn->prepare($sqlScores);
    $stmt->execute([':sid' => $student_id]);
    $response['scores'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 4. GET UPCOMING LABS LIST (Fixed to only show FUTURE labs) ---
    // This checks if the date is in the future, OR if it is today but hasn't ended yet
    $sqlLabs = "SELECT subject_name, subject_code, start_time, room_number, day_of_week, date
                FROM timetables
                WHERE grade = :grade AND batch = :batch
                AND (date > :currentDate OR (date = :currentDate AND end_time >= :currentTime))
                ORDER BY date ASC, start_time ASC
                LIMIT 3";
                
    $stmt = $conn->prepare($sqlLabs);
    $stmt->execute([
        ':grade' => $grade, 
        ':batch' => $batch,
        ':currentDate' => $currentDate,
        ':currentTime' => $currentTime
    ]);
    $response['upcoming_labs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $response]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>