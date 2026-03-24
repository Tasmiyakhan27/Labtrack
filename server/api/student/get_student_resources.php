<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
// --- UPDATED: Added Authorization to allowed headers ---
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- NEW: Handle Preflight Requests for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

// --- NEW: SECURE MIDDLEWARE ---
include_once '../../middleware/auth.php'; 

// --- NEW: VERIFY TOKEN ---
// We don't necessarily need the user's ID for this specific query, 
// but calling verifyToken() ensures the requester is genuinely logged in.
$userData = verifyToken(); 

// 1. Get Student Grade from URL (e.g. ?grade=2nd Year)
$grade = $_GET['grade'] ?? '';

if (empty($grade)) {
    echo json_encode(["success" => false, "message" => "Grade parameter missing"]);
    exit;
}

try {
    // 2. Fetch Resources
    // We check if the student's grade is inside the 'target_classes' string (e.g., "1st Year,2nd Year")
    $sql = "SELECT * FROM faculty_resources 
            WHERE target_classes LIKE :grade_pattern 
            ORDER BY created_at DESC";

    $stmt = $conn->prepare($sql);
    
    // Add wildcards for the search
    $gradePattern = "%" . $grade . "%";
    
    $stmt->execute([':grade_pattern' => $gradePattern]);
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $resources]);

} catch (PDOException $e) {
    http_response_code(500);
    // Generic error message for security
    echo json_encode(["success" => false, "message" => "DB Error occurred."]);
}
?>