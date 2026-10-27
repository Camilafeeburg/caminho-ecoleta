import { useEffect, useMemo, useRef, useState } from "react";
import "./ColSeletiva.css";
 
/* ------------------------------------------------------------------ */
/* Dados                                                               */
/* ------------------------------------------------------------------ */
 
const CATEGORIAS = {
  seco: {
    nome: "Lixo seco",
    resumo: "Recicláveis limpos e secos.",
    detalhe:
      "Vai para a coleta seletiva e segue para as unidades de triagem. Passe uma água na embalagem e deixe escorrer antes de descartar.",
  },
  organico: {
    nome: "Lixo orgânico",
    resumo: "Restos de comida e de jardim.",
    detalhe:
      "Pode virar adubo na compostagem. Se você não compostar, vai na coleta convencional, em saco bem fechado.",
  },
  rejeito: {
    nome: "Rejeito",
    resumo: "O que não tem reaproveitamento.",
    detalhe:
      "Vai na coleta convencional. Embale em saco fechado e não misture com o lixo seco.",
  },
  especial: {
    nome: "Descarte especial",
    resumo: "Não pode ir no lixo comum.",
    detalhe:
      "Leve a um ponto de entrega ou de logística reversa. Na dúvida sobre onde, consulte o DMLU.",
  },
};
 
const ITENS = [
  // seco
  ["Garrafa PET", "seco"],
  ["Lata de alumínio", "seco"],
  ["Lata de conserva", "seco"],
  ["Caixa de papelão", "seco"],
  ["Jornal e revista", "seco"],
  ["Papel de escritório", "seco"],
  ["Garrafa de vidro", "seco"],
  ["Pote de vidro", "seco"],
  ["Pote de plástico", "seco"],
  ["Caixinha de leite ou suco", "seco"],
  ["Tampinha de garrafa", "seco"],
  ["Sacola plástica limpa", "seco"],
  // orgânico
  ["Casca de fruta", "organico"],
  ["Casca de banana", "organico"],
  ["Resto de comida", "organico"],
  ["Borra de café", "organico"],
  ["Casca de ovo", "organico"],
  ["Folhas e galhos", "organico"],
  // rejeito
  ["Papel higiênico", "rejeito"],
  ["Fralda", "rejeito"],
  ["Guardanapo sujo", "rejeito"],
  ["Papel engordurado", "rejeito"],
  ["Esponja de cozinha", "rejeito"],
  ["Bituca de cigarro", "rejeito"],
  ["Espelho", "rejeito"],
  ["Louça e cerâmica quebrada", "rejeito"],
  ["Fita adesiva", "rejeito"],
  // especial
  ["Pilha e bateria", "especial"],
  ["Lâmpada fluorescente", "especial"],
  ["Eletrônicos", "especial"],
  ["Óleo de cozinha usado", "especial"],
  ["Remédio vencido", "especial"],
  ["Tinta e solvente", "especial"],
  ["Entulho de obra", "especial"],
];
 
const SUGESTOES = ["Garrafa PET", "Casca de banana", "Fralda", "Pilha e bateria"];
 
const PASSOS = [
  {
    titulo: "Separe em dois baldes",
    texto:
      "Um para o lixo seco (recicláveis) e outro para o orgânico. O rejeito pode ficar junto do orgânico, em saco fechado.",
  },
  {
    titulo: "Enxágue as embalagens",
    texto:
      "Basta tirar os restos de comida. Embalagem suja estraga o papel e o plástico que estão ao lado dela.",
  },
  {
    titulo: "Descarte no dia certo",
    texto:
      "A coleta seletiva passa em dias diferentes da convencional. Confira o dia do seu bairro com o DMLU.",
  },
];
 
/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */
 
const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
 
/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */
 
