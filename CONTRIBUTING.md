# Contribuindo com o LumenSlide

Obrigado pelo interesse em contribuir! 🙏 O LumenSlide é um projeto aberto a serviço da Liturgia, e qualquer contribuição é bem-vinda — código, documentação, revisão litúrgica, sugestões de cantos, traduções, design ou simplesmente reportar bugs.

## Como contribuir

### 1. Reportando bugs e sugerindo melhorias

Abra uma [Issue](../../issues) descrevendo:

- O que aconteceu (ou o que você gostaria que acontecesse)
- Passos para reproduzir (se for um bug)
- Versão do navegador e do sistema operacional
- Capturas de tela quando fizer sentido

### 2. Enviando código

1. Faça um **fork** do repositório.
2. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/nome-da-sua-feature
   ```
3. Faça suas alterações com commits pequenos e descritivos. Seguimos [Conventional Commits](https://www.conventionalcommits.org/pt-br):
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` mudança apenas em documentação
   - `style:` formatação, sem mudança de código
   - `refactor:` refatoração sem mudar comportamento
   - `test:` adicionar / corrigir testes
   - `chore:` tarefas de build, configuração etc.
4. Garanta que o build passa:
   ```bash
   npm run build
   ```
5. Abra um **Pull Request** apontando para `main`, descrevendo o que mudou e por quê.

### 3. Contribuições litúrgicas e textuais

Você não precisa saber programar para contribuir!

- **Revisão de textos litúrgicos** — abra uma issue apontando o que precisa de correção.
- **Sugestão de cantos** — abra uma issue ou um PR adicionando o canto em `src/data/cantos/` (mantenha letras de domínio público ou com permissão explícita).
- **Traduções** — em breve teremos suporte multi-idioma; siga as issues marcadas com `i18n`.

## Padrões de código

- TypeScript estrito (`strict: true`).
- Componentes em `src/components/` com nome em PascalCase.
- Dados litúrgicos em `src/data/` em formato JSON ou TS tipado.
- Sem dependências pesadas sem discussão prévia em issue.

## Direitos autorais e textos litúrgicos

⚠️ **Importante:** Textos do Lecionário, Missal Romano e cantos modernos podem ter restrições autorais (CNBB, editoras litúrgicas, autores etc.). Não envie textos protegidos sem autorização. Quando houver dúvida, abra uma issue antes do PR.

## Código de conduta

Este projeto segue o [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Ao contribuir, você concorda em respeitá-lo.

---

*Que o seu trabalho seja a serviço de Deus e da Sua Igreja.* 🕊️
