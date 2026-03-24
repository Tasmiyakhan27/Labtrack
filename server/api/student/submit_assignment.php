<?php
// server/api/submit_assignment.php

// 1. MANDATORY CORS HEADERS (Must be at the absolute top)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// 2. THE HANDSHAKE (Fixes the "Preflight" error in your screenshot)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); // Stop here for the preflight check
}

// 3. NOW PROCEED WITH LOGIC
include_once '../../config/database.php';
include_once '../../middleware/auth.php'; 

try {
    // Identify student from token
    $userData = verifyToken(); 
    $student_id = $userData->id;
    $student_grade = $userData->grade;
    $student_batch = $userData->batch;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Session Expired."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $assignment_id = $_POST['assignment_id'] ?? null;
    $link_url      = $_POST['link'] ?? null;
    $code_content  = $_POST['code'] ?? null; 
    
    // File Handling
    $file_path = null;
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/submissions/'; 
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        
        $fileName = time() . '_' . $student_id . '_' . basename($_FILES['file']['name']);
        if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadDir . $fileName)) {
            $file_path = 'uploads/submissions/' . $fileName;
        }
    }

    if ($assignment_id) {
        try {
            $conn->beginTransaction();

            // Fetch deadline to determine status
            $stmt = $conn->prepare("SELECT deadline FROM assignments WHERE id = ?");
            $stmt->execute([$assignment_id]);
            $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
            $status = (new DateTime() > new DateTime($assignment['deadline'])) ? 'Late' : 'Submitted';

            // Insert Submission
            $sql = "INSERT INTO submissions (assignment_id, student_id, file_path, link_url, code_content, status) 
                    VALUES (:aid, :sid, :file, :link, :code, :status)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':aid' => $assignment_id,
                ':sid' => $student_id,
                ':file' => $file_path,
                ':link' => $link_url,
                ':code' => $code_content,
                ':status' => $status
            ]);

            // Auto-Attendance Check
            $timeSql = "SELECT id, subject_name FROM timetables 
                        WHERE grade = :grade AND batch = :batch AND day_of_week = :day 
                        AND start_time <= :time AND end_time >= :time LIMIT 1";
            $timeStmt = $conn->prepare($timeSql);
            $timeStmt->execute([
                ':grade' => $student_grade, ':batch' => $student_batch, 
                ':day' => date('l'), ':time' => date('H:i:s')
            ]);
            $activeClass = $timeStmt->fetch(PDO::FETCH_ASSOC);

            if ($activeClass) {
                $attSql = "INSERT IGNORE INTO attendance (student_id, timetable_id, date, status) VALUES (?, ?, ?, 'Present')";
                $conn->prepare($attSql)->execute([$student_id, $activeClass['id'], date('Y-m-d')]);
            }

            $conn->commit();
            echo json_encode(["success" => true, "message" => "Successfully Submitted!"]);

        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error occurred."]);
        }
    }
}
?>