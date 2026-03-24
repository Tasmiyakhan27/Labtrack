<?php
// server/middleware/auth.php
require_once __DIR__ . '/../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function verifyToken() {
    $headers = getallheaders();
    // Check if Authorization header exists
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : null);

    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(["error" => "Access Denied. No token provided."]);
        exit();
    }

    try {
        $jwt = $matches[1];
        $secret_key = getenv("SECRET_KEY") ?: "labtrack_internal_signing_key_2026"; // For production, use getenv('HOD_SECRET_CODE') or similar to fetch from env
        
        // Decode the token
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        
        // Return the user data (id, email, etc.) stored in the token
        return $decoded->data; 
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid or Expired Token"]);
        exit();
    }
}