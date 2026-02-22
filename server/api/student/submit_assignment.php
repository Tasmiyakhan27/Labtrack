<?php
// server/api/submit_assignment.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/database.php';

// 1. CONFIGURATION: COLLEGE LAB SECURITY
// Only allow submissions from these IP prefixes.
//  '::1' allow you to test on the server machine itself.
// Replace '192.168.1' with your actual College Lab IP prefix.
$ALLOWED_NETWORKS = ['192.168.1', '192.168.1.5', '127.0.0.1', '::1']; 

// Set this to TRUE to enforce the IP check. 
// Set to FALSE if you are testing from home/mobile.
//$ENFORCE_LAB_IP = true; 
$ENFORCE_LAB_IP = false;

function isAllowedIP($ip, $allowed_networks) {
    foreach ($allowed_networks as $network) {
        if (strpos($ip, $network) === 0) return true;
    }
    return false;
}

// Response Wrapper
$response = ["success" => false, "message" => "Unknown error"];

// 2. REQUEST HANDLING
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // --- A. IP CHECK ---
    $userIP = $_SERVER['REMOTE_ADDR'];
    if ($ENFORCE_LAB_IP && !isAllowedIP($userIP, $ALLOWED_NETWORKS)) {
        http_response_code(403); // Forbidden
        echo json_encode([
            "success" => false, 
            "message" => "Access Denied: You must be connected to the College Lab Network to submit. Your IP: $userIP"
        ]);
        exit(); 
    }

    // --- B. GET INPUT DATA ---
    $assignment_id = $_POST['assignment_id'] ?? null;
    $student_id    = $_POST['student_id'] ?? null;
    $link_url      = $_POST['link'] ?? null;
    $code_content  = $_POST['code'] ?? null; // From Piston Compiler
    
    // --- C. FILE UPLOAD HANDLING ---
    $file_path = null;
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/submissions/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        
        // Clean filename to prevent issues
        $cleanName = basename($_FILES['file']['name']);
        $fileName = time() . '_' . $cleanName;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadDir . $fileName)) {
            $file_path = 'uploads/submissions/' . $fileName;
        }
    }

    // --- D. DATABASE OPERATIONS ---
    if ($assignment_id && $student_id) {
        try {
            $conn->beginTransaction(); // Start Safety Transaction

            // 1. Check Deadline (Mark as Late if needed)
            $stmt = $conn->prepare("SELECT deadline FROM assignments WHERE id = ?");
            $stmt->execute([$assignment_id]);
            $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $status = 'Submitted';
            if ($assignment && new DateTime() > new DateTime($assignment['deadline'])) {
                $status = 'Late';
            }

            // 2. Insert Submission Record
            // Here we do simple insert for history.
            $sql = "INSERT INTO submissions 
                    (assignment_id, student_id, file_path, link_url, code_content, status) 
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

            // 3. SMART ATTENDANCE LOGIC
            // Only mark present if submitting during an active lab session
            
            // Get Student Info
            $stuStmt = $conn->prepare("SELECT grade, batch FROM students WHERE id = ?");
            $stuStmt->execute([$student_id]);
            $student = $stuStmt->fetch(PDO::FETCH_ASSOC);

            $attendanceMsg = "";

            if ($student) {
                $currentDay  = date('l');      // e.g., "Monday"
                $currentTime = date('H:i:s');  // e.g., "14:30:00"

                // Check Timetable
                $timeSql = "SELECT id, subject_name FROM timetables 
                            WHERE grade = :grade 
                            AND batch = :batch 
                            AND day_of_week = :day 
                            AND start_time <= :time 
                            AND end_time >= :time 
                            LIMIT 1";
                
                $timeStmt = $conn->prepare($timeSql);
                $timeStmt->execute([
                    ':grade' => $student['grade'], 
                    ':batch' => $student['batch'], 
                    ':day'   => $currentDay, 
                    ':time'  => $currentTime
                ]);
                $activeClass = $timeStmt->fetch(PDO::FETCH_ASSOC);

                if ($activeClass) {
                    // Active Class Found! Mark Present.
                    $today = date('Y-m-d');
                    
                    // INSERT IGNORE prevents crashing if they submit twice in same class
                    $attSql = "INSERT IGNORE INTO attendance (student_id, timetable_id, date, status) 
                               VALUES (?, ?, ?, 'Present')";
                    $attStmt = $conn->prepare($attSql);
                    $attStmt->execute([$student_id, $activeClass['id'], $today]);
                    
                    $attendanceMsg = " & Marked Present for " . $activeClass['subject_name'];
                }
            }

            $conn->commit(); // Save All
            
            $response = [
                "success" => true, 
                "message" => "Work Submitted Successfully" . $attendanceMsg . "!"
            ];

        } catch (Exception $e) {
            $conn->rollBack(); // Undo All on Error
            $response["message"] = "Database Error: " . $e->getMessage();
        }
    } else {
        $response["message"] = "Missing Assignment ID or Student ID.";
    }
}

echo json_encode($response);
?>