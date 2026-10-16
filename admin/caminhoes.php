<?php

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/inc/layout.php';
require_once __DIR__ . '/inc/RotasAdmin.php';

exigirLogin();
$rotas = new RotasAdmin(db());

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'excluir') {
    exigirCsrf();
    $id = (int) ($_POST['id'] ?? 0);
    try {
        avisar(...($rotas->excluir($id)
            ? ['sucesso', "Caminhão {$id} excluído, com os pontos da rota."]
            : ['erro', 'Caminhão não encontrado.']));
    } catch (Throwable $e) {
        error_log('admin excluir caminhão: ' . $e->getMessage());
        avisar('erro', 'Não foi possível excluir o caminhão.');
    }
    redirecionar('caminhoes.php');
}

$lista = $rotas->listar();

cabecalho('Caminhões e rotas');
?>
<div class="titulo-pagina">
  <h1>Caminhões e rotas</h1>
  <a class="botao" href="caminhao.php">+ Novo caminhão</a>
</div>

<?php if (!$lista): ?>
<p class="vazio">Nenhum caminhão cadastrado. Comece em “Novo caminhão”.</p>
<?php else: ?>
<div class="tabela-rolagem">
  <table class="tabela">
    <thead>
      <tr>
        <th scope="col">Nº</th>
        <th scope="col">Descrição</th>
        <th scope="col">Tipo</th>
        <th scope="col">Horário</th>
        <th scope="col">Bairros atendidos</th>
        <th scope="col">Pontos</th>
        <th scope="col"><span class="sr-only">Ações</span></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($lista as $rota): ?>
      <tr>
        <td><?= (int) $rota['id'] ?></td>
        <td><a href="caminhao.php?id=<?= (int) $rota['id'] ?>"><?= h($rota['descricao']) ?></a></td>
        <td><?= h($rota['tipo']) ?></td>
        <td class="sem-quebra"><?= h(substr($rota['horario_inicio'], 0, 5)) ?>–<?= h(substr($rota['horario_fim'], 0, 5)) ?></td>
        <td><?= h($rota['bairros'] ?? '—') ?></td>
        <td><?= (int) $rota['total_pontos'] ?></td>
        <td class="acoes-linha">
          <a class="botao botao-pequeno botao-secundario" href="caminhao.php?id=<?= (int) $rota['id'] ?>">Editar</a>
          <form method="post" onsubmit="return confirm('Excluir o caminhão <?= (int) $rota['id'] ?> e todos os pontos da rota?')">
            <?= campoCsrf() ?>
            <input type="hidden" name="acao" value="excluir">
            <input type="hidden" name="id" value="<?= (int) $rota['id'] ?>">
            <button type="submit" class="botao botao-pequeno botao-perigo">Excluir</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>
<?php
rodape();
