<?php

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/inc/layout.php';

$admin = exigirLogin();
$erro = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    exigirCsrf();
    $atual = (string) ($_POST['atual'] ?? '');
    $nova = (string) ($_POST['nova'] ?? '');
    $confirmacao = (string) ($_POST['confirmacao'] ?? '');

    $stmt = db()->prepare('SELECT senha FROM administradores WHERE id = :id');
    $stmt->execute([':id' => $admin['id']]);
    $hash = (string) $stmt->fetchColumn();

    if (!password_verify($atual, $hash)) {
        $erro = 'A senha atual está incorreta.';
    } elseif (strlen($nova) < 8) {
        $erro = 'A nova senha deve ter pelo menos 8 caracteres.';
    } elseif ($nova !== $confirmacao) {
        $erro = 'A confirmação não confere com a nova senha.';
    } else {
        db()->prepare('UPDATE administradores SET senha = :senha WHERE id = :id')
            ->execute([':senha' => password_hash($nova, PASSWORD_DEFAULT), ':id' => $admin['id']]);
        avisar('sucesso', 'Senha alterada com sucesso.');
        redirecionar('caminhoes.php');
    }
}

cabecalho('Alterar senha');
?>
<section class="cartao cartao-estreito">
  <h1>Alterar senha</h1>
  <?php if ($erro): ?>
  <div class="aviso aviso-erro" role="alert"><?= h($erro) ?></div>
  <?php endif; ?>
  <form method="post" class="formulario">
    <?= campoCsrf() ?>
    <label for="atual">Senha atual</label>
    <input id="atual" name="atual" type="password" autocomplete="current-password" required>
    <label for="nova">Nova senha (mínimo 8 caracteres)</label>
    <input id="nova" name="nova" type="password" autocomplete="new-password" minlength="8" required>
    <label for="confirmacao">Confirme a nova senha</label>
    <input id="confirmacao" name="confirmacao" type="password" autocomplete="new-password" minlength="8" required>
    <div class="acoes">
      <button type="submit" class="botao">Salvar</button>
      <a class="botao botao-secundario" href="caminhoes.php">Cancelar</a>
    </div>
  </form>
</section>
<?php
rodape();
