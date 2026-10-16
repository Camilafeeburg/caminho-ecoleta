<?php

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/inc/layout.php';
require_once __DIR__ . '/inc/RotasAdmin.php';

exigirLogin();
$rotas = new RotasAdmin(db());

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$novo = $id === null;
$rota = $novo ? null : $rotas->buscar($id);

if (!$novo && $rota === null) {
    avisar('erro', 'Caminhão não encontrado.');
    redirecionar('caminhoes.php');
}

const TIPOS = ['Coleta Seletiva', 'Coleta Domiciliar'];

// Bairros digitados separados por vírgula, barra ou linha; sem repetições.
function lerBairros(string $texto): array
{
    $bairros = [];
    foreach (preg_split('/[,\/\n;]+/', $texto) as $bairro) {
        $bairro = trim($bairro);
        if ($bairro !== '') {
            $bairros[mb_strtolower($bairro)] = mb_substr($bairro, 0, 120);
        }
    }
    return array_values($bairros);
}

$erros = [];
$form = [
    'id' => $novo ? $rotas->proximoNumero() : (int) $rota['id'],
    'descricao' => $rota['descricao'] ?? '',
    'tipo' => $rota['tipo'] ?? TIPOS[0],
    'horario_inicio' => substr($rota['horario_inicio'] ?? '18:00', 0, 5),
    'horario_fim' => substr($rota['horario_fim'] ?? '21:00', 0, 5),
    'cidade' => $rota['cidade'] ?? 'Porto Alegre',
    'uf' => $rota['uf'] ?? 'RS',
    'bairros' => implode(', ', $rota['bairros'] ?? []),
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    exigirCsrf();
    $acao = $_POST['acao'] ?? '';

    // Ações nos pontos (só para caminhão já cadastrado)
    if (!$novo && in_array($acao, ['excluir_ponto', 'subir_ponto', 'descer_ponto'], true)) {
        $pontoId = (int) ($_POST['ponto'] ?? 0);
        try {
            if ($acao === 'excluir_ponto') {
                avisar(...($rotas->excluirPonto($id, $pontoId) ? ['sucesso', 'Ponto excluído.'] : ['erro', 'Ponto não encontrado.']));
            } else {
                $rotas->moverPonto($id, $pontoId, $acao === 'subir_ponto' ? -1 : 1);
            }
        } catch (Throwable $e) {
            error_log('admin ponto: ' . $e->getMessage());
            avisar('erro', 'Não foi possível alterar o ponto.');
        }
        redirecionar("caminhao.php?id={$id}#pontos");
    }

    if ($acao === 'salvar') {
        $form = [
            'id' => $novo ? (int) ($_POST['id'] ?? 0) : $id,
            'descricao' => trim((string) ($_POST['descricao'] ?? '')),
            'tipo' => trim((string) ($_POST['tipo'] ?? '')),
            'horario_inicio' => trim((string) ($_POST['horario_inicio'] ?? '')),
            'horario_fim' => trim((string) ($_POST['horario_fim'] ?? '')),
            'cidade' => trim((string) ($_POST['cidade'] ?? '')),
            'uf' => mb_strtoupper(trim((string) ($_POST['uf'] ?? ''))),
            'bairros' => (string) ($_POST['bairros'] ?? ''),
        ];

        if ($form['id'] < 1 || $form['id'] > 999999) {
            $erros[] = 'Informe o número do caminhão (1 a 999999).';
        } elseif ($novo && $rotas->existe($form['id'])) {
            $erros[] = "Já existe o caminhão {$form['id']}.";
        }
        if ($form['descricao'] === '' || mb_strlen($form['descricao']) > 150) {
            $erros[] = 'Informe a descrição (até 150 caracteres).';
        }
        if ($form['tipo'] === '' || mb_strlen($form['tipo']) > 50) {
            $erros[] = 'Informe o tipo de coleta (até 50 caracteres).';
        }
        foreach (['horario_inicio' => 'início', 'horario_fim' => 'fim'] as $campo => $nome) {
            if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $form[$campo])) {
                $erros[] = "Informe o horário de {$nome} no formato 00:00.";
            }
        }
        if ($form['cidade'] === '' || mb_strlen($form['cidade']) > 120) {
            $erros[] = 'Informe a cidade.';
        }
        if (!preg_match('/^[A-Z]{2}$/', $form['uf'])) {
            $erros[] = 'Informe a UF com 2 letras.';
        }
        $bairros = lerBairros($form['bairros']);

        if (!$erros) {
            try {
                $rotas->salvar([
                    'id' => $form['id'],
                    'descricao' => $form['descricao'],
                    'tipo' => $form['tipo'],
                    'horario_inicio' => $form['horario_inicio'] . ':00',
                    'horario_fim' => $form['horario_fim'] . ':00',
                    'cidade' => $form['cidade'],
                    'uf' => $form['uf'],
                    'bairros' => $bairros,
                ], $novo);
                avisar('sucesso', $novo ? "Caminhão {$form['id']} cadastrado. Agora adicione os pontos da rota." : 'Caminhão atualizado.');
                redirecionar("caminhao.php?id={$form['id']}");
            } catch (Throwable $e) {
                error_log('admin salvar caminhão: ' . $e->getMessage());
                $erros[] = 'Não foi possível salvar o caminhão.';
            }
        }
    }
}

