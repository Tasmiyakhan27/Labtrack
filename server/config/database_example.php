<?php
// DATABASE CONFIGURATION
// Instructions: Rename this file to 'database.php' and add your credentials

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