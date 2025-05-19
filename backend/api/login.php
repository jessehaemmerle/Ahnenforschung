<?php
// login.php
session_start();
require_once 'db.php';

$error = '';

// Wenn das Formular abgeschickt wurde:
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Bitte Benutzername und Passwort eingeben.';
    } else {
        // Nutzer in DB suchen
        $stmt = $pdo->prepare('SELECT id, password FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Login erfolgreich
            $_SESSION['user_id'] = $user['id'];
            header('Location: editor.php');
            exit;
        } else {
            $error = 'Benutzername oder Passwort ist falsch.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Login – Stammbaum Tool</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h2>Login</h2>

  <?php if ($error): ?>
    <p style="color: red;"><?= htmlspecialchars($error) ?></p>
  <?php endif; ?>

  <form method="post" action="login.php">
    <label>
      Benutzername:<br>
      <input type="text" name="username" value="<?= htmlspecialchars($username ?? '') ?>" required>
    </label><br><br>

    <label>
      Passwort:<br>
      <input type="password" name="password" required>
    </label><br><br>

    <button type="submit">Anmelden</button>
  </form>

  <p>Noch keinen Account? <a href="register.php">Jetzt registrieren</a></p>
</body>
</html>