$pontos = $novo ? [] : $rotas->pontos($id);
$titulo = $novo ? 'Novo caminhão' : "Caminhão {$id}";

cabecalho($titulo, ['mapa' => !$novo]);
?>
<p class="trilha"><a href="caminhoes.php">Caminhões e rotas</a> › <?= h($titulo) ?></p>
<h1><?= h($titulo) ?></h1>

<section class="cartao">
  <h2>Dados do caminhão</h2>
  <?php if ($erros): ?>
  <div class="aviso aviso-erro" role="alert">
    <ul><?php foreach ($erros as $erro): ?><li><?= h($erro) ?></li><?php endforeach; ?></ul>
  </div>
  <?php endif; ?>
  <form method="post" class="formulario grade">
    <?= campoCsrf() ?>
    <input type="hidden" name="acao" value="salvar">
    <div>
      <label for="id">Número do caminhão</label>
      <input id="id" name="id" type="number" min="1" max="999999" value="<?= (int) $form['id'] ?>" <?= $novo ? 'required' : 'readonly' ?>>
    </div>
    <div class="largura-2">
      <label for="descricao">Descrição (como aparece no app)</label>
      <input id="descricao" name="descricao" maxlength="150" value="<?= h($form['descricao']) ?>" placeholder="Ex.: São Geraldo / Humaitá" required>
    </div>
    <div>
      <label for="tipo">Tipo de coleta</label>
      <input id="tipo" name="tipo" maxlength="50" list="tipos" value="<?= h($form['tipo']) ?>" required>
      <datalist id="tipos"><?php foreach (TIPOS as $tipo): ?><option value="<?= h($tipo) ?>"><?php endforeach; ?></datalist>
    </div>
    <div>
      <label for="horario_inicio">Início da coleta</label>
      <input id="horario_inicio" name="horario_inicio" type="time" value="<?= h($form['horario_inicio']) ?>" required>
    </div>
    <div>
      <label for="horario_fim">Fim da coleta</label>
      <input id="horario_fim" name="horario_fim" type="time" value="<?= h($form['horario_fim']) ?>" required>
    </div>
    <div class="largura-2">
      <label for="cidade">Cidade</label>
      <input id="cidade" name="cidade" maxlength="120" value="<?= h($form['cidade']) ?>" required>
    </div>
    <div>
      <label for="uf">UF</label>
      <input id="uf" name="uf" maxlength="2" value="<?= h($form['uf']) ?>" required>
    </div>
    <div class="largura-total">
      <label for="bairros">Bairros atendidos</label>
      <input id="bairros" name="bairros" value="<?= h($form['bairros']) ?>" placeholder="Ex.: São Geraldo, Humaitá">
      <small>Separados por vírgula. Usados para encontrar a rota de quem mora no bairro, mesmo fora das ruas da lista.</small>
    </div>
    <div class="acoes largura-total">
      <button type="submit" class="botao"><?= $novo ? 'Cadastrar caminhão' : 'Salvar alterações' ?></button>
      <a class="botao botao-secundario" href="caminhoes.php">Voltar</a>
    </div>
  </form>
