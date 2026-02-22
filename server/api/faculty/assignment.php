<?php
// server/api/faculty/assignment.php

// 1. ENABLE DEBUGGING (Shows the real error instead of "500")
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 2. CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Database Connection
$db_path = __DIR__ . '/../../config/database.php';

if (file_exists($db_path)) {
    require_once $db_path;
} else {
    // Fallback if config is missing
    require_once __DIR__ . '/../../db_connect.php'; 
}

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
//  POST REQUEST: Create Assignment
// ==========================================
if ($method === 'POST') {

    // Check if data is arriving
    if (empty($_POST) && empty($_FILES)) {
        http_response_code(400);
        echo json_encode(["error" => "No data received. (Check Axios Headers)"]);
        exit();
    }

    $faculty_id = $_POST['faculty_id'] ?? null;
    $title = $_POST['title'] ?? '';

    if (!$faculty_id) {
        http_response_code(403);
        echo json_encode(["error" => "Session Error: User ID missing. Log out and back in."]);
        exit();
    }
    
    // Validate Required Fields
    if (!$title) {
        http_response_code(400);
        echo json_encode(["error" => "Title is required"]);
        exit();
    }

    // Get Basic Fields
    $desc = $_POST['description'] ?? '';
    $subject = $_POST['subject'] ?? '';
    $grade = $_POST['grade'] ?? '1st Year';
    $batch = $_POST['batch'] ?? 'B1';
    $deadline = $_POST['deadline'] ?? date('Y-m-d H:i:s');
    $type = $_POST['type'] ?? 'Practical';

    // --- NEW: Get Min/Max Marks ---
    $min_marks = isset($_POST['min_marks']) ? (int)$_POST['min_marks'] : 0;
    $max_marks = isset($_POST['max_marks']) ? (int)$_POST['max_marks'] : 100;

    // Handle File Upload
    $attachment_path = null;
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $target_dir = __DIR__ . "/../../uploads/resources/";
        
        // Attempt to create directory
        if (!is_dir($target_dir)) {
            if (!mkdir($target_dir, 0777, true)) {
                http_response_code(500);
                echo json_encode(["error" => "Failed to create upload directory"]);
                exit();
            }
        }
        
        $file_name = time() . "_" . basename($_FILES['attachment']['name']);
        $target_file = $target_dir . $file_name;
        
        if (move_uploaded_file($_FILES['attachment']['tmp_name'], $target_file)) {
            $attachment_path = "uploads/resources/" . $file_name;
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to move uploaded file"]);
            exit();
        }
    }

    // Insert into DB (Updated with min_marks and max_marks)
    try {
        $sql = "INSERT INTO assignments 
                (faculty_id, title, description, subject, grade, batch, deadline, type, attachment_path, min_marks, max_marks)
                VALUES 
                (:fid, :title, :desc, :sub, :grade, :batch, :dead, :type, :file, :min, :max)";
        
        $stmt = $conn->prepare($sql);
        
        $stmt->execute([
            ':fid'   => $faculty_id,
            ':title' => $title,
            ':desc'  => $desc,
            ':sub'   => $subject,
            ':grade' => $grade,
            ':batch' => $batch,
            ':dead'  => $deadline,
            ':type'  => $type,
            ':file'  => $attachment_path,
            ':min'   => $min_marks,  // Bound here
            ':max'   => $max_marks   // Bound here
        ]);

        echo json_encode(["message" => "Assignment Posted Successfully!"]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
    }
}

// ==========================================
//  GET REQUEST: Fetch Assignments
// ==========================================
elseif ($method === 'GET') {
    $faculty_id = $_GET['faculty_id'] ?? 1;
    
    // Select * will now automatically include min_marks and max_marks if you ran the SQL ALTER command
    $sql = "SELECT * FROM assignments WHERE faculty_id = ? ORDER BY deadline ASC";
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute([$faculty_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
    }
}

// ==========================================
//  DELETE REQUEST
// ==========================================
elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            $stmt = $conn->prepare("DELETE FROM assignments WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Deleted"]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Delete Failed: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "ID required for deletion"]);
    }
}
?>