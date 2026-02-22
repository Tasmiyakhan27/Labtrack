<?php
// server/api/faculty/timetable.php

require '../../config/database.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$method = $_SERVER['REQUEST_METHOD'];

// --- 1. GET: Fetch Schedule (UPDATED) ---
if ($method === 'GET') {
    // REMOVED: "WHERE faculty_id = ?"
    // REASON: We need ALL data to check for batch conflicts globally.
    // The Frontend will handle filtering for the specific faculty's view.
    
    $sql = "SELECT * FROM timetables ORDER BY date DESC, start_time ASC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result);
}

// --- 2. POST: Add New Slot (No Changes needed, already global) ---
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->faculty_id) || $data->faculty_id == 0) {
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "Session Error: Faculty ID is missing. Please re-login."]);
    exit();
}

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
            ':fid' => $data->faculty_id,
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

// --- 3. DELETE (No Change) ---
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if($id) {
        $sql = "DELETE FROM timetables WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if($stmt->execute([$id])) {
            echo json_encode(["message" => "Slot Deleted"]);
        }
    }
}
?>