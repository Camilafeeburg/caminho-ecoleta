<?php

// Rotas dos caminhões de coleta (tabelas criadas por db/caminho-estrutura.sql).
class Rota
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // =========================
    // ROTA DO USUÁRIO
    // =========================

    // Rota que atende o endereço cadastrado do usuário, com os pontos na ordem de passagem.
    // A escolha (por CEP, rua, bairro ou região do CEP) é feita pela view vw_usuario_rota.
    // Retorna null quando nenhuma rota atende o endereço.
    public function BuscarPorUsuario(
        int $usuarioId
    ): ?array {

        $sql = "SELECT r.id, r.descricao, r.tipo, r.horario_inicio, r.horario_fim, r.cidade, r.uf, ur.criterio, ur.ordem_ponto
                FROM vw_usuario_rota ur
                JOIN rotas r ON r.id = ur.rota_id
                WHERE ur.UsuarioID = :id
                LIMIT 1";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            ":id" => $usuarioId
        ]);

        $rota = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rota) {
            return null;
        }

        $stmt = $this->db->prepare(
            "SELECT ordem, rua, numero, cep, latitude, longitude
             FROM rota_pontos
             WHERE rota_id = :rota
             ORDER BY ordem"
        );

        $stmt->execute([
            ":rota" => $rota["id"]
        ]);

        $pontos = array_map(fn (array $ponto) => [
            "ordem" => (int) $ponto["ordem"],
            "rua" => $ponto["rua"],
            "numero" => $ponto["numero"],
            "cep" => $ponto["cep"] === null ? null : Endereco::formatarCep($ponto["cep"]),
            // [longitude, latitude], o formato usado pelo mapa; null quando a rua não foi localizada
            "coordenadas" => $ponto["latitude"] === null || $ponto["longitude"] === null
                ? null
                : [(float) $ponto["longitude"], (float) $ponto["latitude"]]
        ], $stmt->fetchAll(PDO::FETCH_ASSOC));

        return [
            "id" => (int) $rota["id"],
            "descricao" => $rota["descricao"],
            "tipo" => $rota["tipo"],
            // TIME vem como 18:00:00; o app mostra 18:00
            "horarioInicio" => substr($rota["horario_inicio"], 0, 5),
            "horarioFim" => substr($rota["horario_fim"], 0, 5),
            "cidade" => $rota["cidade"],
            "uf" => $rota["uf"],
            "criterio" => $rota["criterio"],
            // Ponto da rota que é o endereço do usuário (mesmo CEP ou mesma rua); null se não houver.
            "pontoUsuario" => $rota["ordem_ponto"] === null ? null : (int) $rota["ordem_ponto"],
            "pontos" => $pontos
        ];
    }
}
