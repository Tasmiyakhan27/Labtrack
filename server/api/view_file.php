<?php
// 1. Allow React to access this script
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

if (isset($_GET['file'])) {
    $file = $_GET['file'];
    // Security: Only allow files from the submissions folder
    $basePath = realpath(__DIR__ . '/uploads/submissions/');
    $filePath = realpath($basePath . '/' . basename($file));

    if ($filePath && strpos($filePath, $basePath) === 0 && file_exists($filePath)) {
        // 2. Set the correct Content-Type (Docx, PDF, etc.)
        $mimeType = mime_content_type($filePath);
        header("Content-Type: " . $mimeType);
        
        // 3. Output the file content
        readfile($filePath);
        exit;
    }
}

http_response_code(404);
echo "File not found.";
?>