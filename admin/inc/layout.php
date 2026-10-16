<?php

// Cabeçalho e rodapé das páginas internas do admin.

function cabecalho(string $titulo, array $opcoes = []): void
{
    $admin = adminLogado();
    $aviso = pegarAviso();
    ?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= h($titulo) ?> · Admin Écoleta</title>
  <link rel="stylesheet" href="assets/admin.css">
  <?php if (!empty($opcoes['mapa'])): ?>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <?php endif; ?>
</head>
<body>
  <header class="topo">
    <a class="marca" href="caminhoes.php">ÉCOLETA <span>admin</span></a>
    <?php if ($admin): ?>
    <nav class="menu" aria-label="Menu do admin">
      <a href="caminhoes.php">Caminhões e rotas</a>
      <a href="senha.php">Alterar senha</a>
      <form method="post" action="logout.php">
        <?= campoCsrf() ?>
        <button type="submit" class="link">Sair (<?= h($admin['usuario']) ?>)</button>
      </form>
    </nav>
    <?php endif; ?>
  </header>
  <main class="conteudo">
    <?php if ($aviso): ?>
    <div class="aviso aviso-<?= h($aviso['tipo']) ?>" role="status"><?= h($aviso['texto']) ?></div>
    <?php endif; ?>
<?php
}

function rodape(array $scripts = []): void
{
    ?>
  </main>
  <?php foreach ($scripts as $script): ?>
  <script src="<?= h($script) ?>"></script>
  <?php endforeach; ?>
</body>
</html>
<?php
}
