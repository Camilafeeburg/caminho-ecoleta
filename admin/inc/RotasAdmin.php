<?php

// Cadastro de caminhões (tabela rotas, um registro por caminhão) e dos pontos de cada rota
// (rota_pontos). Estrutura em db/caminho-estrutura.sql.
class RotasAdmin
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // =========================
    // CAMINHÕES
    // =========================

    public function listar(): array
    {
        return $this->db->query(
            "SELECT r.*,
                    (SELECT COUNT(*) FROM rota_pontos p WHERE p.rota_id = r.id) AS total_pontos,
                    (SELECT GROUP_CONCAT(b.bairro ORDER BY b.bairro SEPARATOR ', ') FROM rota_bairros b WHERE b.rota_id = r.id) AS bairros
             FROM rotas r
             ORDER BY r.id"
        )->fetchAll(PDO::FETCH_ASSOC);
    }

    public function buscar(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM rotas WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $rota = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$rota) {
            return null;
        }

        $stmt = $this->db->prepare('SELECT bairro FROM rota_bairros WHERE rota_id = :id ORDER BY bairro');
        $stmt->execute([':id' => $id]);
        $rota['bairros'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return $rota;
    }

    public function proximoNumero(): int
    {
        return (int) $this->db->query('SELECT COALESCE(MAX(id), 0) + 1 FROM rotas')->fetchColumn();
    }

    public function existe(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM rotas WHERE id = :id');
        $stmt->execute([':id' => $id]);
        return $stmt->fetchColumn() !== false;
    }

    // Cria ($novo = true) ou altera o caminhão; os bairros atendidos são substituídos pela lista recebida.
    public function salvar(array $dados, bool $novo): void
    {
        $this->db->beginTransaction();
        try {
            $sql = $novo
                ? 'INSERT INTO rotas (id, descricao, tipo, horario_inicio, horario_fim, cidade, uf)
                   VALUES (:id, :descricao, :tipo, :inicio, :fim, :cidade, :uf)'
                : 'UPDATE rotas SET descricao = :descricao, tipo = :tipo, horario_inicio = :inicio,
                       horario_fim = :fim, cidade = :cidade, uf = :uf
                   WHERE id = :id';
            $this->db->prepare($sql)->execute([
                ':id' => $dados['id'],
                ':descricao' => $dados['descricao'],
                ':tipo' => $dados['tipo'],
                ':inicio' => $dados['horario_inicio'],
                ':fim' => $dados['horario_fim'],
                ':cidade' => $dados['cidade'],
                ':uf' => $dados['uf'],
            ]);

            $this->db->prepare('DELETE FROM rota_bairros WHERE rota_id = :id')->execute([':id' => $dados['id']]);
            $inserir = $this->db->prepare('INSERT INTO rota_bairros (rota_id, bairro) VALUES (:id, :bairro)');
            foreach ($dados['bairros'] as $bairro) {
                $inserir->execute([':id' => $dados['id'], ':bairro' => $bairro]);
            }

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Os pontos e bairros do caminhão saem junto (ON DELETE CASCADE).
    public function excluir(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM rotas WHERE id = :id');
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // =========================
    // PONTOS DA ROTA
    // =========================

    public function pontos(int $rotaId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM rota_pontos WHERE rota_id = :id ORDER BY ordem');
        $stmt->execute([':id' => $rotaId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function ponto(int $rotaId, int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM rota_pontos WHERE rota_id = :rota AND id = :id');
        $stmt->execute([':rota' => $rotaId, ':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // Insere ($id = null) ou altera o ponto, colocando-o na posição $ordem (1 = início da rota).
    public function salvarPonto(int $rotaId, ?int $id, array $dados, int $ordem): void
    {
        $this->db->beginTransaction();
        try {
            $total = $this->totalPontos($rotaId);

            if ($id === null) {
                $ordem = max(1, min($ordem, $total + 1));
                // Abre espaço: de trás para frente, para não repetir a ordem (chave única rota_id + ordem).
                $this->db->prepare('UPDATE rota_pontos SET ordem = ordem + 1 WHERE rota_id = :rota AND ordem >= :ordem ORDER BY ordem DESC')
                    ->execute([':rota' => $rotaId, ':ordem' => $ordem]);
                $this->db->prepare(
                    'INSERT INTO rota_pontos (rota_id, ordem, rua, numero, cep, latitude, longitude)
                     VALUES (:rota, :ordem, :rua, :numero, :cep, :latitude, :longitude)'
                )->execute([':rota' => $rotaId, ':ordem' => $ordem] + $this->parametrosPonto($dados));
            } else {
                $atual = $this->ponto($rotaId, $id);
                if ($atual === null) {
                    throw new RuntimeException('Ponto não encontrado.');
                }
                $this->db->prepare(
                    'UPDATE rota_pontos SET rua = :rua, numero = :numero, cep = :cep, latitude = :latitude, longitude = :longitude
                     WHERE rota_id = :rota AND id = :id'
                )->execute([':rota' => $rotaId, ':id' => $id] + $this->parametrosPonto($dados));
                $this->reposicionar($rotaId, $id, (int) $atual['ordem'], max(1, min($ordem, $total)));
            }

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Remove o ponto e fecha o buraco na sequência.
    public function excluirPonto(int $rotaId, int $id): bool
    {
        $this->db->beginTransaction();
        try {
            $ponto = $this->ponto($rotaId, $id);
            if ($ponto === null) {
                $this->db->rollBack();
                return false;
            }
            $this->db->prepare('DELETE FROM rota_pontos WHERE rota_id = :rota AND id = :id')->execute([':rota' => $rotaId, ':id' => $id]);
            $this->db->prepare('UPDATE rota_pontos SET ordem = ordem - 1 WHERE rota_id = :rota AND ordem > :ordem ORDER BY ordem ASC')
                ->execute([':rota' => $rotaId, ':ordem' => $ponto['ordem']]);
            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Sobe (-1) ou desce (+1) o ponto uma posição.
    public function moverPonto(int $rotaId, int $id, int $direcao): void
    {
        $this->db->beginTransaction();
        try {
            $ponto = $this->ponto($rotaId, $id);
            if ($ponto !== null) {
                $destino = (int) $ponto['ordem'] + ($direcao < 0 ? -1 : 1);
                if ($destino >= 1 && $destino <= $this->totalPontos($rotaId)) {
                    $this->reposicionar($rotaId, $id, (int) $ponto['ordem'], $destino);
                }
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function totalPontos(int $rotaId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM rota_pontos WHERE rota_id = :id');
        $stmt->execute([':id' => $rotaId]);
        return (int) $stmt->fetchColumn();
    }

    // Leva o ponto de $de para $para, deslocando os que estão entre as duas posições.
    // O ponto fica em 0 durante a troca para não repetir a ordem (chave única rota_id + ordem).
    private function reposicionar(int $rotaId, int $id, int $de, int $para): void
    {
        if ($de === $para) {
            return;
        }
        $this->db->prepare('UPDATE rota_pontos SET ordem = 0 WHERE rota_id = :rota AND id = :id')->execute([':rota' => $rotaId, ':id' => $id]);
        if ($para < $de) {
            $this->db->prepare('UPDATE rota_pontos SET ordem = ordem + 1 WHERE rota_id = :rota AND ordem >= :para AND ordem < :de ORDER BY ordem DESC')
                ->execute([':rota' => $rotaId, ':para' => $para, ':de' => $de]);
        } else {
            $this->db->prepare('UPDATE rota_pontos SET ordem = ordem - 1 WHERE rota_id = :rota AND ordem > :de AND ordem <= :para ORDER BY ordem ASC')
                ->execute([':rota' => $rotaId, ':para' => $para, ':de' => $de]);
        }
        $this->db->prepare('UPDATE rota_pontos SET ordem = :para WHERE rota_id = :rota AND id = :id')
            ->execute([':rota' => $rotaId, ':id' => $id, ':para' => $para]);
    }

    private function parametrosPonto(array $dados): array
    {
        return [
            ':rua' => $dados['rua'],
            ':numero' => $dados['numero'],
            ':cep' => $dados['cep'],
            ':latitude' => $dados['latitude'],
            ':longitude' => $dados['longitude'],
        ];
    }
}
