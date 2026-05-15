# 🏎️ F1 Fan Site

> O fan site definitivo de Fórmula 1 — feito 100% com HTML, CSS e JavaScript puro, sem frameworks.

Calendário ao vivo, classificações de pilotos e construtores, perfis completos, resultados e histórico de GPs. Tudo alimentado pelas APIs públicas **Jolpica F1** + **OpenF1**, com cache local pra não estourar rate limit.

---

## ✨ Funcionalidades

| Área | O que tem |
|------|-----------|
| 🏠 **Home** | Hero imersivo, próximo GP com countdown ao vivo, top 3 do campeonato (pilotos e construtores) |
| 📅 **Calendário** | Todas as corridas da temporada com filtro por mês, status (próxima/realizada) e link pros detalhes |
| 🏆 **Classificações** | Tabelas atualizadas de pilotos e construtores, com cores oficiais por equipe e indicador de pódio |
| 🧑‍🚀 **Pilotos** | Grid completo + perfil individual com bio, número, equipe, estatísticas de carreira (vitórias, pódios, poles) e resultados da temporada |
| 🏁 **Equipes** | Grid de construtores + perfil com pilotos, classificação atual e histórico de vitórias |
| 🏎️ **GP** | Página detalhada de cada corrida com resultados de **Corrida**, **Qualificação** e **Sprint** (quando houver) |
| 📸 **Fotos** | Fotos reais de pilotos e logos de equipes via **Wikipedia API**, com fallback pra avatar SVG estilizado (cor da equipe + iniciais + número) quando não tem foto |
| 📱 **Responsivo** | Mobile-first, testado em todos os breakpoints, com menu hamburguer e tabelas com scroll horizontal |
| ♿ **Acessível** | Skip link, ARIA, navegação por teclado, contraste WCAG AA, `prefers-reduced-motion` |
| 🔍 **SEO** | Meta tags completas, Open Graph, sitemap, robots.txt |

---

## 🛠️ Stack

- **HTML5** semântico
- **CSS3** moderno (custom properties, grid, clamp, container queries-ready)
- **JavaScript ES Modules** (sem build step!)
- **APIs**: [Jolpica F1](https://github.com/jolpica/jolpica-f1) (sucessora oficial da Ergast) + [OpenF1](https://openf1.org/)
- **Cache**: `localStorage` com TTL pra reduzir requisições e respeitar rate limits
- **Fontes**: Titillium Web (display) + JetBrains Mono (mono) via Google Fonts

---

## 📁 Estrutura

```
Fan Site - F1/
├── index.html                  # Home
├── robots.txt
├── sitemap.xml
├── README.md
│
├── css/
│   ├── style.css               # entrypoint que importa todos
│   ├── tokens.css              # variáveis (cores F1, espaçamento, fontes)
│   ├── base.css                # reset, tipografia, helpers globais
│   ├── layout.css              # header, footer, navegação, page-header
│   ├── components.css          # botões, cards, badges, tabelas, tabs
│   └── pages.css               # estilos específicos de cada página
│
├── js/
│   ├── api/
│   │   ├── jolpica.js          # camada Jolpica F1 (Ergast-compatible)
│   │   └── openf1.js           # camada OpenF1 (live/telemetria)
│   ├── components/
│   │   └── layout.js           # header e footer dinâmicos
│   ├── data/
│   │   └── teams.js            # cores oficiais e helpers de equipe
│   ├── pages/
│   │   ├── home.js
│   │   ├── calendario.js
│   │   ├── classificacoes.js
│   │   ├── pilotos.js
│   │   ├── piloto.js
│   │   ├── equipes.js
│   │   ├── equipe.js
│   │   └── gp.js
│   └── utils/
│       ├── cache.js            # cache localStorage com TTL
│       └── format.js           # datas, traduções, bandeiras
│
└── pages/
    ├── calendario.html
    ├── classificacoes.html
    ├── pilotos.html
    ├── piloto.html             # perfil (?id=driverId)
    ├── equipes.html
    ├── equipe.html             # perfil (?id=constructorId)
    ├── gp.html                 # detalhe de corrida (?season=&round=)
    └── 404.html
```

---

## 🚀 Como rodar localmente

⚠️ **Importante:** o projeto usa ES Modules nativos, então **não dá pra abrir o `index.html` direto pelo `file://`** — você precisa servir via HTTP local. Escolha uma opção abaixo:

### Opção 1 — Python (já vem instalado no Windows)

Abra o **PowerShell** dentro da pasta do projeto e rode:

```powershell
python -m http.server 8000
```

Depois acesse: **http://localhost:8000**

### Opção 2 — Node.js (se você tem instalado)

```powershell
npx serve .
```

Ou:

```powershell
npx http-server . -p 8000
```

### Opção 3 — VS Code

Instale a extensão **Live Server** e clique com o botão direito em `index.html` → **Open with Live Server**.

---

## 🌐 APIs usadas

| API | Pra quê | Limite |
|-----|---------|--------|
| **[Jolpica F1](https://api.jolpi.ca/ergast/f1/)** | Calendário, pilotos, equipes, classificações, resultados, qualifying, sprint, histórico | Sem chave; uso justo |
| **[OpenF1](https://api.openf1.org/v1/)** | Dados ao vivo (sessões, telemetria, posições) | 3 req/s no free tier |
| **[Wikipedia REST](https://en.wikipedia.org/api/rest_v1/)** | Fotos de pilotos e logos de equipes (CC) | Sem chave; cache 7 dias |
| **[FlagCDN](https://flagcdn.com/)** | Bandeiras dos países | Livre |

Todas as chamadas passam por uma camada de **cache em `localStorage`** com TTL diferente por tipo de dado (classificações: 15 min, dados estáticos: 6 h).

---

## 🎨 Design

- Tema **dark** com identidade oficial F1 (vermelho `#e10600`, preto, branco)
- Cores das equipes aplicadas dinamicamente em cards, tabelas e perfis
- Tipografia **Titillium Web** (a usada pela própria F1)
- Animações sutis com `prefers-reduced-motion` respeitado
- Layout 100% responsivo mobile-first

---

## 🔮 Próximos passos sugeridos

- [ ] Adicionar dados ao vivo durante sessões (OpenF1: posições em tempo real, telemetria)
- [ ] Página de circuito com mapa e estatísticas históricas
- [ ] Comparador de pilotos
- [ ] Modo "vivendo a corrida" (stream de eventos do controle de pista)
- [ ] PWA com offline-first

---

## 📝 Licença

Projeto pessoal e não oficial, sem fins lucrativos. Fórmula 1, F1 e marcas relacionadas pertencem à Formula One Licensing BV.
