<?php
// server/api/auth/login.php
require '../../vendor/autoload.php'; 
require '../../config/database.php';

use Firebase\JWT\JWT;

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete login data."]);
    exit();
}

// 1. QUERY BASED ON YOUR TABLE STRUCTURE
$query = "SELECT id, faculty_id, full_name, email, password_hash, department, role 
          FROM faculty 
          WHERE email = :email 
          LIMIT 1";

$stmt = $conn->prepare($query);
$stmt->execute([':email' => $data->email]);

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 2. VERIFY PASSWORD
    if (password_verify($data->password, $row['password_hash'])) {
        
        // JWT Config
        $secret_key = "ADMIN_2025"; 
        $issuedat_claim = time(); 
        $expire_claim = $issuedat_claim + 3600; 
        
        $token_payload = array(
            "iss" => "localhost",
            "iat" => $issuedat_claim,
            "exp" => $expire_claim,
            "data" => array(
                "id" => $row['id'],           // The Integer ID (Primary Key)
                "name" => $row['full_name'],
                "email" => $row['email'],
                "role" => $row['role']
            )
        );

        $jwt = JWT::encode($token_payload, $secret_key, 'HS256');

        http_response_code(200);
        
        // 3. RETURN USER OBJECT
        // We explicitly map 'id' to the Integer ID because that's what Timetable needs.
        echo json_encode(array(
            "success" => true,
            "message" => "Login successful.",
            "token" => $jwt,
            "user" => array(
                "id" => $row['id'],             // INTEGER (Primary Key) - Used for Database Links
                "faculty_id" => $row['faculty_id'], // STRING (Employee ID) - Used for Display
                "name" => $row['full_name'],
                "email" => $row['email'],
                "department" => $row['department'],
                "role" => $row['role']
            )
        ));

    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid password."]);
    }
} else {
    http_response_code(401);
    echo json_encode(["message" => "Email not found."]);
}
?>