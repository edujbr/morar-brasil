# Imóvel Seguro *(nome temporário — vai mudar)*

Portal **nacional** anti-golpe, pensado para ser **simples** (inclusive para idosos): botões grandes, passos claros, fotos padronizadas por cômodo e marca **@usuário** nas imagens.

**Site:** https://edujbr.github.io/morar-brasil/  
**Repo:** https://github.com/edujbr/morar-brasil

## Destaques
- Conta com username (`conta.html`) — marca d’água nas fotos
- Anúncio em 3 passos + slots: fachada, sala, cozinha, quartos, suíte, banheiros…
- Mapa Leaflet/OSM, denúncia, anti-golpe, contrato Lei 8.245/91
- PF grátis / PJ com página pública / planos
- Favoritos locais, pedir visita, termos, LGPD, checklist mudança
- Ver gaps: [GAPS.md](./GAPS.md)

## Demo vs real
| Parte | Status |
|---|---|
| Busca, mapa, UI, denúncia POST, contrato preview | **Real** |
| Conta username (local + tentativa Supabase) | **Parcial** — sem senha |
| Watermark de fotos | **Real no aparelho** — Storage em nuvem ainda demo |
| Slots de foto no servidor | **Metadados**; bytes ficam locais se grandes |
| Anúncios EXEMPLO | **Fictícios** |
| KYC CPF/CNPJ / pagamentos | **Stub / não ligado** |

## Stack
HTML/CSS/JS + GitHub Pages (`.nojekyll`) + Supabase `jubndqjzpthckxpabtog`
