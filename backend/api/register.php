<?php
// register.php
session_start();
require_once 'db.php';

$errors = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1) Formular­daten bereinigen & validieren
    $username = trim($_POST['username'] ?? '');
    $email    = trim($_POST['email']    ?? '');
    $pass     = $_POST['password']     ?? '';
    $pass2    = $_POST['password2']    ?? '';

    if (!$username) $errors[] = "Bitte Benutzernamen eingeben.";
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Bitte eine gültige E-Mail-Adresse eingeben.";
    }
    if (strlen($pass) < 8) {
        $errors[] = "Das Passwort muss mindestens 8 Zeichen lang sein.";
    }
    if ($pass !== $pass2) {
        $errors[] = "Die Passwörter stimmen nicht überein.";
    }

    // 2) prüfen, ob Nutzername oder E-Mail schon existiert
    if (empty($errors)) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetchColumn() > 0) {
            $errors[] = "Benutzername oder E-Mail bereits vergeben.";
        }
    }

    // 3) neuen User anlegen
    if (empty($errors)) {
        $hash = password_hash($pass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $hash]);
        $success = true;
        // optional: direkt einloggen
        // $_SESSION['user_id'] = $pdo->lastInsertId();
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Registrierung</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h2>Benutzer registrieren</h2>

  <?php if ($success): ?>
    <p style="color:green;">Erfolg! Du kannst dich jetzt <a href="index.php">einloggen</a>.</p>
  <?php else: ?>
    <?php if ($errors): ?>
      <ul style="color:red;">
        <?php foreach($errors as $e): ?>
          <li><?= htmlspecialchars($e) ?></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>

    <form method="POST" action="">
      <label>
        Benutzername:<br>
        <input type="text" name="username" value="<?= htmlspecialchars($username ?? '') ?>" required>
      </label><br><br>

      <label>
        E-Mail:<br>
        <input type="email" name="email" value="<?= htmlspecialchars($email ?? '') ?>" required>
      </label><br><br>

      <label>
        Passwort:<br>
        <input type="password" name="password" required>
      </label><br><br>

      <label>
        Passwort wiederholen:<br>
        <input type="password" name="password2" required>
      </label><br><br>

      <button type="submit">Registrieren</button>
    </form>
  <?php endif; ?>
</body>
</html>
