-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Tempo de geração: 19/10/2026 às 13:20
-- Versão do servidor: 9.3.0
-- Versão do PHP: 8.5.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `ecoleta`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `administradores`
--

CREATE TABLE `administradores` (
  `id` int NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acesso` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `administradores`
--

INSERT INTO `administradores` (`id`, `usuario`, `senha`, `criado_em`, `ultimo_acesso`) VALUES
(1, 'admin', '$2y$12$0b4S3dLjlGur5WnPJPrqHOg8eoOV3cFXQGzHeQW0yWROJ83p.8E6W', '2026-10-16 09:56:35', '2026-10-16 10:01:08');

-- --------------------------------------------------------

--
-- Estrutura para tabela `bairros`
--

CREATE TABLE `bairros` (
  `id` int NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `cidade` varchar(100) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Porto Alegre',
  `estado` char(2) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'RS',
  `coleta_domiciliar` tinyint(1) DEFAULT '1',
  `coleta_seletiva` tinyint(1) DEFAULT '1',
  `coleta_automatizada` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'nao_informado',
  `observacao` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `caminhoes`
--

CREATE TABLE `caminhoes` (
  `id` int NOT NULL,
  `identificacao` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `status` enum('indisponivel','em_deslocamento','coletando','finalizado') COLLATE utf8mb4_general_ci DEFAULT 'indisponivel',
  `ultima_atualizacao` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `ecopontos`
--

CREATE TABLE `ecopontos` (
  `id` int NOT NULL,
  `nome` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `endereco` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bairro_id` int DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `materiais` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `logradouros`
--

CREATE TABLE `logradouros` (
  `id` int NOT NULL,
  `bairro_id` int NOT NULL,
  `nome` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cep` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `programacoes_coleta`
--

CREATE TABLE `programacoes_coleta` (
  `id` int NOT NULL,
  `logradouro_id` int NOT NULL,
  `tipo_coleta` enum('domiciliar','seletiva') COLLATE utf8mb4_general_ci NOT NULL,
  `dia_semana` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `turno` enum('manha','tarde','noite') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `horario_inicio` time DEFAULT NULL,
  `horario_fim` time DEFAULT NULL,
  `observacao` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `rotas`
--

CREATE TABLE `rotas` (
  `id` int NOT NULL,
  `descricao` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `horario_inicio` time NOT NULL,
  `horario_fim` time NOT NULL,
  `cidade` varchar(120) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Porto Alegre',
  `uf` char(2) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'RS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `rotas`
--

INSERT INTO `rotas` (`id`, `descricao`, `tipo`, `horario_inicio`, `horario_fim`, `cidade`, `uf`) VALUES
(1, 'São Geraldo / Humaitá', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS'),
(2, 'Moinhos de Vento', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS'),
(3, 'Centro Histórico / Farroupilha', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS'),
(4, 'Higienópolis / Cristo Redentor', 'Coleta Seletiva', '18:00:00', '21:00:00', 'Porto Alegre', 'RS');

-- --------------------------------------------------------

--
-- Estrutura para tabela `rota_bairros`
--

CREATE TABLE `rota_bairros` (
  `rota_id` int NOT NULL,
  `bairro` varchar(120) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `rota_bairros`
--

INSERT INTO `rota_bairros` (`rota_id`, `bairro`) VALUES
(3, 'Centro Histórico'),
(4, 'Cristo Redentor'),
(3, 'Farroupilha'),
(4, 'Higienópolis'),
(1, 'Humaitá'),
(2, 'Moinhos de Vento'),
(1, 'São Geraldo');

-- --------------------------------------------------------

--
-- Estrutura para tabela `rota_pontos`
--

CREATE TABLE `rota_pontos` (
  `id` int NOT NULL,
  `rota_id` int NOT NULL,
  `ordem` smallint NOT NULL,
  `rua` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `numero` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cep` char(8) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `rota_pontos`
--

INSERT INTO `rota_pontos` (`id`, `rota_id`, `ordem`, `rua`, `numero`, `cep`, `latitude`, `longitude`) VALUES
(42, 1, 1, 'Rua São Pedro', NULL, '90240005', -30.0105390, -51.2019810),
(43, 1, 2, 'Avenida Pernambuco', NULL, '90240000', -29.9984820, -51.1967290),
(44, 1, 3, 'Rua Dona Margarida', NULL, '90240610', -29.9989550, -51.1975140),
(45, 1, 4, 'Avenida A. J. Renner', NULL, '90245000', -29.9918920, -51.1958030),
(46, 1, 5, 'Rua Monsenhor Felipe Diehl', NULL, '90250000', -29.9956870, -51.1965860),
(47, 1, 6, 'Rua Simão Kappel', NULL, '90240210', -29.9935560, -51.1984310),
(48, 1, 7, 'Rua São Jorge', NULL, '90240550', -29.9943430, -51.2008920),
(49, 1, 8, 'Rua Frederico Mentz', NULL, '90240110', -29.9907300, -51.2004090),
(50, 1, 9, 'Rua General Marcos Kruchin', NULL, '90240000', -29.9853350, -51.1963550),
(51, 1, 10, 'Avenida A. J. Renner', NULL, '90250000', -29.9863510, -51.1939170),
(52, 1, 11, 'Rua Padre Maximiliano Kolbe', NULL, '90250210', -29.9820180, -51.1912430),
(53, 1, 12, 'Avenida Palmira Gobbi', NULL, '90250210', -29.9870120, -51.1917320),
(54, 2, 1, 'Rua Voluntários da Pátria', NULL, '90230010', -30.0096530, -51.2099130),
(55, 2, 2, 'Rua Comendador Álvaro Guaspari', NULL, '90035020', -30.0232310, -51.2167400),
(56, 2, 3, 'Rua João Adão Pacheco Dornelles', NULL, '90035024', NULL, NULL),
(57, 2, 4, 'Rua Walmor Paulo Sauter', NULL, '90035022', NULL, NULL),
(58, 2, 5, 'Rua Santo Antônio', NULL, '90220010', -30.0314280, -51.2142090),
(59, 2, 6, 'Rua Irmão José Otão', NULL, NULL, -30.0311440, -51.2145500),
(60, 2, 7, 'Rua Vasco da Gama', NULL, NULL, -30.0321830, -51.2068300),
(61, 2, 8, 'Rua Mariante', NULL, NULL, -30.0281500, -51.2043990),
(62, 2, 9, 'Avenida Goethe', NULL, NULL, -30.0250580, -51.2003750),
(63, 2, 10, 'Rua Mostardeiro', NULL, NULL, -30.0287380, -51.2050950),
(64, 2, 11, 'Rua Mostardeiro', '820', '90010380', -30.0285980, -51.1988250),
(65, 3, 1, 'Rua dos Andradas', NULL, '90020000', -30.0327540, -51.2380290),
(66, 3, 2, 'Avenida Borges de Medeiros', NULL, '90020020', -30.0337370, -51.2279750),
(67, 3, 3, 'Praça Dom Feliciano', NULL, '90020160', -30.0298700, -51.2231290),
(68, 3, 4, 'Avenida Independência', NULL, NULL, -30.0296020, -51.2217630),
(69, 3, 5, 'Avenida Osvaldo Aranha', NULL, NULL, -30.0325430, -51.2198820),
(70, 3, 6, 'Avenida José Bonifácio', NULL, NULL, -30.0394490, -51.2157840),
(71, 3, 7, 'Rua Santana', NULL, NULL, -30.0393170, -51.2142280),
(72, 3, 8, 'Rua Vieira de Castro', '215', '90040320', -30.0395940, -51.2121370),
(73, 4, 1, 'Rua Dom Pedro II', NULL, '90560002', -30.0159580, -51.1867290),
(74, 4, 2, 'Avenida Cristóvão Colombo', NULL, '90560003', -30.0169960, -51.1824070),
(75, 4, 3, 'Travessa São Jacó', NULL, NULL, -30.0157180, -51.1818350),
(76, 4, 4, 'Rua Doutor Eduardo Chartier', NULL, NULL, -30.0139670, -51.1804930),
(77, 4, 5, 'Rua Ari Marinho', NULL, NULL, -30.0132540, -51.1795840),
(78, 4, 6, 'Rua Marechal José Inácio da Silva', NULL, NULL, -30.0141770, -51.1785110),
(79, 4, 7, 'Rua Pistóia', NULL, NULL, -30.0118720, -51.1765050),
(80, 4, 8, 'Avenida Brasiliano Índio de Moraes', NULL, NULL, -30.0115540, -51.1733970),
(81, 4, 9, 'Avenida Assis Brasil', NULL, NULL, -30.0117710, -51.1676620),
(82, 4, 10, 'Avenida do Forte', '290', '91360000', -30.0109200, -51.1532510);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `Nome` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `Senha` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `UsuarioID` int NOT NULL,
  `Email` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `CEP` varchar(11) COLLATE utf8mb4_general_ci NOT NULL,
  `Logradouro` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Bairro` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Cidade` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Uf` char(2) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`Nome`, `Senha`, `UsuarioID`, `Email`, `CEP`, `Logradouro`, `Bairro`, `Cidade`, `Uf`) VALUES
('mariaeduarda2309', '$2y$10$N7wYGbRgRiiz4t.pUoFNxOAVLl4rcmtiSSj92inPSx.Zb2YvTezXS', 3, 'dudasummchen@gmail.com', '90830244', 'Rua Wilson Adnislen Freitas de Paiva Bueno', 'Cavalhada', 'Porto Alegre', 'RS'),
('cassiano.ramos', '$2y$10$HdyT3OTSdZOL62clGVxbiOJ9gv/bKDtkbIbb/16OtNJiz1wcygCja', 4, 'cassianoramos@gmail.com', '91000000', NULL, NULL, NULL, NULL),
('TETEUZINH663', '$2y$10$yk/j3IM.SGpfQzPCdUbNDe0iZ5ltcb3agA1GR7OcfRjRPL/CYSNsa', 5, 'ILIHBYGY@gmail.com', '90690200', NULL, NULL, NULL, NULL),
('joao goty', '$2y$10$hpdS.pzWvno0AJeapLaCR.HXD23.efGoOQMcompE9ZZIcZ0DQfFZC', 6, 'goty@hotmail.com', '90250730', 'Rua Amaury Crivela Costa', 'Farrapos', 'Porto Alegre', 'RS'),
('William de Campos Vi', '$2y$10$Xs8pp4QBeDm7dLntrH61cOajqteXz4VmwCk9zXNNL/N5zG0GFotke', 7, 'willgordo@gmail.com', '98772213', NULL, NULL, NULL, NULL),
('William de Campos Vi', '$2y$10$Xs8pp4QBeDm7dLntrH61cOajqteXz4VmwCk9zXNNL/N5zG0GFotke', 8, 'willgordo@gmail.com', '98772213', NULL, NULL, NULL, NULL),
('dudinha', '$2y$10$zFNbkIZDpgsrM2yipuR4ou.fGAozV41qS8YjdeT9xKrZRPdRWuzeC', 9, 'dudinha@gmail.com', '', NULL, NULL, NULL, NULL),
('Dudateste', '$2y$10$YQNLSyfGhVbD5Sni/oLa.uGyoSS2efren/.HuZGcaIsadlgb0hKbW', 11, 'dudateste@gmail.com', '', NULL, NULL, NULL, NULL),
('camilete', '$2y$10$Jf3AaRnA4PkUv6xkUNWyvOrDaJlBx/5xQkLpUdeHUiGN0YeCDUAAi', 12, 'camileta@gmail.com', '90240-550', 'Rua São Jorge', 'Humaita', 'Porto Alegre', 'RS'),
('snoopfeeburg', '$2y$10$QfVzh2KfYPxg2VrkXOlv7ujMUR4rDDNcqrz9zUTDZWhpPNWGFzvAa', 13, 'snoopfofo@gmail.com', '', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `vw_usuario_rota`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `vw_usuario_rota` (
`UsuarioID` int
,`rota_id` int
,`criterio` varchar(10)
,`ordem_ponto` smallint
);

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `vw_usuario_rota_pontos`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `vw_usuario_rota_pontos` (
`UsuarioID` int
,`criterio` varchar(10)
,`ordem_ponto_usuario` smallint
,`rota_id` int
,`descricao` varchar(150)
,`tipo` varchar(50)
,`horario_inicio` time
,`horario_fim` time
,`ordem` smallint
,`rua` varchar(200)
,`numero` varchar(10)
,`cep` char(8)
,`latitude` decimal(10,7)
,`longitude` decimal(10,7)
);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `administradores`
--
ALTER TABLE `administradores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_administradores_usuario` (`usuario`);

--
-- Índices de tabela `bairros`
--
ALTER TABLE `bairros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `caminhoes`
--
ALTER TABLE `caminhoes`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `ecopontos`
--
ALTER TABLE `ecopontos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bairro_id` (`bairro_id`);

--
-- Índices de tabela `logradouros`
--
ALTER TABLE `logradouros`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bairro_id` (`bairro_id`);

--
-- Índices de tabela `programacoes_coleta`
--
ALTER TABLE `programacoes_coleta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `logradouro_id` (`logradouro_id`);

--
-- Índices de tabela `rotas`
--
ALTER TABLE `rotas`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `rota_bairros`
--
ALTER TABLE `rota_bairros`
  ADD PRIMARY KEY (`rota_id`,`bairro`),
  ADD KEY `idx_rota_bairros_bairro` (`bairro`);

--
-- Índices de tabela `rota_pontos`
--
ALTER TABLE `rota_pontos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_rota_pontos_ordem` (`rota_id`,`ordem`),
  ADD KEY `idx_rota_pontos_cep` (`cep`),
  ADD KEY `idx_rota_pontos_rua` (`rua`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`UsuarioID`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `administradores`
--
ALTER TABLE `administradores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `bairros`
--
ALTER TABLE `bairros`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `caminhoes`
--
ALTER TABLE `caminhoes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `ecopontos`
--
ALTER TABLE `ecopontos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `logradouros`
--
ALTER TABLE `logradouros`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `programacoes_coleta`
--
ALTER TABLE `programacoes_coleta`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `rota_pontos`
--
ALTER TABLE `rota_pontos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `UsuarioID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

-- --------------------------------------------------------

--
-- Estrutura para view `vw_usuario_rota`
--
DROP TABLE IF EXISTS `vw_usuario_rota`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_usuario_rota`  AS WITH   `enderecos` as (select `usuarios`.`UsuarioID` AS `UsuarioID`,replace(`usuarios`.`CEP`,'-','') AS `cep`,nullif(trim(`usuarios`.`Bairro`),'') AS `bairro`,nullif(trim(`usuarios`.`Cidade`),'') AS `cidade`,nullif(trim(substring_index(`usuarios`.`Logradouro`,',',1)),'') AS `logradouro` from `usuarios`), `usuarios_normalizados` as (select `enderecos`.`UsuarioID` AS `UsuarioID`,`enderecos`.`cep` AS `cep`,`enderecos`.`bairro` AS `bairro`,`enderecos`.`cidade` AS `cidade`,(case when (`enderecos`.`logradouro` like 'Av. %') then concat('Avenida ',trim(substr(`enderecos`.`logradouro`,4))) when (`enderecos`.`logradouro` like 'R. %') then concat('Rua ',trim(substr(`enderecos`.`logradouro`,3))) when (`enderecos`.`logradouro` like 'Tv. %') then concat('Travessa ',trim(substr(`enderecos`.`logradouro`,4))) when (`enderecos`.`logradouro` like 'Al. %') then concat('Alameda ',trim(substr(`enderecos`.`logradouro`,4))) when (`enderecos`.`logradouro` like 'Pç. %') then concat('Praça ',trim(substr(`enderecos`.`logradouro`,4))) when (`enderecos`.`logradouro` like 'Pça. %') then concat('Praça ',trim(substr(`enderecos`.`logradouro`,5))) else `enderecos`.`logradouro` end) AS `rua` from `enderecos`), `candidatos` as (select distinct `u`.`UsuarioID` AS `UsuarioID`,`u`.`bairro` AS `bairro`,`p`.`rota_id` AS `rota_id`,1 AS `prioridade`,'cep' AS `criterio`,`p`.`ordem` AS `ordem_ponto` from (`usuarios_normalizados` `u` join `rota_pontos` `p` on((`p`.`cep` = `u`.`cep`))) union all select distinct `u`.`UsuarioID` AS `UsuarioID`,`u`.`bairro` AS `bairro`,`p`.`rota_id` AS `rota_id`,2 AS `2`,'logradouro' AS `logradouro`,`p`.`ordem` AS `ordem` from ((`usuarios_normalizados` `u` join `rotas` `r` on((`r`.`cidade` = `u`.`cidade`))) join `rota_pontos` `p` on(((`p`.`rota_id` = `r`.`id`) and (`p`.`rua` = `u`.`rua`)))) union all select `u`.`UsuarioID` AS `UsuarioID`,`u`.`bairro` AS `bairro`,`b`.`rota_id` AS `rota_id`,3 AS `3`,'bairro' AS `bairro`,NULL AS `NULL` from ((`usuarios_normalizados` `u` join `rota_bairros` `b` on((`b`.`bairro` = `u`.`bairro`))) join `rotas` `r` on(((`r`.`id` = `b`.`rota_id`) and (`r`.`cidade` = `u`.`cidade`)))) union all select distinct `u`.`UsuarioID` AS `UsuarioID`,`u`.`bairro` AS `bairro`,`p`.`rota_id` AS `rota_id`,4 AS `4`,'regiao_cep' AS `regiao_cep`,NULL AS `NULL` from (`usuarios_normalizados` `u` join `rota_pontos` `p` on((left(`p`.`cep`,5) = left(`u`.`cep`,5)))) where (char_length(`u`.`cep`) = 8)), `classificados` as (select `c`.`UsuarioID` AS `UsuarioID`,`c`.`rota_id` AS `rota_id`,`c`.`criterio` AS `criterio`,`c`.`ordem_ponto` AS `ordem_ponto`,row_number() OVER (PARTITION BY `c`.`UsuarioID` ORDER BY `c`.`prioridade`,exists(select 1 from `rota_bairros` `b` where ((`b`.`rota_id` = `c`.`rota_id`) and (`b`.`bairro` = `c`.`bairro`))) desc,`c`.`rota_id`,`c`.`ordem_ponto` )  AS `posicao` from `candidatos` `c`) select `classificados`.`UsuarioID` AS `UsuarioID`,`classificados`.`rota_id` AS `rota_id`,`classificados`.`criterio` AS `criterio`,`classificados`.`ordem_ponto` AS `ordem_ponto` from `classificados` where (`classificados`.`posicao` = 1)  ;

-- --------------------------------------------------------

--
-- Estrutura para view `vw_usuario_rota_pontos`
--
DROP TABLE IF EXISTS `vw_usuario_rota_pontos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_usuario_rota_pontos`  AS SELECT `ur`.`UsuarioID` AS `UsuarioID`, `ur`.`criterio` AS `criterio`, `ur`.`ordem_ponto` AS `ordem_ponto_usuario`, `r`.`id` AS `rota_id`, `r`.`descricao` AS `descricao`, `r`.`tipo` AS `tipo`, `r`.`horario_inicio` AS `horario_inicio`, `r`.`horario_fim` AS `horario_fim`, `p`.`ordem` AS `ordem`, `p`.`rua` AS `rua`, `p`.`numero` AS `numero`, `p`.`cep` AS `cep`, `p`.`latitude` AS `latitude`, `p`.`longitude` AS `longitude` FROM ((`vw_usuario_rota` `ur` join `rotas` `r` on((`r`.`id` = `ur`.`rota_id`))) join `rota_pontos` `p` on((`p`.`rota_id` = `r`.`id`))) ;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `ecopontos`
--
ALTER TABLE `ecopontos`
  ADD CONSTRAINT `ecopontos_ibfk_1` FOREIGN KEY (`bairro_id`) REFERENCES `bairros` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `logradouros`
--
ALTER TABLE `logradouros`
  ADD CONSTRAINT `logradouros_ibfk_1` FOREIGN KEY (`bairro_id`) REFERENCES `bairros` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `programacoes_coleta`
--
ALTER TABLE `programacoes_coleta`
  ADD CONSTRAINT `programacoes_coleta_ibfk_1` FOREIGN KEY (`logradouro_id`) REFERENCES `logradouros` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `rota_bairros`
--
ALTER TABLE `rota_bairros`
  ADD CONSTRAINT `fk_rota_bairros_rota` FOREIGN KEY (`rota_id`) REFERENCES `rotas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `rota_pontos`
--
ALTER TABLE `rota_pontos`
  ADD CONSTRAINT `fk_rota_pontos_rota` FOREIGN KEY (`rota_id`) REFERENCES `rotas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
