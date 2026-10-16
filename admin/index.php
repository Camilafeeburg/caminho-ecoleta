<?php

require_once __DIR__ . '/inc/bootstrap.php';

redirecionar(adminLogado() ? 'caminhoes.php' : 'login.php');
