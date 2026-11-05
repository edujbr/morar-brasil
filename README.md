# Imóvel Seguro *(nome temporário — vai mudar)*

Portal **nacional** anti-golpe de imóveis: casas, terrenos, sítios e chácaras em qualquer município brasileiro. Mapa (Leaflet + OpenStreetMap), selo de anunciante verificado (stub), denúncia e gerador pago de contrato de locação (Lei 8.245/91).

Site público: **https://edujbr.github.io/morar-brasil/**

> Repo ainda se chama `morar-brasil` (histórico). Marca na UI: **Imóvel Seguro**. Morar Brasil / Lar Certo foram rejeitados. Nome definitivo pendente.

## O que tem neste MVP
- Home com busca nacional (IBGE 5.571 cidades), filtro “só verificados”, toggle **Lista / Mapa**
- Detalhe do imóvel com **mapa OSM**, avisos anti-golpe, WhatsApp, botão **Denunciar**, link para contrato (se aluguel)
- `anti-golpe.html` — checklist contra Pix/golpe
- `verificar.html` — fluxo UI stub de CPF/CNPJ (não é KYC real)
- `contrato.html` — gerador de contrato (prévia 1ª página grátis; resto “pago” com unlock demo)
- Formulário anunciar: lat/lng opcional, endereço texto, pedido de verificação
- Planos: **PF grátis**, **PJ grátis (até 5)**, PJ Pro R$ 99, PJ Destaque R$ 199 + contrato avulso R$ 49
- Página pública de imobiliária: `imobiliaria.html?slug=…` (ex.: imobiliaria-nortao)
- Tipo **barracão** + anúncio PF/PJ no formulário

## Demo vs real

| Parte | Status |
|---|---|
| UI anti-golpe, mapa Leaflet/OSM, filtros, formulário, denúncia (POST) | **Real / funcional** |
| Anúncios com selo **EXEMPLO** + coords aproximadas | **Fictícios** |
| Badge “anunciante verificado” | **Demo** — stub; sem consulta Receita/KYC |
| Novos anúncios pelo formulário | **Reais** como `pendente` até aprovação |
| Gerador de contrato HTML/print | **Funcional** como modelo; unlock pago é **demo** (sessionStorage) |
| Cobrança Pix/Stripe | **Não ligada** |
| Página PJ / limites de anúncio | **UI real**; limite 5 não bloqueia insert automaticamente ainda |
| Planos PJ Pro / Destaque | **Informativos** |
| Nome da marca | **Temporário** |

## Stack
- HTML/CSS/JS estático + `.nojekyll` (GitHub Pages)
- Leaflet 1.9.4 + tiles OpenStreetMap (sem API key)
- Supabase `jubndqjzpthckxpabtog` — `imoveis_listings` (+ lat/lng, verification) e `imoveis_reports`

## Aprovar anúncio / marcar verificado
```sql
UPDATE imoveis_listings SET status = 'publicado' WHERE id = '<uuid>';
UPDATE imoveis_listings SET advertiser_verified = true, verification_status = 'verificado' WHERE id = '<uuid>';
```
