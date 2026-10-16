<?php

ini_set("display_errors", "0");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/classes/Api.php";

// Chamado pelo servidor Express com o id do usuário logado: rota_usuario.php?id=123
// Retorna o endereço cadastrado do usuário e a rota do caminhão que atende esse endereço.
exigirTokenInterno();

require_once __DIR__ . "/classes/Database.php";
require_once __DIR__ . "/classes/Usuarios.php";
require_once __DIR__ . "/classes/Rotas.php";

$id = intval($_GET["id"] ?? 0);

if ($id <= 0) {
    responderJson(400, [
        "sucesso" => false,
        "mensagem" => "Informe o id do usuário."
    ]);
}

try {
    $db = (new Database())->conectar();

    try {
        // Busca o endereço pelo CEP (ViaCEP) se ainda não estiver gravado.
        $usuario = (new Usuario($db))->BuscarEndereco($id);
    } catch (RuntimeException $e) {
        error_log("rota_usuario.php: " . $e->getMessage());
        responderJson(503, [
            "sucesso" => false,
            "mensagem" => "Não foi possível obter o seu endereço agora. Tente novamente em instantes."
        ]);
    }

    if ($usuario === null) {
        responderJson(404, [
            "sucesso" => false,
            "mensagem" => "Usuário não encontrado."
        ]);
    }

    if (empty($usuario["CEP"])) {
        responderJson(422, [
            "sucesso" => false,
            "mensagem" => "Seu cadastro não tem CEP. Informe o CEP para ver a rota do caminhão."
        ]);
    }

    $cep = Endereco::formatarCep($usuario["CEP"]);

    if (empty($usuario["Cidade"])) {
        responderJson(422, [
            "sucesso" => false,
            "mensagem" => "O CEP do seu cadastro ({$cep}) não foi encontrado."
        ]);
    }

    $rota = (new Rota($db))->BuscarPorUsuario($id);

    if ($rota === null) {
        $local = $usuario["Bairro"] ? "{$usuario["Bairro"]}, CEP {$cep}" : "CEP {$cep}";
        responderJson(404, [
            "sucesso" => false,
            "mensagem" => "Ainda não há rota de coleta cadastrada para o seu endereço ({$local})."
        ]);
    }

    responderJson(200, [
        "sucesso" => true,
        "usuario" => $usuario["Nome"],
        "endereco" => [
            "cep" => $cep,
            // CEP geral de cidade não tem rua; usa o bairro ou a cidade para localizar no mapa.
            "logradouro" => $usuario["Logradouro"] ?: ($usuario["Bairro"] ?: $usuario["Cidade"]),
            "bairro" => $usuario["Bairro"] ?? "",
            "cidade" => $usuario["Cidade"],
            "uf" => $usuario["Uf"] ?? ""
        ],
        "rota" => $rota
    ]);
} catch (Throwable $e) {
    error_log("rota_usuario.php: " . $e->getMessage());
    responderJson(500, [
        "sucesso" => false,
        "mensagem" => "Erro interno do servidor."
    ]);
}
