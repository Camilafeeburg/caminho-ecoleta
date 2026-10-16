<?php

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/inc/layout.php';
require_once __DIR__ . '/inc/RotasAdmin.php';

exigirLogin();
$rotas = new RotasAdmin(db());

$rotaId = (int) ($_GET['rota'] ?? 0);
$rota = $rotas->buscar($rotaId);
if ($rota === null) {
    avisar('erro', 'Caminhão não encontrado.');
    redirecionar('caminhoes.php');
}

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$ponto = $id === null ? null : $rotas->ponto($rotaId, $id);
if ($id !== null && $ponto === null) {
    avisar('erro', 'Ponto não encontrado.');
    redirecionar("caminhao.php?id={$rotaId}");
}

$total = count($rotas->pontos($rotaId));
$erros = [];
$form = [
    'cep' => $ponto && $ponto['cep'] ? Endereco::formatarCep($ponto['cep']) : '',
    'rua' => $ponto['rua'] ?? '',
    'numero' => $ponto['numero'] ?? '',
    'latitude' => $ponto['latitude'] ?? '',
    'longitude' => $ponto['longitude'] ?? '',
    'ordem' => $ponto ? (int) $ponto['ordem'] : $total + 1,
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    exigirCsrf();
    $form = [
        'cep' => trim((string) ($_POST['cep'] ?? '')),
        'rua' => trim((string) ($_POST['rua'] ?? '')),
        'numero' => trim((string) ($_POST['numero'] ?? '')),
        'latitude' => trim(str_replace(',', '.', (string) ($_POST['latitude'] ?? ''))),
        'longitude' => trim(str_replace(',', '.', (string) ($_POST['longitude'] ?? ''))),
        'ordem' => (int) ($_POST['ordem'] ?? 0),
    ];

    $cep = Endereco::somenteDigitos($form['cep']);
    if ($form['cep'] !== '' && strlen($cep) !== 8) {
        $erros[] = 'Informe um CEP válido (00000-000).';
    }
    if ($form['rua'] === '' || mb_strlen($form['rua']) > 200) {
        $erros[] = 'Informe a rua (busque pelo CEP ou digite).';
    }
    if (mb_strlen($form['numero']) > 10) {
        $erros[] = 'O número deve ter até 10 caracteres.';
    }
    $latitude = filter_var($form['latitude'], FILTER_VALIDATE_FLOAT);
    $longitude = filter_var($form['longitude'], FILTER_VALIDATE_FLOAT);
    if ($latitude === false || $latitude < -90 || $latitude > 90 || $longitude === false || $longitude < -180 || $longitude > 180) {
        $erros[] = 'Informe a latitude e a longitude (busque pelo CEP ou clique no mapa).';
    }
    $limite = $ponto ? $total : $total + 1;
    if ($form['ordem'] < 1 || $form['ordem'] > $limite) {
        $erros[] = "A posição deve ser de 1 a {$limite}.";
    }

    if (!$erros) {
        try {
            $rotas->salvarPonto($rotaId, $id, [
                'rua' => $form['rua'],
                'numero' => $form['numero'] === '' ? null : $form['numero'],
                'cep' => $cep === '' ? null : $cep,
                'latitude' => round($latitude, 7),
                'longitude' => round($longitude, 7),
            ], $form['ordem']);
            avisar('sucesso', $ponto ? 'Ponto atualizado.' : 'Ponto adicionado à rota.');
            redirecionar("caminhao.php?id={$rotaId}#pontos");
        } catch (Throwable $e) {
            error_log('admin salvar ponto: ' . $e->getMessage());
            $erros[] = 'Não foi possível salvar o ponto.';
        }
    }
}

$titulo = $ponto ? "Editar ponto {$ponto['ordem']}" : 'Adicionar ponto';
$posicoes = $ponto ? $total : $total + 1;

cabecalho($titulo, ['mapa' => true]);
?>
<p class="trilha">
  <a href="caminhoes.php">Caminhões e rotas</a> ›
  <a href="caminhao.php?id=<?= (int) $rotaId ?>">Caminhão <?= (int) $rotaId ?></a> › <?= h($titulo) ?>
</p>
<h1><?= h($titulo) ?> <small>Caminhão <?= (int) $rotaId ?> · <?= h($rota['descricao']) ?></small></h1>

<section class="cartao">
  <?php if ($erros): ?>
  <div class="aviso aviso-erro" role="alert">
    <ul><?php foreach ($erros as $erro): ?><li><?= h($erro) ?></li><?php endforeach; ?></ul>
  </div>
  <?php endif; ?>

  <form method="post" class="formulario grade" id="form-ponto" data-cidade="<?= h($rota['cidade']) ?>" data-uf="<?= h($rota['uf']) ?>">
    <?= campoCsrf() ?>
    <div class="largura-2 campo-cep">
      <label for="cep">CEP</label>
      <div class="linha-busca">
        <input id="cep" name="cep" inputmode="numeric" maxlength="9" placeholder="00000-000" value="<?= h($form['cep']) ?>" autocomplete="off" autofocus>
        <button type="button" class="botao" id="buscar-cep">Buscar CEP</button>
      </div>
    </div>
    <div>
      <label for="numero">Número (opcional)</label>
      <input id="numero" name="numero" maxlength="10" value="<?= h($form['numero']) ?>" placeholder="Ex.: 820">
    </div>
    <p class="status-busca largura-total" id="status-busca" role="status" aria-live="polite"></p>

    <div class="largura-2">
      <label for="rua">Rua</label>
      <input id="rua" name="rua" maxlength="200" value="<?= h($form['rua']) ?>" required>
    </div>
    <div>
      <label for="bairro">Bairro</label>
      <input id="bairro" readonly tabindex="-1" placeholder="Preenchido pelo CEP">
    </div>
    <div>
      <label for="latitude">Latitude</label>
      <input id="latitude" name="latitude" inputmode="decimal" value="<?= h((string) $form['latitude']) ?>" required>
    </div>
    <div>
      <label for="longitude">Longitude</label>
      <input id="longitude" name="longitude" inputmode="decimal" value="<?= h((string) $form['longitude']) ?>" required>
    </div>
    <div>
      <label for="ordem">Posição na rota</label>
      <select id="ordem" name="ordem">
        <?php for ($posicao = 1; $posicao <= $posicoes; $posicao++): ?>
        <option value="<?= $posicao ?>" <?= $posicao === $form['ordem'] ? 'selected' : '' ?>>
          <?= $posicao ?><?= !$ponto && $posicao === $posicoes ? ' (fim da rota)' : '' ?>
        </option>
        <?php endfor; ?>
      </select>
    </div>

    <div class="largura-total">
      <div id="mapa-ponto" class="mapa" aria-label="Mapa do ponto: clique ou arraste o marcador para ajustar"></div>
      <small>Confira o marcador. Se estiver fora do lugar, arraste-o ou clique no mapa no ponto certo da rua.</small>
    </div>

    <div class="acoes largura-total">
      <button type="submit" class="botao"><?= $ponto ? 'Salvar ponto' : 'Adicionar ponto' ?></button>
      <a class="botao botao-secundario" href="caminhao.php?id=<?= (int) $rotaId ?>#pontos">Cancelar</a>
    </div>
  </form>
</section>
<?php
rodape(['assets/ponto.js']);
