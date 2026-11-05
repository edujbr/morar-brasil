# Morar Sapezal

Portal regional de imóveis e terras para **Sapezal-MT e região** (Campo Novo do Parecis, Campos de Júlio, Brasnorte, Tangará da Serra…).

Site público: https://edujbr.github.io/morar-sapezal/

## O que é o MVP
- Home mobile-first com busca por cidade (padrão: Sapezal), finalidade (comprar/alugar) e tipo (casa, terreno, sítio, chácara…).
- Cards de anúncio + página de detalhe.
- Formulário **Anunciar grátis** (nome, WhatsApp, cidade, tipo, preço, descrição, URLs de foto opcionais).
- Página de **Planos** mostrando monetização futura (ainda **sem cobrança**).
- Backend opcional no Supabase (`imoveis_listings`): inserts públicos ficam `pendente`; o site só lista `publicado` e `exemplo`.

## Demo vs real
| Parte | Status |
|---|---|
| Design, filtros, formulário, planos | **Real / funcional** |
| 6 anúncios com selo **EXEMPLO** | **Dados fictícios** (seed) só para demonstrar a vitrine |
| Novos anúncios pelo formulário | **Reais** — gravam no Supabase como `pendente` (+ cópia no `localStorage`) e **não aparecem** até alguém aprovar (`status = publicado`) |
| Cobrança R$ 99 / destaque | **Só na página de planos** — não há checkout |

## Monetização (plano)
1. **Fase 0 (agora):** anúncio grátis para os primeiros anunciantes da região → encher a vitrine.
2. **Fase 1:** plano **Corretor R$ 99/mês** (ilimitado + selo) e **Destaque R$ 29/semana**.
3. **Fase 2:** expandir cidades do Nortão; painel do corretor; upload de fotos; moderação.

## Stack
- HTML/CSS/JS estático (GitHub Pages)
- Supabase project `jubndqjzpthckxpabtog`, tabela `public.imoveis_listings` com RLS:
  - `SELECT` público: `status IN ('publicado','exemplo')`
  - `INSERT` público: só `status = 'pendente'` e `is_example = false`

## Aprovar um anúncio (manual)
No SQL Editor do Supabase:

```sql
UPDATE imoveis_listings
SET status = 'publicado'
WHERE id = '<uuid>';
```

## Desenvolvimento local
Abra `index.html` num servidor estático, por exemplo:

```bash
cd morar-sapezal
python3 -m http.server 8080
```

## Próximos passos
- [ ] Moderar e publicar os primeiros anúncios reais de Sapezal
- [ ] Upload de fotos (Storage)
- [ ] Conta/login de corretor
- [ ] Ativar cobrança (Pix / Stripe / Mercado Pago) quando houver audiência
- [ ] Página “Quero ser corretor” com waitlist
