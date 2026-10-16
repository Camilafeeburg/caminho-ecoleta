<?php

// Latitude e longitude de um endereço pelo Nominatim (OpenStreetMap).
// Uso leve: uma consulta (ou duas) por clique em "Buscar CEP" no admin.
// Política de uso: https://operations.osmfoundation.org/policies/nominatim/
class Geocodificador
{
    private const URL = 'https://nominatim.openstreetmap.org/search';
    private const USER_AGENT = 'ecoleta-admin/1.0 (cadastro de rotas de coleta)';

    // Retorna ['latitude', 'longitude', 'precisao', 'descricao'] ou null se nada for encontrado.
    // precisao: 'numero' (endereço com número), 'rua' (trecho da rua no CEP/bairro) ou 'bairro' (centro do bairro).
    // Lança RuntimeException quando o serviço não responde.
    public static function localizar(string $logradouro, ?string $numero, string $bairro, string $cidade, string $uf, string $cep): ?array
    {
        $cepDigitos = Endereco::somenteDigitos($cep);

        if ($logradouro !== '') {
            if ($numero !== null && $numero !== '') {
                $comNumero = self::melhor(self::buscar(['street' => "{$numero} {$logradouro}", 'city' => $cidade, 'state' => $uf]), $logradouro, $bairro, $cepDigitos);
                if ($comNumero !== null && ($comNumero['tipo'] ?? '') === 'house') {
                    return self::resultado($comNumero, 'numero');
                }
            }

            // Ruas com o mesmo nome em outros bairros são comuns: escolhe o trecho do CEP ou do bairro.
            $rua = self::melhor(self::buscar(['street' => $logradouro, 'city' => $cidade, 'state' => $uf]), $logradouro, $bairro, $cepDigitos);
            if ($rua !== null && ($rua['cepConfere'] || $rua['bairroConfere'])) {
                return self::resultado($rua, 'rua');
            }
        }

        if ($bairro !== '') {
            $centro = self::buscar(['q' => "{$bairro}, {$cidade}, {$uf}"], 1)[0] ?? null;
            if ($centro !== null) {
                return self::resultado(self::candidato($centro, $logradouro, $bairro, $cepDigitos), 'bairro');
            }
        }

        return null;
    }

    private static function buscar(array $parametros, int $limite = 30): array
    {
        $url = self::URL . '?' . http_build_query($parametros + [
            'country' => 'Brasil',
            'countrycodes' => 'br',
            'format' => 'jsonv2',
            'addressdetails' => 1,
            'limit' => $limite,
        ]);

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_PROXY => '',
            CURLOPT_USERAGENT => self::USER_AGENT,
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'Accept-Language: pt-BR'],
        ]);
        $corpo = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

        if ($corpo === false || $status !== 200) {
            throw new RuntimeException('Serviço de mapas indisponível (' . ($corpo === false ? curl_error($curl) : "HTTP {$status}") . ').');
        }

        $dados = json_decode($corpo, true);
        return is_array($dados) ? $dados : [];
    }

    // Candidato que melhor corresponde ao CEP, ao nome da rua e ao bairro.
    private static function melhor(array $resultados, string $logradouro, string $bairro, string $cep): ?array
    {
        $melhor = null;
        foreach ($resultados as $resultado) {
            $candidato = self::candidato($resultado, $logradouro, $bairro, $cep);
            if ($melhor === null || $candidato['pontos'] > $melhor['pontos']) {
                $melhor = $candidato;
            }
        }
        return $melhor;
    }

    private static function candidato(array $resultado, string $logradouro, string $bairro, string $cep): array
    {
        $endereco = $resultado['address'] ?? [];
        $bairroResultado = $endereco['suburb'] ?? $endereco['city_district'] ?? $endereco['neighbourhood'] ?? '';
        $cepConfere = $cep !== '' && Endereco::somenteDigitos((string) ($endereco['postcode'] ?? '')) === $cep;
        $bairroConfere = $bairro !== '' && self::normalizar($bairroResultado) === self::normalizar($bairro);
        $nomeConfere = $logradouro !== '' && self::normalizar((string) ($resultado['name'] ?? '')) === self::normalizar($logradouro);

        return [
            'latitude' => round((float) $resultado['lat'], 7),
            'longitude' => round((float) $resultado['lon'], 7),
            'descricao' => (string) ($resultado['display_name'] ?? ''),
            'tipo' => (string) ($resultado['type'] ?? ''),
            'cepConfere' => $cepConfere,
            'bairroConfere' => $bairroConfere,
            'pontos' => ($cepConfere ? 4 : 0) + ($bairroConfere ? 2 : 0) + ($nomeConfere ? 1 : 0),
        ];
    }

    private static function resultado(array $candidato, string $precisao): array
    {
        return [
            'latitude' => $candidato['latitude'],
            'longitude' => $candidato['longitude'],
            'precisao' => $precisao,
            'descricao' => $candidato['descricao'],
        ];
    }

    // Sem acentos e em minúsculas, para comparar nomes ("Humaita" = "Humaitá").
    private static function normalizar(string $texto): string
    {
        $semAcento = class_exists('Normalizer')
            ? preg_replace('/\p{Mn}/u', '', Normalizer::normalize($texto, Normalizer::FORM_D))
            : $texto;
        return mb_strtolower(trim((string) $semAcento));
    }
}
