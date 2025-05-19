<?php
// api/add_tree.php
session_start();
require_once '../db.php';

// Nur eingeloggte User dürfen einen Tree anlegen
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status'=>'error','message'=>'Unauthorized']);
    exit;
}

// JSON-Input lesen
$input = json_decode(file_get_contents('php://input'), true);
$name        = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');

// Validierung
if ($name === '') {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Name ist erforderlich.']);
    exit;
}

// Insert
$stmt = $pdo->prepare("
    INSERT INTO trees (name, owner_id, description)
    VALUES (?, ?, ?)
");
$stmt->execute([
    $name,
    $_SESSION['user_id'],
    $description !== '' ? $description : null
]);

// Rückgabe
echo json_encode([
    'status' => 'success',
    'id'     => $pdo->lastInsertId()
]);
