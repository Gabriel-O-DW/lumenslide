# LumenSlide — Especificação da API de Backend

> **Documento de handoff** para o próximo desenvolvedor implementar o backend do LumenSlide.
> O frontend já está pronto (React + Vite + TypeScript) e consome estes endpoints via `fetch`.

---

## 1. Visão geral

### Stack recomendada

- **Runtime:** Node.js 20+
- **Framework:** NestJS (modular, TypeScript-first, decorators) **OU** Fastify + tRPC (se preferir tipagem ponta-a-ponta com o front)
- **ORM:** Prisma (schema único compartilhável)
- **Banco principal:** PostgreSQL 15+
- **Cache / sessões:** Redis 7+
- **Storage de arquivos:** S3 (AWS) ou Azure Blob Storage (PPTX gerados, imagens de fundo, logos paroquiais)
- **Geração de PPTX:** `pptxgenjs` (Node)
- **Geração de PDF:** `puppeteer` ou `pdf-lib`
- **Auth:** JWT (access curto 15min) + Refresh Token rotativo em cookie HTTP-only (7 dias)
- **Email:** Resend / Postmark / SendGrid (verificação, recuperação)
- **Observabilidade:** OpenTelemetry + Sentry

### Convenções gerais

| Item | Padrão |
|------|--------|
| Base path | `/api/v1` |
| Formato | JSON UTF-8 |
| Datas | ISO 8601 (ex.: `2026-05-10T19:00:00Z`) |
| IDs | UUID v4 (ou ULID) |
| Paginação | `?page=1&pageSize=20` (default 20, máx 100) |
| Ordenação | `?sort=campo:asc,outro:desc` |
| Filtros | query strings (`?momento=ofertorio&parishId=...`) |
| Versionamento | `Accept: application/vnd.lumenslide.v1+json` (opcional) ou path |
| Erros | RFC 7807 (`{ type, title, status, detail, instance, errors? }`) |

### Multi-tenancy

LumenSlide é **multi-tenant por paróquia**. Toda entidade salva tem `parishId`. Usuário pode pertencer a 1 ou mais paróquias com papéis distintos. Endpoints autenticados sempre escopam consultas pelo `parishId` do contexto atual (header `X-Parish-Id` ou query `?parishId=`).

### Papéis (RBAC)

| Papel | Permissões |
|-------|------------|
| `super_admin` | Tudo (apenas plataforma). |
| `parish_admin` | Gerencia membros, temas, cantos e configs da paróquia. |
| `editor` | Cria/edita celebrações e cantos da paróquia. |
| `viewer` | Lê celebrações; pode exportar mas não criar/editar. |

---

## 2. Autenticação

### POST `/auth/register`
Cria conta de usuário. Pode opcionalmente criar uma paróquia nova ou aceitar convite (token).

**Request**
```json
{
  "name": "João Silva",
  "email": "joao@paroquia.org.br",
  "password": "SenhaForte!23",
  "inviteToken": "opc-token-jwt-curto",      // se aceitando convite
  "createParish": {                           // se criando paróquia
    "name": "Paróquia Nossa Senhora Rainha dos Apóstolos",
    "diocese": "Diocese de Campinas",
    "city": "Campinas",
    "state": "SP"
  }
}
```

**Response 201**
```json
{
  "user": { "id": "uuid", "name": "João Silva", "email": "..." },
  "parish": { "id": "uuid", "name": "..." },
  "tokens": { "accessToken": "jwt", "expiresIn": 900 }
  // refresh token vai em cookie HTTP-only `lumen_rt`
}
```

**Erros:** `409` email já cadastrado · `400` payload inválido · `401` invite inválido/expirado.

---

### POST `/auth/login`
**Request**
```json
{ "email": "joao@paroquia.org.br", "password": "..." }
```
**Response 200** — mesmo formato de `register`.

---

### POST `/auth/refresh`
Lê cookie `lumen_rt`, rotaciona o refresh, devolve novo access.

**Response 200**
```json
{ "accessToken": "jwt", "expiresIn": 900 }
```

---

### POST `/auth/logout`
Revoga o refresh token atual. **Response 204.**

---

### POST `/auth/forgot-password`
Envia e-mail com link.
```json
{ "email": "joao@paroquia.org.br" }
```
**Response 204** (sempre 204 — não vaza se o e-mail existe).

