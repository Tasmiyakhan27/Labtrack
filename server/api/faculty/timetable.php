<?php
// server/api/faculty/timetable.php

require '../../config/database.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
// --- UPDATED: Added Authorization to allowed headers ---
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- NEW: Handle Preflight Requests for CORS ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- NEW: SECURE MIDDLEWARE ---
include_once '../../middleware/auth.php'; 

// --- NEW: VERIFY TOKEN & GET REAL ID ---
$userData = verifyToken(); 
$verified_faculty_id = $userData->id; 

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. GET: Fetch Schedule ---
if ($method === 'GET') {
    // We keep fetching all data for global batch conflict checks, 
    // but the API is now protected by the token gatekeeper above.
    
    $sql = "SELECT * FROM timetables ORDER BY date DESC, start_time ASC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result);
}

// --- 2. POST: Add New Slot ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // CONFLICT CHECK: Checks global table for overlaps
    $checkSql = "SELECT * FROM timetables 
                 WHERE date = ? 
                 AND grade = ? 
                 AND batch = ? 
                 AND (
                    (start_time < ? AND end_time > ?)
                 )";
    
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute([
        $data->date, 
        $data->grade, 
        $data->batch, 
        $data->end,  
        $data->start 
    ]);

    if($checkStmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["message" => "Conflict: This batch is already busy with another class at this time."]);
        exit();
    }
    
    // Insert Query
    $sql = "INSERT INTO timetables (faculty_id, subject_name, grade, batch, day_of_week, date, start_time, end_time, room_number)
            VALUES (:fid, :sub, :grade, :batch, :day, :date, :start, :end, :room)";
    
    $stmt = $conn->prepare($sql);
    
    try {
        $stmt->execute([
            ':fid' => $verified_faculty_id, // --- SECURED: Uses token ID instead of frontend ID ---
            ':sub' => $data->subject,
            ':grade' => $data->grade,
            ':batch' => $data->batch,
            ':day' => $data->day,
            ':date' => $data->date, 
            ':start' => $data->start,
            ':end' => $data->end,
            ':room' => $data->room
        ]);
        echo json_encode(["message" => "Slot Added Successfully", "id" => $conn->lastInsertId()]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
    }
}

// --- 3. DELETE ---
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if($id) {
        // --- SECURED: Ensures the faculty can only delete THEIR OWN slots ---
        $sql = "DELETE FROM timetables WHERE id = ? AND faculty_id = ?";
        $stmt = $conn->prepare($sql);
        if($stmt->execute([$id, $verified_faculty_id])) {
            echo json_encode(["message" => "Slot Deleted"]);
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Unauthorized to delete this slot"]);
        }
    }
}
?>