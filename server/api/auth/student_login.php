<?php
// server/api/auth/student_login.php

// 1. LOAD LIBRARIES & CONFIG
require '../../vendor/autoload.php'; // Load Composer (for JWT)
require '../../config/database.php'; // Load Database Connection
//require '../../middleware/auth.php'; // Load Auth Middleware (for token verification)

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// 2. SET HEADERS (CORS)
// This allows your React App (running on a different port) to talk to this PHP script.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle Preflight Request (Browser Check)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. GET INPUT DATA
$data = json_decode(file_get_contents("php://input"));

// Check for missing fields
if (empty($data->username) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Enrollment No and Password are required."]);
    exit();
}

try {
    // 4. FIND STUDENT IN DATABASE
    // We select all necessary fields to store in the browser later
    $query = "SELECT id, full_name, username, password, grade, batch FROM students WHERE username = :username LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute([':username' => $data->username]);

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 5. VERIFY PASSWORD (HASH CHECK)
        // $data->password is what user typed (e.g., "15082003")
        // $row['password'] is the hash from DB (e.g., "$2y$10$X8f...")
        if (password_verify($data->password, $row['password'])) {
            
            // --- LOGIN SUCCESS ---

            // 6. GENERATE JWT TOKEN
            // CRITICAL FOR DEPLOYMENT: Use Environment Variables, NOT hardcoded strings!
            // This MUST match the key your auth.php middleware uses to decode.
        $secret_key = getenv("SECRET_KEY") ?: "labtrack_internal_signing_key_2026"; // For production, use getenv('HOD_SECRET_CODE') or similar to fetch from env
            if (!$secret_key) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Server Configuration Error: Missing Secret Key."]);
                exit();
            }

            $issued_at = time();
            $expiration = $issued_at + (60 * 60 * 24); // Valid for 24 hours

            $payload = array(
                "iss" => "localhost", // Consider updating to your college domain on deployment
                "iat" => $issued_at,
                "exp" => $expiration,
                "data" => array(
                    "id" => $row['id'],
                    "username" => $row['username'], // Enrollment No
                    "role" => "student",            // Role Identifier
                    "grade" => $row['grade'],       // Critical for filtering assignments
                    "batch" => $row['batch']        // Critical for filtering timetable
                )
            );

            $jwt = JWT::encode($payload, $secret_key, 'HS256');

            // 7. SEND RESPONSE
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Login successful.",
                "token" => $jwt,
                "user" => array(
                    "id" => $row['id'],
                    "full_name" => $row['full_name'],
                    "enrollment_no" => $row['username'],
                    "grade" => $row['grade'],
                    "batch" => $row['batch'],
                    "role" => "student" // Added for frontend permission routing
                )
            ));

        } else {
            // Password mismatch
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid Password (DOB)."]);
        }
    } else {
        // User not found
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Enrollment Number not found."]);
    }
} catch (Exception $e) {
    // Database or Server Error
    http_response_code(500);
    // Generic error message for security (don't leak database info)
    echo json_encode(["success" => false, "message" => "Server Error occurred during login."]);
}
?>