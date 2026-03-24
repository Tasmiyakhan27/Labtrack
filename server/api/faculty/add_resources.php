<?php
// server/api/faculty/add_resources.php
//require '../../middleware/auth.php'; // Load Auth Middleware (for token verification)

// 1. Enable Debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 2. Setup Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
// --- NEW: Added Authorization to allowed headers ---
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Robust Database Include
$db_path = __DIR__ . '/../../config/database.php';
if (file_exists($db_path)) {
    include_once $db_path;
} else {
    include_once __DIR__ . '/../../db_connect.php';
}

// --- NEW: SECURE MIDDLEWARE ---
include_once '../../middleware/auth.php'; 

// --- NEW: VERIFY TOKEN & GET REAL ID ---
$userData = verifyToken(); 
$verified_faculty_id = $userData->id; 

$response = ["success" => false, "message" => ""];

// 4. Handle POST Request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Get Inputs
    // We no longer rely on $_POST['faculty_id'] for security
    $title = $_POST['title'] ?? '';
    $type = $_POST['type'] ?? 'link';
    $targetClasses = $_POST['target_classes'] ?? ''; 
    
    $contentPath = '';

    // 5. Handle File Upload
    if ($type === 'file') {
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            
            $uploadDir = __DIR__ . '/../../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $fileName = time() . '_' . basename($_FILES['file']['name']);
            $targetPath = $uploadDir . $fileName;
            
            $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            if (in_array($ext, ['pdf', 'txt'])) {
                if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                    $contentPath = 'uploads/' . $fileName; 
                } else {
                    $response['message'] = "Failed to move file.";
                    echo json_encode($response);
                    exit;
                }
            } else {
                $response['message'] = "Only PDF and TXT allowed.";
                echo json_encode($response);
                exit;
            }
        } else {
            $response['message'] = "No file uploaded.";
            echo json_encode($response);
            exit;
        }
    } else {
        $contentPath = $_POST['link'] ?? '';
    }

    // 6. Insert into Database
    if ($title && $contentPath && $targetClasses) {
        try {
            $sql = "INSERT INTO faculty_resources (faculty_id, title, type, content_path, target_classes) 
                    VALUES (:fid, :title, :type, :content, :classes)";
            $stmt = $conn->prepare($sql);
            
            // --- UPDATED: Bind the verified token ID ---
            $stmt->bindParam(':fid', $verified_faculty_id);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':content', $contentPath);
            $stmt->bindParam(':classes', $targetClasses);

            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = "Resource published successfully!";
            } else {
                $response['message'] = "Database save failed.";
            }
        } catch (Exception $e) {
            $response['message'] = "Error: " . $e->getMessage();
        }
    } else {
        $response['message'] = "Please fill in all fields.";
    }
}

echo json_encode($response);
?>