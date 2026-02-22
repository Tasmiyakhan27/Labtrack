<?php
// server/api/faculty/test_connection.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: text/plain");

echo "--- DIAGNOSTIC START ---\n";
echo "Current script location: " . __DIR__ . "\n";

// 1. Check for Config Folder
$configPath = __DIR__ . '/../../config/database.php';
$oldPath = __DIR__ . '/../../db_connect.php';

echo "Looking for database file at:\n [A] $configPath\n [B] $oldPath\n\n";

if (file_exists($configPath)) {
    echo "✅ Found file at [A] (server/config/database.php)\n";
    require $configPath;
} elseif (file_exists($oldPath)) {
    echo "✅ Found file at [B] (server/db_connect.php)\n";
    require $oldPath;
} else {
    echo "❌ CRITICAL ERROR: Could not find database file in either location.\n";
    echo "Please check that your file is actually named 'database.php' and is inside the 'server/config' folder.\n";
    exit();
}

// 2. Check Connection
if (isset($conn)) {
    echo "✅ Database Variable \$conn exists.\n";
    try {
        $status = $conn->getAttribute(PDO::ATTR_CONNECTION_STATUS);
        echo "✅ Connection Status: $status\n";
    } catch (Exception $e) {
        echo "❌ Connection Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ CRITICAL ERROR: \$conn variable is missing. Check your database.php file.\n";
}

echo "--- DIAGNOSTIC END ---\n";
?>