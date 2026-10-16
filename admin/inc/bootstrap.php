<?php

// Base de todas as páginas do admin: sessão, banco, login obrigatório, CSRF e mensagens.

ini_set('display_errors', '0');

require_once __DIR__ . '/../../api/classes/Database.php';
require_once __DIR__ . '/../../api/classes/Endereco.php';

// Sessão própria do admin, separada da do website, válida só na pasta admin.
session_name('ecoleta_admin');
session_set_cookie_params([
    'path' => rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

function db(): PDO
{
    static $pdo = null;
    return $pdo ??= (new Database())->conectar();
}

// Escapa texto para HTML.
function h(?string $texto): string
{
    return htmlspecialchars((string) $texto, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirecionar(string $destino): never
{
    header('Location: ' . $destino);
    exit;
}

function adminLogado(): ?array
{
    return $_SESSION['admin'] ?? null;
}

// Páginas internas: sem login, volta para o login.
function exigirLogin(): array
{
    $admin = adminLogado();
    if ($admin === null) {
        redirecionar('login.php');
    }
    return $admin;
}

// Token contra CSRF, enviado em todo formulário POST.
function csrfToken(): string
{
    return $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}

function campoCsrf(): string
{
    return '<input type="hidden" name="csrf" value="' . h(csrfToken()) . '">';
}

function exigirCsrf(): void
{
    $recebido = (string) ($_POST['csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals(csrfToken(), $recebido)) {
        http_response_code(400);
        exit('Sessão do formulário expirada. Volte, recarregue a página e tente novamente.');
    }
}

// Mensagem exibida na próxima página (depois de um redirecionamento).
function avisar(string $tipo, string $texto): void
{
    $_SESSION['aviso'] = ['tipo' => $tipo, 'texto' => $texto];
}

function pegarAviso(): ?array
{
    $aviso = $_SESSION['aviso'] ?? null;
    unset($_SESSION['aviso']);
    return $aviso;
}