---

### POST `/auth/reset-password`
```json
{ "token": "jwt-de-reset", "newPassword": "NovaSenha!" }
```

---

### GET `/auth/verify-email?token=...`
Confirma e-mail. **Response 204.**

---

### POST `/auth/resend-verification`
**Body:** `{ "email": "..." }`. **Response 204.**

---

### GET `/auth/me`
Retorna usuário autenticado + paróquias.
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@paroquia.org.br",
  "emailVerified": true,
  "avatarUrl": null,
  "parishes": [
    { "id": "uuid", "name": "...", "role": "parish_admin" }
  ],
  "currentParishId": "uuid"
}
```

---

## 3. Usuários

### PATCH `/me`
Atualiza nome, avatar, preferências. Email muda via fluxo separado.
```json
{ "name": "...", "avatarUrl": "...", "preferences": { "theme": "dark" } }
```

### POST `/me/change-password`
```json
{ "currentPassword": "...", "newPassword": "..." }
```

### DELETE `/me`
Soft-delete da conta (LGPD compliance — purge em 30 dias).

---

## 4. Paróquias (multi-tenant)

### GET `/parishes`
Lista paróquias do usuário autenticado.

### POST `/parishes`
Cria paróquia (cria membro `parish_admin`).
```json
{
  "name": "Paróquia ...",
  "diocese": "...",
  "city": "...",
  "state": "SP",
  "country": "BR",
  "logoUrl": null,
  "defaultThemeId": "paroquial-classico",
  "defaultFooter": "Paróquia Nossa Senhora Rainha dos Apóstolos"
}
```

### GET `/parishes/:id`
Dados públicos + membros visíveis para o solicitante.

### PATCH `/parishes/:id`
Apenas `parish_admin`+.

### DELETE `/parishes/:id`
Apenas `parish_admin`. Soft-delete.

### GET `/parishes/:id/members`
### POST `/parishes/:id/members/invite`
Envia convite por e-mail.
```json
{ "email": "...", "role": "editor" }
```
### PATCH `/parishes/:id/members/:userId`
Trocar papel.
```json
{ "role": "editor" }
```
### DELETE `/parishes/:id/members/:userId`

---

## 5. Liturgia diária (proxy + cache)

> Hoje o frontend chama direto `https://api-liturgia-diaria.vercel.app`. O backend deve **espelhar** essa API com cache (Redis, 24h) e expor um endpoint estável.

### GET `/liturgy/:date`
`:date` em formato `YYYY-MM-DD`.

**Response 200**
```json
{
  "data": "2026-05-10",
  "diaLiturgico": "VI Domingo da Páscoa",
  "cor": "branca",
  "corRotulo": "Branco",
  "primeiraLeitura": {
    "titulo": "Primeira Leitura",
    "referencia": "At 8,5-8.14-17",
    "texto": "..."
  },
  "salmo": {
    "titulo": "Salmo Responsorial",
    "referencia": "Sl 65(66)",
    "refrao": "...",
    "texto": "..."
  },
  "segundaLeitura": { ... },
  "evangelho": { ... },
  "fonte": "sagradaliturgia.com.br"
}
```

### GET `/liturgy/range?from=YYYY-MM-DD&to=YYYY-MM-DD`
Lote (máx 31 dias) — útil para popular calendário do mês.

### GET `/liturgy/:date/santo-do-dia`
Proxy do endpoint `/santo-do-dia` da API original, com cache.

---

## 6. Celebrações ("Missas") — coração do sistema

> Equivale ao "salvar uma apresentação". O usuário verá em **Minhas Missas**.

### Modelo conceitual
- `Celebration` (Missa) tem `id`, `parishId`, `authorId`, `date`, `time`, `title` ("VI Domingo da Páscoa — 19h"), `liturgicalColor`, `themeId`, `parishFooter`, `status` (`draft` | `published` | `archived`), `createdAt`, `updatedAt`, `lastExportedAt`.
- Possui **N Slides** (blocos litúrgicos).
- Possui **N Músicas vinculadas** (`CelebrationMusic`) com `momentoMissa` e ordem.

### GET `/celebrations`
Lista paginada da paróquia atual (filtra por autor, data, status).

