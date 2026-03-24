<?php
// server/api/auth/register_faculty.php

// 1. ENABLE ERROR REPORTING
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 2. CORS HEADERS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

// 3. GET DATA
$data = json_decode(file_get_contents("php://input"));

// 4. CHECK DATA
if(
    !isset($data->faculty_id) || 
    !isset($data->full_name) || 
    !isset($data->email) || 
    !isset($data->password)
){
    http_response_code(400);
    echo json_encode(["message" => "Incomplete Data"]);
    exit();
}

// --- 5. SERVER-SIDE SECURITY CHECK ---
$role = isset($data->role) ? $data->role : 'faculty';
$secretCode = isset($data->secret_code) ? $data->secret_code : '';

// Pull from environment variables (Safe on server)
$hod_env_secret = getenv('HOD_SECRET_CODE');
$faculty_env_secret = getenv('FACULTY_SECRET_CODE');

// Prevent registration if server is misconfigured and missing the secret keys
if (!$hod_env_secret || !$faculty_env_secret) {
    http_response_code(500);
    echo json_encode(["message" => "Server Configuration Error: Secret keys not set."]);
    exit();
}

if ($role === 'hod') {
    if ($secretCode !== $hod_env_secret) {
        http_response_code(403); 
        echo json_encode(["message" => "Security Alert: Invalid HOD Authorization Key."]);
        exit();
    }
} elseif ($role === 'faculty') {
    if ($secretCode !== $faculty_env_secret) {
        http_response_code(403); 
        echo json_encode(["message" => "Security Alert: Invalid Staff Verification Key."]);
        exit();
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Invalid Role selected."]);
    exit();
}
// -------------------------------------------

// 6. REGISTER USER
try {
    // Check if user exists
    $checkQuery = "SELECT id FROM faculty WHERE email = :email OR faculty_id = :fid";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->execute([':email' => $data->email, ':fid' => $data->faculty_id]);
    
    if($checkStmt->rowCount() > 0){
        http_response_code(400);
        echo json_encode(["message" => "User already exists with this Email or ID"]);
        exit();
    }

    // Secure Password Hash
    $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);

    // Insert Query
    $query = "INSERT INTO faculty (faculty_id, full_name, email, password_hash, department, role) 
              VALUES (:fid, :name, :email, :pass, :dept, :role)";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([
        ':fid' => $data->faculty_id,
        ':name' => $data->full_name,
        ':email' => $data->email,
        ':pass' => $hashedPassword,
        ':dept' => $data->department ?? 'General',
        ':role' => $role
    ]);

    http_response_code(201);
    echo json_encode(["message" => "Registration Successful"]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
}
?>