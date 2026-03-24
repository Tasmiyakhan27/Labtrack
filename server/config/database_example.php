<?php
// DATABASE CONFIGURATION
// Instructions: Rename this file to 'database.php' and add your credentials

// --- GLOBAL ENVIRONMENT VARIABLES (LOCAL TESTING FIX) ---
// This ensures your secret codes are available to every file that connects to the DB.
// Note: When you deploy to a real college server, you will remove these 3 lines 
// and set them in the server's actual environment settings.
if (!getenv('HOD_SECRET_CODE')) putenv('HOD_SECRET_CODE=ADMIN123');
if (!getenv('FACULTY_SECRET_CODE')) putenv('FACULTY_SECRET_CODE=FACULTY123');
if (!getenv('COLLEGE_SECRET_CODE')) putenv('COLLEGE_SECRET_CODE=ADMIN_2025');
// --------------------------------------------------------

$host = "localhost";
$db_name = "practical_management_db"; 
$username = "root";           // Standard default for local servers
$password = "";               // <--- LEAVE EMPTY or put "YOUR_PASSWORD"

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // echo "DB Connected!"; // You can uncomment this to test, but keep commented for production
} catch(PDOException $exception) {
    // If this fails, it will print the exact reason
    die("DATABASE CONNECTION FAILED: " . $exception->getMessage());
}
?>