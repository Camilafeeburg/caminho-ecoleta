import "./ColetaSeletiva.css";

const materiais = [
  {
    nome: "Papel",
    cor: "azul",
    icone: "▤",
    descricao: "Jornais, revistas, caixas, folhas e embalagens de papel limpas.",
    lixeira: "Lixeira azul",
  },
  {
    nome: "Plástico",
    cor: "vermelho",
    icone: "♧",
    descricao: "Garrafas PET, embalagens, potes, tampas e sacolas plásticas limpas.",
    lixeira: "Lixeira vermelha",
  },
  {
    nome: "Vidro",
    cor: "verde",
    icone: "♙",
    descricao: "Garrafas, potes e frascos de vidro, conforme as regras locais.",
    lixeira: "Lixeira verde",
  },
  {
    nome: "Metal",
    cor: "amarelo",
    icone: "▢",
    descricao: "Latas de alumínio, aço e outras embalagens metálicas.",
    lixeira: "Lixeira amarela",
  },
];

export default function ColetaSeletiva() {
  return (
    <main className="seletiva-page">
      <header className="seletiva-header">
        <a href="/" className="seletiva-logo">
          <span>♻️</span> ÉCOLETA
        </a>

        <button
          className="seletiva-menu"
          aria-label="Abrir menu"
          onClick={() =>
            window.dispatchEvent(new Event("abrir-menu"))
          }
        >
          ☰
        </button>
      </header>

      <div className="seletiva-container">
        <nav className="seletiva-tabs">
          <a href="/">Início</a>
          <span className="tab-active">Col. Seletiva</span>
        </nav>

        <section className="seletiva-title">
          <h1>Coleta seletiva</h1>
          <p>
            Separe seus resíduos e ajude a construir
            um futuro mais sustentável.
          </p>
        </section>

        <section className="seletiva-intro">
          <div>
            <h2>Por que separar os resíduos?</h2>

            <p>
              A coleta seletiva permite que os materiais
              sejam reciclados e reaproveitados, reduzindo
              a poluição, evitando o acúmulo de lixo no
              meio ambiente e economizando recursos naturais.
            </p>
          </div>

          <div className="seletiva-reciclagem" aria-hidden="true">
            ♻️
          </div>
        </section>

        <section className="seletiva-materiais">
          <h2>Como separar corretamente?</h2>

          <p className="seletiva-subtitulo">
            Cada material tem seu destino certo.
            Veja abaixo o que vai em cada lixeira:
          </p>

          <div className="seletiva-grid">
            {materiais.map((material) => (
              <article
                className="seletiva-card"
                key={material.nome}
              >
                <div
                  className={`seletiva-icone ${material.cor}`}
                  aria-hidden="true"
                >
                  {material.icone}
                </div>

                <h3>{material.nome}</h3>

                <p>{material.descricao}</p>

                <div className={`seletiva-lixeira ${material.cor}`}>
                  {material.lixeira}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="seletiva-dicas">
          <div className="seletiva-planta">♧</div>

          <h2>
            Faça
            <br />
            sua parte!
          </h2>

          <ul>
            <li>
              Separe os resíduos recicláveis dos orgânicos.
            </li>
            <li>
              Descarte embalagens vazias e, quando necessário, limpas.
            </li>
            <li>
              Não misture recicláveis com restos de comida.
            </li>
            <li>
              Confira as regras de coleta da sua cidade.
            </li>
          </ul>
        </section>

        <footer className="seletiva-footer">
          <span>🌱</span>
          <p>
            Écoleta — pequenas atitudes, grandes mudanças.
          </p>
        </footer>
      </div>
    </main>
  );
}
