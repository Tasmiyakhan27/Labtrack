<?php
// server/api/faculty/analysis.php

// 1. MANDATORY CORS HANDSHAKE (Must be at the absolute top)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle Preflight (The 'OPTIONS' request in your screenshot)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); 
}

// 2. ERROR REPORTING (Helpful for debugging)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 3. FIX THE PATH (Go up two levels to find vendor)
require_once __DIR__ . '/../../vendor/autoload.php'; 
include_once __DIR__ . '/../../middleware/auth.php'; 

try {
    // --- VERIFY TOKEN ---
    // If verifyToken fails, it will send a 401 and exit automatically
    $userData = verifyToken(); 
    $verified_faculty_id = $userData->id; 

    $grade = $_GET['grade'] ?? 'All';
    $batch = $_GET['batch'] ?? 'All';

    $clean_fid = escapeshellarg($verified_faculty_id);
    $clean_grade = escapeshellarg($grade);
    $clean_batch = escapeshellarg($batch);

    // 4. CONSTRUCT ABSOLUTE PATH TO PYTHON
    // Changed to 2 levels up (../../) and used file_exists for validation
    $script_path = __DIR__ . "/../../python_engine/analytics.py";
    if (!file_exists($script_path)) {
        throw new Exception("Python script not found. Check path: " . $script_path);
    }

    // 5. EXECUTE PYTHON
    // Capturing errors (2>&1) helps us see if Python crashes
    $command = "python \"$script_path\" $clean_fid $clean_grade $clean_batch 2>&1";
    $output = shell_exec($command);

    // 6. CHECK FOR VALID JSON
    $json = json_decode($output);

    if ($json === null) {
        http_response_code(500);
        echo json_encode([
            "error" => "Python output is not valid JSON",
            "raw_output" => $output,
            "completion" => [], "performance" => [], "subjects" => [], "batches" => []
        ]);
    } else {
        echo $output;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>