**Query params:** `?parishId=...&from=2026-01-01&to=2026-12-31&authorId=...&status=draft&q=natal&page=1&pageSize=20`

**Response 200**
```json
{
  "items": [
    {
      "id": "uuid",
      "date": "2026-05-10",
      "time": "19:00",
      "title": "VI Domingo da Páscoa — 19h00",
      "liturgicalColor": "branca",
      "themeId": "paroquial-classico",
      "status": "published",
      "author": { "id": "uuid", "name": "João Silva" },
      "slidesCount": 42,
      "musicsCount": 7,
      "lastExportedAt": "2026-05-09T20:31:00Z",
      "createdAt": "2026-05-08T14:12:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 137
}
```

### POST `/celebrations`
Cria a partir do zero ou clonando uma anterior.
```json
{
  "date": "2026-05-17",
  "time": "19:00",
  "title": "VII Domingo da Páscoa — 19h00",
  "themeId": "paroquial-classico",
  "parishFooter": "Paróquia Nossa Senhora Rainha dos Apóstolos",
  "fromTemplateId": null,         // ou id de outra missa para clonar
  "autoFillFromLiturgy": true     // popula slides com a API liturgia
}
```
**Response 201** com a celebração + slides já gerados.

### GET `/celebrations/:id`
Retorna a celebração com **todos os slides e músicas** (formato pronto para o Editor).
```json
{
  "id": "uuid",
  "date": "2026-05-10",
  "title": "...",
  "themeId": "paroquial-classico",
  "liturgy": { ... mesmo shape de /liturgy/:date ... },
  "slides": [
    {
      "id": "uuid",
      "rito": "iniciais",
      "tipo": "ordinario",
      "titulo": "Ato Penitencial",
      "citacao": null,
      "texto": "Senhor, tende piedade... **Senhor, tende piedade.**",
      "ordem": 1
    }
  ],
  "musics": [
    {
      "id": "uuid",
      "musicId": "uuid-do-banco",
      "momento": "entrada",
      "ordem": 1
    }
  ]
}
```

### PATCH `/celebrations/:id`
Atualiza metadados (data, título, tema, footer, status).

### DELETE `/celebrations/:id`
Soft-delete (vai para "arquivadas"). `?force=true` (apenas admin) faz purge.

### POST `/celebrations/:id/duplicate`
Clona como nova celebração `draft`.
```json
{ "newDate": "2026-05-24", "newTitle": "VIII Domingo do TC — 19h00" }
```

### POST `/celebrations/:id/restore`
Reverte soft-delete.

---

### Slides da celebração

### GET `/celebrations/:id/slides`
Lista ordenada.

### POST `/celebrations/:id/slides`
Cria slide novo.
```json
{
  "rito": "palavra",
  "tipo": "leitura",
  "titulo": "Primeira Leitura",
  "citacao": "At 8,5-8.14-17",
  "texto": "...",
  "ordem": 4
}
```

### PATCH `/celebrations/:id/slides/:slideId`
Atualiza texto/título/ordem/etc.

### DELETE `/celebrations/:id/slides/:slideId`

### POST `/celebrations/:id/slides/reorder`
Reordena em lote.
```json
{ "order": ["slide-id-1", "slide-id-2", "slide-id-3"] }
```

### POST `/celebrations/:id/slides/sync-liturgy`
Força re-sincronização dos slides de leitura/salmo/evangelho com a liturgia do dia (caso o `texto` da API tenha mudado).

---

### Músicas vinculadas à celebração

### GET `/celebrations/:id/musics`
### POST `/celebrations/:id/musics`
```json
{ "musicId": "uuid", "momento": "ofertorio", "ordem": 5 }
```
### DELETE `/celebrations/:id/musics/:linkId`
### POST `/celebrations/:id/musics/reorder`

---

## 7. Banco de Cantos / Músicas

### GET `/musics`
Lista de cantos, escopados pela paróquia + cantos públicos.

**Query params:** `?q=gloria&momento=gloria&autor=...&tom=G&public=true&page=...`

