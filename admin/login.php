<?php

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/inc/layout.php';

if (adminLogado()) {
    redirecionar('caminhoes.php');
}

$erro = null;
$usuario = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    exigirCsrf();
    $usuario = trim((string) ($_POST['usuario'] ?? ''));
    $senha = (string) ($_POST['senha'] ?? '');

    // Freio simples contra tentativas repetidas nesta sessão.
    $_SESSION['tentativas'] = ($_SESSION['tentativas'] ?? 0) + 1;
    if ($_SESSION['tentativas'] > 5) {
        sleep(min(10, $_SESSION['tentativas'] - 5));
    }

    try {
        $stmt = db()->prepare('SELECT id, usuario, senha FROM administradores WHERE usuario = :usuario LIMIT 1');
        $stmt->execute([':usuario' => $usuario]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin && password_verify($senha, $admin['senha'])) {
            session_regenerate_id(true);
            unset($_SESSION['tentativas']);
            $_SESSION['admin'] = ['id' => (int) $admin['id'], 'usuario' => $admin['usuario']];
            db()->prepare('UPDATE administradores SET ultimo_acesso = NOW() WHERE id = :id')->execute([':id' => $admin['id']]);
            redirecionar('caminhoes.php');
        }

        $erro = 'Usuário ou senha inválidos.';
    } catch (Throwable $e) {
        error_log('admin login: ' . $e->getMessage());
        $erro = 'Não foi possível fazer o login agora. Tente novamente.';
    }
}

cabecalho('Login');
?>
<section class="cartao cartao-login">
  <h1>Acesso ao admin</h1>
  <?php if ($erro): ?>
  <div class="aviso aviso-erro" role="alert"><?= h($erro) ?></div>
  <?php endif; ?>
  <form method="post" class="formulario">
    <?= campoCsrf() ?>
    <label for="usuario">Usuário</label>
    <input id="usuario" name="usuario" value="<?= h($usuario) ?>" autocomplete="username" required autofocus>
    <label for="senha">Senha</label>
    <input id="senha" name="senha" type="password" autocomplete="current-password" required>
    <button type="submit" class="botao">Entrar</button>
  </form>
</section>
<?php
rodape();
