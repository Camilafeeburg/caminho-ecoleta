<?php

require_once __DIR__ . '/inc/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirecionar('caminhoes.php');
}

exigirCsrf();
$_SESSION = [];
session_destroy();
redirecionar('login.php');
