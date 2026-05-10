export function AjudaView() {
  return (
    <div className="card" style={{ padding: "1.6rem" }}>
      <h2 style={{ marginTop: 0 }}>Como usar o LumenSlide</h2>
      <ol style={{ lineHeight: 1.7, paddingLeft: "1.2rem" }}>
        <li>
          No <strong>Dashboard</strong>, escolha a data da celebração no
          calendário. O sistema busca a liturgia do dia em
          <a
            href="https://api-liturgia-diaria.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            {" "}
            api-liturgia-diaria.vercel.app
          </a>
          .
        </li>
        <li>
          Vá para o <strong>Editor</strong> e percorra os ritos (Iniciais →
          Palavra → Eucarística → Finais). Os blocos de leitura/salmo/evangelho
          já vêm preenchidos automaticamente.
        </li>
        <li>
          Em <strong>Músicas</strong>, escolha os cantos por momento da Missa e
          troque o tema do PowerPoint quando quiser.
        </li>
        <li>
          Em <strong>Exportar</strong>, escolha o que entra na composição e
          gere o arquivo final (.pptx ou .pdf).
        </li>
      </ol>

      <h3>Atalhos de teclado</h3>
      <ul style={{ lineHeight: 1.7, paddingLeft: "1.2rem" }}>
        <li>
          <kbd>←</kbd> / <kbd>→</kbd> &mdash; navegar entre slides na
          apresentação
        </li>
        <li>
          <kbd>Esc</kbd> &mdash; sair do modo apresentação
        </li>
      </ul>

      <h3>Status</h3>
      <p>
        Esta é uma <strong>versão de teste somente front-end</strong>. A
        exportação e o backend (multi-tenant, banco de cantos, autenticação)
        ainda não estão implementados — eles são parte do roadmap.
      </p>
    </div>
  );
}
