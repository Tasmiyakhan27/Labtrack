<?php
// server/api/test_assignment_match.php
header("Content-Type: text/plain");
include_once '../../config/database.php';

// HARDCODE YOUR TEST VALUES HERE
$test_grade = "1"; 
$test_batch = "B1";

echo "--- DIAGNOSTIC MODE ---\n";
echo "Testing matching for: Grade=['$test_grade'] Batch=['$test_batch']\n\n";

// 1. Check Assignments Table
$stmt = $conn->prepare("SELECT id, title, grade, batch FROM assignments");
$stmt->execute();
$all_assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- DUMPING ALL ASSIGNMENTS IN DB ---\n";
$found_match = false;
foreach ($all_assignments as $a) {
    $db_grade = $a['grade'];
    $db_batch = $a['batch'];
    
    // Check for exact match
    $grade_match = ($db_grade === $test_grade) ? "✅" : "❌";
    $batch_match = ($db_batch === $test_batch) ? "✅" : "❌";
    
    echo "ID: {$a['id']} | Title: {$a['title']} | Grade: ['$db_grade'] $grade_match | Batch: ['$db_batch'] $batch_match\n";
    
    if ($db_grade === $test_grade && $db_batch === $test_batch) {
        $found_match = true;
    }
}

echo "\n--- RESULT ---\n";
if ($found_match) {
    echo "✅ SUCCESS: Found at least one matching assignment in the database.\n";
    echo "If you don't see it in the app, check your browser's LocalStorage.";
} else {
    echo "❌ FAILURE: No assignments in the database match Grade='$test_grade' and Batch='$test_batch'.\n";
    echo "Update your assignment rows in the database to match these values exactly.";
}
?>