**Response item**
```json
{
  "id": "uuid",
  "titulo": "Glória — Melodia Sagrada",
  "autor": "Trad.",
  "momento": "gloria",
  "tom": "C",
  "duracaoSegundos": 190,
  "refrao": "...",
  "estrofes": ["..."],
  "tags": ["paroquial", "tradicional"],
  "isPublic": false,
  "audioUrl": null,
  "scoreUrl": null,            // partitura PDF
  "parishId": "uuid",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### POST `/musics`
Cria canto (escopado em paróquia).
```json
{
  "titulo": "...",
  "autor": "...",
  "momento": "ofertorio",
  "tom": "G",
  "duracaoSegundos": 215,
  "refrao": "...",
  "estrofes": ["1. ...", "2. ..."],
  "tags": ["..."],
  "isPublic": false
}
```

### GET `/musics/:id`
### PATCH `/musics/:id`
### DELETE `/musics/:id`

### POST `/musics/:id/upload-audio`
`multipart/form-data` — sobe MP3/M4A. Retorna `audioUrl`. **Limite: 20MB.**

### POST `/musics/:id/upload-score`
Sobe partitura PDF.

### POST `/musics/import-batch`
Importa em lote (CSV/JSON) — útil para hinários inteiros.
```json
{ "format": "csv", "fileUrl": "..." }
```

### GET `/musics/public`
Catálogo de cantos compartilhados entre paróquias (curado por `super_admin`).

---

## 8. Temas (templates de slides)

### GET `/themes`
Lista temas de sistema + temas customizados da paróquia.

### POST `/themes`
Cria tema customizado (apenas `parish_admin`+).
```json
{
  "name": "Paróquia X — Festa do Padroeiro",
  "baseTheme": "paroquial-classico",
  "palette": {
    "fundo": "#fdfaf3",
    "fundoSecundario": "#f5ecd9",
    "texto": "#262626",
    "realce": "#9b8053",
    "destaqueCapa": "#0070c0",
    "bannerGold": "#9b8053",
    "bannerBlue": "#1f6fb8"
  },
  "fontTitle": "'Lato', sans-serif",
  "fontBody": "'Lato', sans-serif",
  "bannerStyle": "ribbon-gold",
  "footer": "Paróquia ..."
}
```

### GET `/themes/:id`
### PATCH `/themes/:id`
### DELETE `/themes/:id`

### POST `/themes/:id/upload-background`
Imagem de fundo (vitral, manuscrito etc.). **Limite: 5MB.**

---

## 9. Exportação

### POST `/celebrations/:id/export`
Dispara geração assíncrona (job em fila).
```json
{
  "format": "pptx",                      // pptx | pdf | png_zip
  "include": {
    "leituras": true,
    "canticos": true,
    "ritos": true,
    "cantos": true,
    "respostasDestaque": true
  },
  "options": {
    "fontFamily": "Lato",
    "respostasDestaque": "cyan"          // cyan | gold | bold
  }
}
```
**Response 202**
```json
{ "jobId": "uuid", "statusUrl": "/exports/uuid" }
```

### GET `/exports/:jobId`
Polling do status.
```json
{
  "jobId": "uuid",
  "status": "queued | processing | done | failed",
  "progress": 73,
  "downloadUrl": "https://s3.../celebration-uuid.pptx?signed=...",  // quando done
  "expiresAt": "2026-05-11T19:00:00Z",                              // 24h
  "fileSize": 8234112,
  "error": null
}
```

### GET `/exports`
Histórico de exportações da paróquia (últimos 90 dias).

### DELETE `/exports/:jobId`
Cancela job (se ainda na fila).

---

## 10. Calendário litúrgico

### GET `/calendar/year/:year`
Retorna o calendário litúrgico do ano (cor por dia + festas).
```json
{
  "year": 2026,
  "days": [
    {
      "date": "2026-05-10",
      "color": "branca",
      "celebration": "VI Domingo da Páscoa",
      "rank": "domingo",                  // solenidade | festa | memoria | feria | domingo
      "patronSaint": null
    }
  ]
}
```

### GET `/calendar/month/:year/:month`
Versão mensal (mais rápida que filtrar do ano).

### POST `/calendar/local-feasts` (admin de paróquia)
Cadastra festas locais (padroeiros, eventos paroquiais).
```json
{
  "date": "2026-05-13",
  "title": "Nossa Senhora de Fátima — Festa do Padroeiro",
  "color": "branca",
  "rank": "solenidade"
}
```

### GET `/calendar/local-feasts`
### PATCH `/calendar/local-feasts/:id`
### DELETE `/calendar/local-feasts/:id`

---

## 11. Dashboard / Analytics

### GET `/analytics/overview`
Métricas da paróquia para o widget do Dashboard.
```json
{
  "presentationsByMonth": [42, 58, 71, 95, 110, 120, 88, 76, 95, 132, 118, 128],
  "totalCelebrations": 1147,
  "totalMusics": 234,
  "totalExports": 893,
  "activeMembers": 8,
  "lastActivity": "2026-05-09T20:31:00Z"
}
```

### GET `/analytics/recent-celebrations?limit=5`
### GET `/analytics/popular-musics?limit=10`

---

## 12. Comunicados (avisos da paróquia)

> Pelos slides do PPTX original existem slides de "Comunicado Importante". Vamos modelar como entidade.

### GET `/parishes/:id/announcements`
### POST `/parishes/:id/announcements`
```json
{
  "title": "comunicado IMPORTANTE",
  "subtitle": "Sobre o uso de imagem dos fiéis",
  "body": "Informamos que durante as celebrações...",
  "icon": "info",
  "validFrom": "2026-05-10",
  "validTo": "2026-05-31",
  "showInCelebrations": true
}
```
### PATCH/DELETE idem.

Quando `showInCelebrations: true`, o backend insere automaticamente um slide `tipo: "generico"` no início de toda celebração nova (rito `iniciais`).

---

## 13. Storage de arquivos

### POST `/uploads/sign`
Pede URL pré-assinada para upload direto (S3/Azure).
```json
{ "fileName": "logo-paroquia.png", "contentType": "image/png", "size": 184320, "purpose": "parish_logo" }
```
**Response**
```json
{
  "uploadUrl": "https://s3.../signed",
  "method": "PUT",
  "fields": { ... },                  // se POST policy
  "publicUrl": "https://cdn.lumenslide.app/parish/uuid/logo.png",
  "expiresAt": "2026-05-10T20:00:00Z"
}
```
**Purposes válidos:** `parish_logo`, `theme_background`, `music_audio`, `music_score`, `announcement_image`, `user_avatar`.

---

## 14. Webhooks (opcional v1.1)

### POST `/webhooks`
Cadastra webhook da paróquia.
```json
{
  "url": "https://...",
  "events": ["celebration.exported", "celebration.published"],
  "secret": "shared-secret"
}
```

**Eventos:** `celebration.created`, `celebration.published`, `celebration.exported`, `member.invited`, `member.joined`.

---

## 15. Saúde / sistema

### GET `/healthz`
`{"status":"ok","db":"ok","redis":"ok","liturgyApi":"ok"}`

### GET `/version`
`{"app":"lumenslide-api","version":"1.0.0","commit":"abc1234","builtAt":"..."}`

---

## 16. Modelo de dados (sugestão Prisma)

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String
  passwordHash    String
  emailVerified   Boolean  @default(false)
  avatarUrl       String?
  preferences     Json     @default("{}")
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  memberships     ParishMember[]
  celebrations    Celebration[]
  refreshTokens   RefreshToken[]
}

model Parish {
  id              String   @id @default(uuid())
  name            String
  diocese         String?
  city            String?
  state           String?
  country         String   @default("BR")
  logoUrl         String?
  defaultThemeId  String?
  defaultFooter   String?
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  members         ParishMember[]
  celebrations    Celebration[]
  musics          Music[]
  themes          Theme[]
  announcements   Announcement[]
  localFeasts     LocalFeast[]
}

enum Role { super_admin parish_admin editor viewer }

model ParishMember {
  id        String  @id @default(uuid())
  userId    String
  parishId  String
  role      Role    @default(editor)
  joinedAt  DateTime @default(now())
  user      User    @relation(fields: [userId], references: [id])
  parish    Parish  @relation(fields: [parishId], references: [id])
  @@unique([userId, parishId])
}

enum CelebrationStatus { draft published archived }
enum LiturgicalColor   { branca verde roxa vermelha rosa dourada }

model Celebration {
  id              String   @id @default(uuid())
  parishId        String
  authorId        String
  date            DateTime @db.Date
  time            String?  // "19:00"
  title           String
  liturgicalColor LiturgicalColor
  themeId         String
  parishFooter    String?
  status          CelebrationStatus @default(draft)
  liturgyCacheId  String?  // referência opcional ao snapshot da liturgia
  lastExportedAt  DateTime?
  deletedAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  parish    Parish @relation(fields: [parishId], references: [id])
  author    User   @relation(fields: [authorId], references: [id])
  slides    Slide[]
  musics    CelebrationMusic[]

  @@index([parishId, date])
}

enum SlideType { generico leitura salmo ordinario canto }
enum RiteKey   { iniciais palavra eucaristica finais }

model Slide {
  id            String   @id @default(uuid())
  celebrationId String
  rito          RiteKey
  tipo          SlideType
  titulo        String
  citacao       String?
  texto         String   @db.Text
  ordem         Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  celebration   Celebration @relation(fields: [celebrationId], references: [id], onDelete: Cascade)
  @@index([celebrationId, ordem])
}

enum MomentoMissa {
  entrada ato_penitencial gloria salmo aclamacao
  ofertorio santo comunhao final outro
}

model Music {
  id               String  @id @default(uuid())
  parishId         String?
  titulo           String
  autor            String?
  momento          MomentoMissa
  tom              String?
  duracaoSegundos  Int?
  refrao           String?
  estrofes         String[]
  tags             String[]
  isPublic         Boolean @default(false)
  audioUrl         String?
  scoreUrl         String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  parish           Parish? @relation(fields: [parishId], references: [id])
  @@index([parishId, momento])
}

model CelebrationMusic {
  id            String   @id @default(uuid())
  celebrationId String
  musicId       String
  momento       MomentoMissa
  ordem         Int
  celebration   Celebration @relation(fields: [celebrationId], references: [id], onDelete: Cascade)
  music         Music       @relation(fields: [musicId], references: [id])
  @@unique([celebrationId, musicId, momento])
}

model Theme {
  id           String   @id @default(uuid())
  parishId     String?
  name         String
  baseTheme    String   // "paroquial-classico" etc.
  palette      Json
  fontTitle    String
  fontBody     String
  bannerStyle  String   // "ribbon-gold" | "ribbon-blue" | "minimal" | "none"
  footer       String?
  backgroundUrl String?
  isSystem     Boolean  @default(false)
  createdAt    DateTime @default(now())
  parish       Parish?  @relation(fields: [parishId], references: [id])
}

enum ExportFormat { pptx pdf png_zip }
enum ExportStatus { queued processing done failed }

model ExportJob {
  id            String   @id @default(uuid())
  celebrationId String
  parishId      String
  authorId      String
  format        ExportFormat
  status        ExportStatus @default(queued)
  progress      Int      @default(0)
  options       Json
  fileUrl       String?
  fileSize      Int?
  error         String?
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([parishId, createdAt])
}

model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  tokenHash   String   @unique
  parentId    String?  // para rastrear rotação
  userAgent   String?
  ip          String?
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

model LiturgyCache {
  date        DateTime @id @db.Date
  payload     Json
  source      String   // "vercel-josuesantos" | "cnbb" | etc.
  fetchedAt   DateTime @default(now())
  expiresAt   DateTime
}

model Announcement {
  id        String   @id @default(uuid())
  parishId  String
  title     String
  subtitle  String?
  body      String   @db.Text
  icon      String?
  validFrom DateTime?
  validTo   DateTime?
  showInCelebrations Boolean @default(false)
  createdAt DateTime @default(now())
  parish    Parish   @relation(fields: [parishId], references: [id])
}

model LocalFeast {
  id        String   @id @default(uuid())
  parishId  String
  date      DateTime @db.Date
  title     String
  color     LiturgicalColor
  rank      String   // "solenidade" | "festa" | "memoria"
  parish    Parish   @relation(fields: [parishId], references: [id])
  @@unique([parishId, date])
}
```

