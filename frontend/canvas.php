<?php
// canvas.php
session_start();
require_once 'db.php';

// 1) Zugriffskontrolle
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// 2) Baum-ID aus der URL holen
$tree_id = isset($_GET['tree_id']) ? (int)$_GET['tree_id'] : 0;
if ($tree_id <= 0) {
    die("Ungültige Baum-ID.");
}

// 3) Prüfen, ob dieser Baum dem eingeloggten Nutzer gehört
$stmt = $pdo->prepare("SELECT * FROM trees WHERE id = ? AND owner_id = ?");
$stmt->execute([$tree_id, $_SESSION['user_id']]);
$tree = $stmt->fetch();
if (!$tree) {
    die("Stammbaum nicht gefunden oder kein Zugriff.");
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Stammbaum: <?= htmlspecialchars($tree['name']) ?></title>
  <link rel="stylesheet" href="css/style.css">

  <!-- Drawflow CSS von jsDelivr -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/drawflow/dist/drawflow.min.css"
  />

  <!-- Drawflow JS von jsDelivr -->
  <script
    src="https://cdn.jsdelivr.net/npm/drawflow/dist/drawflow.min.js"
  ></script>

  <!-- Übergib die Baum-ID an dein Script -->
  <script>
    const TREE_ID = <?= json_encode($tree_id) ?>;
  </script>
  <script src="js/script.js" defer></script>
</head>
<body>
  <h2>Stammbaum: <?= htmlspecialchars($tree['name']) ?></h2>
  <div>
    <button onclick="openModal()">Neue Person anlegen</button>
    <button onclick="saveTree()">Stammbaum speichern</button>
    <a href="dashboard.php">← Zurück zum Dashboard</a>
  </div>

  <!-- Drawflow-Canvas -->
  <div id="drawflow" class="drawflow"
       style="width:100%; height:600px; border:1px solid #000;"></div>

  <!-- Modal für neue Person -->
  <div id="overlay" style="display:none;
        position:fixed; top:0; left:0; width:100%; height:100%;
        background:rgba(0,0,0,0.5); z-index:999;">
  </div>
  <div id="modal" style="display:none;
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        background:white; padding:20px; border:1px solid #333; z-index:1000;">
    <h3>Neue Person anlegen</h3>
    <input type="text" id="firstname" placeholder="Vorname"><br>
    <input type="text" id="lastname" placeholder="Nachname"><br>
    <input type="date" id="birthdate"><br>
    <input type="date" id="deathdate"><br>
    <button onclick="savePerson()">Speichern</button>
    <button onclick="closeModal()">Abbrechen</button>
  </div>
</body>
</html>
