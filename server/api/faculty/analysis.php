<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$faculty_id = $_GET['faculty_id'] ?? 1;
$grade = $_GET['grade'] ?? 'All';
$batch = $_GET['batch'] ?? 'All';

// 1. ESCAPE ARGUMENTS (Security Best Practice)
// This prevents command injection attacks
$clean_fid = escapeshellarg($faculty_id);
$clean_grade = escapeshellarg($grade);
$clean_batch = escapeshellarg($batch);

// 2. CONSTRUCT PATH
// Ensure this path points correctly to your python_engine folder
$script_path = "../../python_engine/analytics.py";

// 3. EXECUTE PYTHON
// We add '2>&1' to capture errors if Python crashes
$command = "python $script_path $clean_fid $clean_grade $clean_batch 2>&1";
$output = shell_exec($command);

// 4. CHECK OUTPUT
// If Python fails, it might return a string error instead of JSON.
// We try to decode it. If null, we send a fallback JSON.
$json = json_decode($output);

if ($json === null) {
    // If decoding failed, send the raw output as a debug message
    echo json_encode([
        "error" => "Python Script Failed",
        "raw_output" => $output,
        "completion" => [],
        "performance" => [],
        "subjects" => [],
        "batches" => []
    ]);
} else {
    echo $output;
}
?>