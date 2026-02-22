<?php
// server/api/faculty/submissions.php

// 1. CORS & Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Database Connection
// Adjust this path if your folder structure is different
include_once '../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // ==========================================
    //  GET REQUEST: Fetch Submissions
    // ==========================================
    if ($method === 'GET') {
        
        $faculty_id = isset($_GET['faculty_id']) ? $_GET['faculty_id'] : null;
        $grade      = isset($_GET['grade']) ? $_GET['grade'] : 'All';
        $batch      = isset($_GET['batch']) ? $_GET['batch'] : 'All';
        $subject    = isset($_GET['subject']) ? $_GET['subject'] : 'All';

        if (!$faculty_id) {
            echo json_encode(["error" => "Faculty ID is required"]);
            exit();
        }

        // SQL Query (Updated to fetch min_marks and max_marks)
        $sql = "SELECT 
                    s.id AS submission_id,
                    st.full_name AS student_name,
                    st.username AS roll_number,
                    st.batch,
                    a.title AS assignment_title,
                    a.min_marks,   -- ADDED THIS
                    a.max_marks,   -- ADDED THIS
                    s.submitted_at,
                    s.file_path,
                    s.link_url AS submission_link,
                    s.code_content,
                    s.status,
                    s.marks,
                    s.feedback
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                JOIN students st ON s.student_id = st.id
                WHERE a.faculty_id = :faculty_id";

        // Dynamic Filtering
        if ($grade !== 'All') {
            $sql .= " AND st.grade = :grade";
        }
        if ($batch !== 'All') {
            $sql .= " AND st.batch = :batch";
        }
        if ($subject !== 'All') {
            $sql .= " AND a.subject = :subject";
        }

        $sql .= " ORDER BY s.submitted_at DESC";

        // Prepare Statement (PDO)
        $stmt = $conn->prepare($sql);

        // Bind Parameters
        $stmt->bindValue(':faculty_id', $faculty_id);
        if ($grade !== 'All') $stmt->bindValue(':grade', $grade);
        if ($batch !== 'All') $stmt->bindValue(':batch', $batch);
        if ($subject !== 'All') $stmt->bindValue(':subject', $subject);

        $stmt->execute();
        $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($submissions);
    }

    // ==========================================
    //  POST REQUEST: Update Marks & Feedback
    // ==========================================
    elseif ($method === 'POST') {
        
        $data = json_decode(file_get_contents("php://input"));

        if (isset($data->submission_id)) {
            
            $submission_id = $data->submission_id;
            $marks = isset($data->marks) ? $data->marks : null;
            $feedback = isset($data->feedback) ? $data->feedback : '';

            // Update Query (PDO)
            $sql = "UPDATE submissions SET marks = :marks, feedback = :feedback WHERE id = :id";
            $stmt = $conn->prepare($sql);
            
            // Execute with array mapping
            $success = $stmt->execute([
                ':marks' => $marks,
                ':feedback' => $feedback,
                ':id' => $submission_id
            ]);

            if ($success) {
                echo json_encode(["message" => "Grade saved successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to update grade"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Submission ID missing"]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
}
?>