export default function ColSeletiva() {
  const [busca, setBusca] = useState("");
 
  const resultados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return [];
    return ITENS.filter(([nome]) => normalizar(nome).includes(termo));
  }, [busca]);
 
  const trilhoRef = useRef(null);
  const [carrossel, setCarrossel] = useState({ comeco: true, final: false, ativo: 0 });
 
  const atualizarCarrossel = () => {
    const el = trilhoRef.current;
    if (!el) return;
    const maximo = el.scrollWidth - el.clientWidth;
    const comeco = el.scrollLeft <= 2;
    const final = el.scrollLeft >= maximo - 2;
    let ativo = 0;
    let menor = Infinity;
    Array.from(el.children).forEach((card, i) => {
      const distancia = Math.abs(card.offsetLeft - el.scrollLeft);
      if (distancia < menor) {
        menor = distancia;
        ativo = i;
      }
    });
    if (final) ativo = el.children.length - 1;
    setCarrossel({ comeco, final, ativo });
  };
 
  useEffect(() => {
    atualizarCarrossel();
    window.addEventListener("resize", atualizarCarrossel);
    return () => window.removeEventListener("resize", atualizarCarrossel);
  }, []);
 
  const comportamento = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
 
  const moverCarrossel = (direcao) => {
    const el = trilhoRef.current;
    if (!el) return;
    const espaco = parseFloat(getComputedStyle(el).columnGap) || 20;
    const passo = el.children[0].offsetWidth + espaco;
    el.scrollBy({ left: direcao * passo, behavior: comportamento() });
  };
 
  const irParaSlide = (i) => {
    const el = trilhoRef.current;
    if (!el) return;
    el.scrollTo({ left: el.children[i].offsetLeft, behavior: comportamento() });
  };
 
  return (
    <main className="cs-page">
      <header className="cs-header">
        <h1 className="cs-title">Coleta seletiva</h1>
        <p className="cs-subtitle">
          Aprenda a separar o lixo em Porto Alegre e descubra para onde cada
          item deve ir.
        </p>
      </header>
 
      <section className="cs-panel">
        <div className="cs-split">
          {/* Buscador de itens */}
          <div className="cs-finder">
            <div className="cs-finder-badge" aria-hidden="true">
              ?
            </div>
            <h2 className="cs-finder-title">Para onde vai?</h2>
            <p className="cs-finder-text">
              Digite o nome do item e veja onde descartar.
            </p>
 
            <label className="cs-label" htmlFor="cs-busca">
              Item
            </label>
            <input
              id="cs-busca"
              type="search"
              className="cs-input cs-input--dark"
              placeholder="Ex.: caixa de pizza, pilha, casca de ovo"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              autoComplete="off"
            />
 
            {!busca.trim() && (
              <div className="cs-chips" aria-label="Sugestões de busca">
                {SUGESTOES.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    className="cs-chip"
                    onClick={() => setBusca(sugestao)}
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            )}
 
            <div className="cs-results" aria-live="polite">
              {busca.trim() && resultados.length === 0 && (
                <p className="cs-empty-dark">
                  Não encontramos “{busca.trim()}”. Tente outro nome ou
                  consulte o DMLU antes de descartar.
                </p>
              )}
 
              {resultados.slice(0, 6).map(([nome, cat]) => (
                <article key={nome} className="cs-result">
                  <div className="cs-result-head">
                    <h3 className="cs-result-name">{nome}</h3>
                    <span className={`cs-pill cs-pill--${cat}`}>
                      {CATEGORIAS[cat].nome}
                    </span>
                  </div>
                  <p className="cs-result-text">{CATEGORIAS[cat].detalhe}</p>
                </article>
              ))}
            </div>
          </div>
 
          {/* Passo a passo */}
          <div className="cs-steps-wrap">
            <h2 className="cs-section-title">Como separar em casa</h2>
            <p className="cs-section-text">
              Três hábitos já deixam o lixo pronto para a reciclagem.
            </p>
 
            <ol className="cs-steps">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo} className="cs-step">
                  <span className="cs-step-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="cs-step-title">{passo.titulo}</h3>
                    <p className="cs-step-text">{passo.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
 
        {/* Destinos em carrossel */}
        <div className="cs-categories">
          <div className="cs-categories-head">
            <h2 className="cs-section-title">Os quatro destinos do lixo</h2>
            <div className="cs-carousel-controls">
              <button
                type="button"
                className="cs-arrow"
                onClick={() => moverCarrossel(-1)}
                disabled={carrossel.comeco}
                aria-label="Destino anterior"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className="cs-arrow"
                onClick={() => moverCarrossel(1)}
                disabled={carrossel.final}
                aria-label="Próximo destino"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
 
          <div
            className="cs-carousel-track"
            ref={trilhoRef}
            onScroll={atualizarCarrossel}
            role="group"
            aria-roledescription="carrossel"
            aria-label="Destinos do lixo"
            tabIndex={0}
          >
            {Object.entries(CATEGORIAS).map(([chave, cat], i, todas) => (
              <article
                key={chave}
                className={`cs-category cs-category--${chave}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${todas.length}`}
              >
                <h3 className="cs-category-name">{cat.nome}</h3>
                <p className="cs-category-summary">{cat.resumo}</p>
                <p className="cs-category-text">{cat.detalhe}</p>
              </article>
            ))}
          </div>
 
          <div className="cs-dots">
            {Object.entries(CATEGORIAS).map(([chave, cat], i) => (
              <button
                key={chave}
                type="button"
                className={`cs-dot ${carrossel.ativo === i ? "is-active" : ""}`}
                onClick={() => irParaSlide(i)}
                aria-label={`Ir para ${cat.nome}`}
                aria-current={carrossel.ativo === i}
              />
            ))}
          </div>
        </div>
 
        <div className="cs-tips">
          <h2 className="cs-section-title">No dia da coleta</h2>
          <ul className="cs-tips-list">
            <li>Coloque o lixo para fora perto do horário, não na véspera.</li>
            <li>Use sacos bem fechados para evitar que animais abram.</li>
            <li>Deixe o lixo seco separado, sem misturar com orgânico.</li>
            <li>Vidro quebrado vai embrulhado em jornal e identificado.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
 