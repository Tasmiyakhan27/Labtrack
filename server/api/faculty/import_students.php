<?php
// server/api/faculty/import_students.php

// 1. Enable Error Reporting (Crucial for debugging 500 errors)
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json"); 
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. PATH FIXES (The main cause of your error)
// We use __DIR__ to go up two levels: faculty -> api -> server
$vendorPath = __DIR__ . '/../../vendor/autoload.php';
$configPath = __DIR__ . '/../../config/database.php';

// Verify files exist before requiring to prevent crash
if (!file_exists($vendorPath)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Composer dependencies not found. Run 'composer install'."]);
    exit();
}
if (!file_exists($configPath)) {
    // Fallback for older structure
    $configPath = __DIR__ . '/../../db_connect.php';
}

require $vendorPath;
include_once $configPath;

use PhpOffice\PhpSpreadsheet\IOFactory;

// 3. SECURITY CHECK: Verify HOD Role
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Check if ID was sent
    if (!isset($_POST['uploader_id'])) {
        http_response_code(403); 
        echo json_encode(["success" => false, "message" => "Unauthorized: No User ID provided."]);
        exit();
    }

    $uploaderId = $_POST['uploader_id'];

    try {
        if (!isset($conn)) {
             throw new Exception("Database connection failed.");
        }

        $stmt = $conn->prepare("SELECT role FROM faculty WHERE id = ? LIMIT 1");
        $stmt->execute([$uploaderId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Strict Check: Must be HOD (lowercase to match database enum)
        if (!$user || ($user['role'] !== 'hod' && $user['role'] !== 'HOD')) {
            http_response_code(403); 
            echo json_encode(["success" => false, "message" => "Access Denied: Only HOD can import students."]);
            exit();
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
        exit();
    }
}

// 4. FILE PROCESSING
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    try {
        $inputFileName = $_FILES['file']['tmp_name'];
        
        // Identify file type automatically
        $spreadsheet = IOFactory::load($inputFileName);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        $count = 0;
        $errors = 0;

        // Start from index 1 to skip headers (Row 0)
        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            
            // Excel Column Mapping (0=Enrollment, 1=Name, 2=DOB, 3=Grade, 4=Batch)
            $enrollmentNo = $row[0] ?? null; 
            $fullName     = $row[1] ?? null;
            $dobRaw       = $row[2] ?? null; 
            $grade        = $row[3] ?? null;
            $batch        = $row[4] ?? null;

            if ($enrollmentNo && $dobRaw && $fullName) {
                
                // Format DOB/Password
                $plainPassword = (string)$dobRaw; 
                $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);

                // Check if student exists to avoid duplicates
                $check = $conn->prepare("SELECT id FROM students WHERE username = ?");
                $check->execute([$enrollmentNo]);
                
                if ($check->rowCount() == 0) {
                    $sql = "INSERT INTO students (username, password, full_name, grade, batch) VALUES (?, ?, ?, ?, ?)";
                    $stmt = $conn->prepare($sql);
                    
                    if($stmt->execute([$enrollmentNo, $hashedPassword, $fullName, $grade, $batch])) {
                        $count++;
                    } else {
                        $errors++;
                    }
                }
            }
        }

        if ($count > 0) {
            echo json_encode(["success" => true, "message" => "$count students imported successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "No new students imported. They might already exist."]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error processing file: " . $e->getMessage()]);
    }
} else {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
         echo json_encode(["success" => false, "message" => "No file uploaded."]);
    }
}
?>