---

## 17. Variáveis de ambiente

```env
# App
NODE_ENV=production
PORT=3000
APP_URL=https://app.lumenslide.org
API_URL=https://api.lumenslide.org

# DB
DATABASE_URL=postgresql://user:pass@host:5432/lumenslide
REDIS_URL=rediss://...

# Auth
JWT_ACCESS_SECRET=...                # 64 chars
JWT_ACCESS_TTL=900                   # 15min
JWT_REFRESH_SECRET=...
JWT_REFRESH_TTL=604800               # 7d
COOKIE_DOMAIN=.lumenslide.org

# Storage
S3_BUCKET=lumenslide-prod
S3_REGION=sa-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
CDN_BASE_URL=https://cdn.lumenslide.org

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
EMAIL_FROM="LumenSlide <no-reply@lumenslide.org>"

# Liturgia (fonte externa — pode trocar)
LITURGY_API_URL=https://api-liturgia-diaria.vercel.app
LITURGY_CACHE_TTL=86400              # 24h

# Limites
MAX_UPLOAD_AUDIO_MB=20
MAX_UPLOAD_IMAGE_MB=5
MAX_UPLOAD_PDF_MB=10
RATE_LIMIT_PUBLIC=60                 # req/min
RATE_LIMIT_AUTH=300

# Observabilidade
SENTRY_DSN=...
OTEL_EXPORTER_OTLP_ENDPOINT=...
```