</section>

<?php if (!$novo): ?>
<section class="cartao" id="pontos">
  <div class="titulo-pagina">
    <h2>Pontos da rota (<?= count($pontos) ?>)</h2>
    <a class="botao" href="ponto.php?rota=<?= (int) $id ?>">+ Adicionar ponto</a>
  </div>
  <p class="dica">O caminhão passa pelos pontos nesta ordem. O trajeto de cada usuário termina no endereço dele.</p>

  <?php if (!$pontos): ?>
  <p class="vazio">Nenhum ponto cadastrado. Adicione pelo menos dois para formar a rota.</p>
  <?php else: ?>
  <div class="tabela-rolagem">
    <table class="tabela">
      <thead>
        <tr>
          <th scope="col">Ordem</th>
          <th scope="col">Rua</th>
          <th scope="col">CEP</th>
          <th scope="col">Latitude, longitude</th>
          <th scope="col"><span class="sr-only">Ações</span></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($pontos as $indice => $ponto): ?>
        <tr>
          <td><span class="numero-ponto"><?= (int) $ponto['ordem'] ?></span></td>
          <td><?= h($ponto['rua']) ?><?= $ponto['numero'] ? ', ' . h($ponto['numero']) : '' ?></td>
          <td class="sem-quebra"><?= $ponto['cep'] ? h(Endereco::formatarCep($ponto['cep'])) : '—' ?></td>
          <td class="sem-quebra">
            <?php if ($ponto['latitude'] !== null && $ponto['longitude'] !== null): ?>
            <?= h(rtrim(rtrim($ponto['latitude'], '0'), '.')) ?>, <?= h(rtrim(rtrim($ponto['longitude'], '0'), '.')) ?>
            <?php else: ?>
            <span class="alerta">Sem localização</span>
            <?php endif; ?>
          </td>
          <td class="acoes-linha">
            <?php foreach (['subir_ponto' => ['↑', 'Subir', $indice === 0], 'descer_ponto' => ['↓', 'Descer', $indice === count($pontos) - 1]] as $acao => [$seta, $rotulo, $desativado]): ?>
            <form method="post">
              <?= campoCsrf() ?>
              <input type="hidden" name="acao" value="<?= $acao ?>">
              <input type="hidden" name="ponto" value="<?= (int) $ponto['id'] ?>">
              <button type="submit" class="botao botao-pequeno botao-secundario" title="<?= $rotulo ?>" aria-label="<?= $rotulo ?> o ponto <?= (int) $ponto['ordem'] ?>" <?= $desativado ? 'disabled' : '' ?>><?= $seta ?></button>
            </form>
            <?php endforeach; ?>
            <a class="botao botao-pequeno botao-secundario" href="ponto.php?rota=<?= (int) $id ?>&amp;id=<?= (int) $ponto['id'] ?>">Editar</a>
            <form method="post" onsubmit="return confirm('Excluir o ponto <?= (int) $ponto['ordem'] ?>?')">
              <?= campoCsrf() ?>
              <input type="hidden" name="acao" value="excluir_ponto">
              <input type="hidden" name="ponto" value="<?= (int) $ponto['id'] ?>">
              <button type="submit" class="botao botao-pequeno botao-perigo">Excluir</button>
            </form>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <div id="mapa-rota" class="mapa" aria-label="Mapa com os pontos da rota"></div>
  <?php
  $marcadores = [];
  foreach ($pontos as $ponto) {
      if ($ponto['latitude'] !== null && $ponto['longitude'] !== null) {
          $marcadores[] = ['ordem' => (int) $ponto['ordem'], 'rua' => $ponto['rua'], 'lat' => (float) $ponto['latitude'], 'lng' => (float) $ponto['longitude']];
      }
  }
  ?>
  <script type="application/json" id="pontos-rota"><?= json_encode($marcadores, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>
  <?php endif; ?>
</section>
<?php endif; ?>
<?php
rodape($novo ? [] : ['assets/caminhao.js']);
