<?php

// Funções comuns aos endpoints: resposta JSON e verificação do token interno.

function responderJson(int $status, array $dados): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function obterTokenRecebido(): string
{
    if (!empty($_SERVER["HTTP_X_API_TOKEN"])) {
        return (string) $_SERVER["HTTP_X_API_TOKEN"];
    }

    if (!empty($_SERVER["REDIRECT_HTTP_X_API_TOKEN"])) {
        return (string) $_SERVER["REDIRECT_HTTP_X_API_TOKEN"];
    }

    if (function_exists("getallheaders")) {
        $headers = getallheaders();
        foreach ($headers as $chave => $valor) {
            if (strcasecmp($chave, "X-Api-Token") === 0) {
                return (string) $valor;
            }
        }
    }

    if (function_exists("apache_request_headers")) {
        $headers = apache_request_headers();
        foreach ($headers as $chave => $valor) {
            if (strcasecmp($chave, "X-Api-Token") === 0) {
                return (string) $valor;
            }
        }
    }

    return "";
}

// Só o servidor Express (app) chama esta API. Ele envia o token no cabeçalho
// X-Api-Token; qualquer outra chamada, inclusive direto pelo navegador, é recusada.
function exigirTokenInterno(): void
{
    $arquivo = __DIR__ . "/../config.php";

    if (!is_file($arquivo)) {
        error_log("api: config.php não encontrado. Copie config.exemplo.php para config.php.");
        responderJson(500, [
            "sucesso" => false,
            "mensagem" => "API não configurada."
        ]);
    }

    $config = require $arquivo;
    $esperado = (string) ($config["token_interno"] ?? "");
    $recebido = obterTokenRecebido();

    if ($esperado === "" || $esperado === "troque-este-valor" || !hash_equals($esperado, $recebido)) {
        if ($esperado === "") {
            error_log("api [exigirTokenInterno]: INTERNAL_API_TOKEN não foi encontrado no .env.");
        } elseif ($recebido === "") {
            error_log("api [exigirTokenInterno]: Cabeçalho X-Api-Token não chegou ao PHP.");
        } else {
            error_log("api [exigirTokenInterno]: Token recebido não bate com o esperado.");
        }

        responderJson(403, [
            "sucesso" => false,
            "mensagem" => "Acesso não autorizado."
        ]);
    }
}