---

## 18. Resumo de prioridades (sprint planning sugerido)

### Sprint 1 — Fundação (1 semana)
- [ ] Setup NestJS + Prisma + Postgres + Redis
- [ ] Auth completa: register, login, refresh, logout, verify-email
- [ ] `/auth/me`, `PATCH /me`, `change-password`
- [ ] Paróquias: CRUD + membros + convite por e-mail
- [ ] Middleware de RBAC e multi-tenancy

### Sprint 2 — Liturgia + Celebrações (1 semana)
- [ ] Proxy `/liturgy/:date` com cache Redis
- [ ] CRUD de Celebrations + Slides (incluindo `sync-liturgy`)
- [ ] Endpoint `duplicate` (clonar missa anterior)
- [ ] Listagem `Minhas Missas` com filtros e paginação

### Sprint 3 — Cantos + Temas (1 semana)
- [ ] CRUD de Music + uploads de áudio/partitura
- [ ] Vinculação CelebrationMusic
- [ ] Temas customizados por paróquia
- [ ] Catálogo público de cantos

### Sprint 4 — Exportação (1-2 semanas)
- [ ] Worker de fila (BullMQ) para PPTX
- [ ] Geração com `pptxgenjs` respeitando o tema selecionado
- [ ] Geração de PDF (Puppeteer)
- [ ] Storage assinado + expiração 24h
- [ ] Endpoint de status

