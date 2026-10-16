<?php

// Busca do CEP no admin: endereço (ViaCEP) e latitude/longitude (OpenStreetMap).
// GET cep.php?cep=90240550&numero=123 -> JSON

require_once __DIR__ . '/inc/bootstrap.php';
require_once __DIR__ . '/inc/Geocodificador.php';

header('Content-Type: application/json; charset=UTF-8');

function responder(int $status, array $dados): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

if (adminLogado() === null) {
    responder(401, ['sucesso' => false, 'mensagem' => 'Sessão expirada. Faça login novamente.']);
}

$cep = Endereco::somenteDigitos((string) ($_GET['cep'] ?? ''));
$numero = trim((string) ($_GET['numero'] ?? ''));

if (strlen($cep) !== 8) {
    responder(400, ['sucesso' => false, 'mensagem' => 'Informe um CEP com 8 dígitos.']);
}

try {
    $endereco = Endereco::buscarPorCep($cep);
} catch (RuntimeException $e) {
    error_log('admin cep: ' . $e->getMessage());
    responder(503, ['sucesso' => false, 'mensagem' => 'O serviço de CEP não respondeu. Tente novamente em instantes.']);
}

if ($endereco === null) {
    responder(404, ['sucesso' => false, 'mensagem' => 'CEP não encontrado.']);
}

$localizacao = null;
$aviso = null;
try {
    $localizacao = Geocodificador::localizar(
        $endereco['logradouro'],
        $numero === '' ? null : mb_substr($numero, 0, 10),
        $endereco['bairro'],
        $endereco['cidade'],
        $endereco['uf'],
        $cep
    );
} catch (RuntimeException $e) {
    error_log('admin geocodificação: ' . $e->getMessage());
    $aviso = 'O serviço de mapas não respondeu. Marque o ponto clicando no mapa.';
}

if ($localizacao === null && $aviso === null) {
    $aviso = 'Endereço encontrado, mas sem localização no mapa. Marque o ponto clicando no mapa.';
} elseif ($localizacao !== null && $localizacao['precisao'] === 'bairro') {
    $aviso = 'A rua não foi localizada no mapa; o marcador está no centro do bairro. Ajuste-o na rua certa.';
}

responder(200, [
    'sucesso' => true,
    'endereco' => [
        'cep' => Endereco::formatarCep($cep),
        'logradouro' => $endereco['logradouro'],
        'bairro' => $endereco['bairro'],
        'cidade' => $endereco['cidade'],
        'uf' => $endereco['uf'],
    ],
    'localizacao' => $localizacao,
    'aviso' => $aviso,
]);
