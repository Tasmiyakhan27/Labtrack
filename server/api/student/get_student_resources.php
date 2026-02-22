<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

include_once '../../config/database.php';

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
    echo json_encode(["success" => false, "message" => "DB Error: " . $e->getMessage()]);
}
?>