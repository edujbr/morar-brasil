# Morar Brasil

Portal **nacional** de imóveis e terras: casas, terrenos, sítios e chácaras em qualquer município brasileiro.

Site público: https://edujbr.github.io/morar-brasil/

> Repositório renomeado de `morar-sapezal` → `morar-brasil`. Sapezal continua como cidade em destaque / exemplo de go-to-market local, sem travar o produto.

## O que é o MVP
- Home mobile-first com busca por **qualquer cidade do Brasil** (autocomplete IBGE, 5.571 municípios + texto livre).
- Sem cidade padrão travada; chip “Sapezal (destaque)” e “Ver todo o Brasil”.
- Cards + detalhe, formulário **Anunciar grátis**, página de **Planos** (sem cobrança).
- Supabase `imoveis_listings`: inserts públicos → `pendente`; listagem pública só `publicado` / `exemplo`.

## Demo vs real
| Parte | Status |
|---|---|
| Design, filtros nacionais, formulário, planos | **Real / funcional** |
| 6 anúncios **EXEMPLO** (Sapezal, Goiânia, Uberaba, Curitiba, Campinas, Fortaleza) | **Fictícios** |
| Novos anúncios pelo formulário | **Reais** como `pendente` até aprovação |
| Cobrança R$ 99 / destaque | Só informativa |

## Monetização
1. Anúncio grátis nacional no lançamento.
2. Corretor R$ 99/mês + Destaque R$ 29/semana.
3. SEO e cobertura município a município (GTM inicial pode ser Sapezal / Nortão).

## Stack
- HTML/CSS/JS + `js/cities-br.js` (IBGE)
- GitHub Pages
- Supabase project `jubndqjzpthckxpabtog`

## Aprovar anúncio
```sql
UPDATE imoveis_listings SET status = 'publicado' WHERE id = '<uuid>';
```