### Sprint 5 — Polimento (1 semana)
- [ ] Comunicados, festas locais, calendário litúrgico
- [ ] Analytics overview
- [ ] Webhooks
- [ ] Healthcheck, observabilidade, logs estruturados

---

## 19. Contrato com o frontend

O frontend espera **respostas no shape exato** descrito acima (especialmente `/liturgy/:date`, `/celebrations/:id` e `/musics`). Mudanças de schema devem subir o `Accept` para `vnd.lumenslide.v2+json`.

Tipos TypeScript canônicos que o front já usa estão em:

- `src/types/liturgia.ts` — `LiturgiaDiaria`, `LeituraNormalizada`, `SalmoNormalizado`, `CorLiturgicaSlug`
- `src/types/musica.ts` — `Musica`, `MomentoMissa`
- `src/types/tema.ts` — `Tema`, `EstiloBanner`
- `src/data/blocosLiturgicos.ts` — `BlocoSlide`, `RiteKey`, `TipoBloco`

Sugestão: gerar tipos com `prisma-zod-generator` ou `tRPC` e compartilhar via pacote `@lumenslide/shared` (monorepo Turborepo/Nx).

---

## 20. Segurança — checklist

- [ ] Senhas hash com Argon2id (`memoryCost: 19456, timeCost: 2`)
- [ ] Rate limit em `/auth/login` (10/min/IP) e `/auth/forgot-password` (3/hora/IP)
- [ ] CSRF token nos endpoints que usam cookie (refresh)
- [ ] Validação de payload com Zod ou class-validator
- [ ] CORS restrito ao `APP_URL`
- [ ] Helmet + secure cookies + HSTS
- [ ] Logs sem PII em campos sensíveis (mascarar `email`, `password`)
- [ ] Backup diário do Postgres (point-in-time recovery 7 dias)
- [ ] LGPD: endpoint de export do dado pessoal (`GET /me/export`) e purge ao deletar conta
