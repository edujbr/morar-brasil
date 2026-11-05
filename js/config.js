window.MORAR = {
  brand: 'Imóvel Seguro',
  brandNote: 'nome temporário — vai mudar',
  tagline: 'Alugue e compre com menos risco de golpe',
  supabaseUrl: 'https://jubndqjzpthckxpabtog.supabase.co',
  supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Ym5kcWp6cHRoY2t4cGFidG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MjE5ODEsImV4cCI6MjEwNjk5Nzk4MX0.bgV31GymC0op8yyLwWVJhWDL5kCT69pabnGfOlOhMl0',
  featuredCity: 'Sapezal',
  featuredUf: 'MT',
  contractPrice: 'R$ 49',
  spotlight: [
    'Sapezal - MT',
    'São Paulo - SP',
    'Rio de Janeiro - RJ',
    'Belo Horizonte - MG',
    'Curitiba - PR',
    'Goiânia - GO',
    'Fortaleza - CE',
    'Brasília - DF',
    'Manaus - AM',
    'Porto Alegre - RS'
  ],
  // Approximate city-center coords for demo / fallback geocode
  cityCoords: {
    'Sapezal': [-13.5425, -58.8154],
    'Goiânia': [-16.6869, -49.2648],
    'Uberaba': [-19.7472, -47.9381],
    'Curitiba': [-25.4284, -49.2733],
    'Campinas': [-22.9099, -47.0626],
    'Fortaleza': [-3.7319, -38.5267],
    'São Paulo': [-23.5505, -46.6333],
    'Rio de Janeiro': [-22.9068, -43.1729],
    'Brasília': [-15.7975, -47.8919],
    'Belo Horizonte': [-19.9167, -43.9345]
  },
  types: [
    { id: 'casa', label: 'Casa', emoji: '🏠' },
    { id: 'terreno', label: 'Terreno', emoji: '📐' },
    { id: 'sitio', label: 'Sítio', emoji: '🌾' },
    { id: 'chacara', label: 'Chácara', emoji: '🏡' },
    { id: 'apartamento', label: 'Apartamento', emoji: '🏢' },
    { id: 'comercial', label: 'Comercial', emoji: '🏪' },
    { id: 'barracao', label: 'Barracão', emoji: '🏭' }
  ],
  plans: {
    pf_free: { kind: 'pf', label: 'PF grátis', price: 'R$ 0', limit: 1, destaque: false },
    pj_free: { kind: 'pj', label: 'PJ grátis', price: 'R$ 0', limit: 5, destaque: false },
    pj_pro: { kind: 'pj', label: 'PJ Pro', price: 'R$ 99', limit: 30, destaque: true },
    pj_destaque: { kind: 'pj', label: 'PJ Destaque', price: 'R$ 199', limit: 100, destaque: true }
  },
  exampleAgencies: [
    {
      id: 'local-agency-1', name: 'Imobiliária Nortão Exemplo', slug: 'imobiliaria-nortao',
      cnpj: '00.000.000/0001-00', whatsapp: '65988887777', city: 'Sapezal',
      description: 'Exemplo de página pública de imobiliária (PJ). Plano grátis limitado a 5 anúncios.',
      plan: 'pj_free', listing_limit: 5, verified: true, verification_status: 'verificado', is_example: true
    }
  ],
  fallbackExamples: [
    {
      id: 'local-1', title: 'Casa 3 quartos no Centro — Sapezal/MT', city: 'Sapezal', neighborhood: 'Centro',
      purpose: 'comprar', property_type: 'casa', price: 480000, bedrooms: 3, area_m2: 180,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Imóvel Seguro', whatsapp: '65999999999', status: 'exemplo', is_example: true,
      lat: -13.5425, lng: -58.8154, address_text: 'Centro, Sapezal - MT (aprox.)', advertiser_verified: true, verification_status: 'verificado',
      advertiser_kind: 'pj', agency_slug: 'imobiliaria-nortao', agency_name: 'Imobiliária Nortão Exemplo', agency_plan: 'pj_free', featured: true
    },
    {
      id: 'local-2', title: 'Apartamento 2 quartos no Bueno — Goiânia/GO', city: 'Goiânia', neighborhood: 'Setor Bueno',
      purpose: 'comprar', property_type: 'apartamento', price: 420000, bedrooms: 2, area_m2: 78,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Imóvel Seguro', whatsapp: '62999999999', status: 'exemplo', is_example: true,
      lat: -16.7090, lng: -49.2700, address_text: 'Setor Bueno, Goiânia - GO (aprox.)', advertiser_verified: false, advertiser_kind: 'pf', agency_plan: 'pf_free', verification_status: 'nao_verificado'
    },
    {
      id: 'local-3', title: 'Sítio 8 alqueires com sede — Uberaba/MG', city: 'Uberaba', neighborhood: 'Zona Rural',
      purpose: 'comprar', property_type: 'sitio', price: 890000, bedrooms: 2,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Imóvel Seguro', whatsapp: '34999999999', status: 'exemplo', is_example: true,
      lat: -19.7470, lng: -47.9380, address_text: 'Zona Rural, Uberaba - MG (aprox.)', advertiser_verified: true, advertiser_kind: 'pf', agency_plan: 'pf_free', verification_status: 'verificado'
    },
    {
      id: 'local-4', title: 'Apartamento para alugar — Batel/Curitiba', city: 'Curitiba', neighborhood: 'Batel',
      purpose: 'alugar', property_type: 'apartamento', price: 2800, bedrooms: 2, area_m2: 70,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Imóvel Seguro', whatsapp: '41999999999', status: 'exemplo', is_example: true,
      lat: -25.4410, lng: -49.2880, address_text: 'Batel, Curitiba - PR (aprox.)', advertiser_verified: false, advertiser_kind: 'pf', agency_plan: 'pf_free', verification_status: 'nao_verificado'
    },
    {
      id: 'local-5', title: 'Chácara com pomar e lago — Campinas/SP', city: 'Campinas', neighborhood: 'Sousas',
      purpose: 'comprar', property_type: 'chacara', price: 320000, bedrooms: 2, area_m2: 5000,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Imóvel Seguro', whatsapp: '19999999999', status: 'exemplo', is_example: true,
      lat: -22.8750, lng: -46.9720, address_text: 'Sousas, Campinas - SP (aprox.)', advertiser_verified: false, advertiser_kind: 'pf', agency_plan: 'pf_free', verification_status: 'nao_verificado'
    },
    {
      id: 'local-6', title: 'Sala comercial na avenida — Fortaleza/CE', city: 'Fortaleza', neighborhood: 'Meireles',
      purpose: 'comprar', property_type: 'comercial', price: 350000, area_m2: 90,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Imóvel Seguro', whatsapp: '85999999999', status: 'exemplo', is_example: true,
      lat: -3.7300, lng: -38.4900, address_text: 'Meireles, Fortaleza - CE (aprox.)', advertiser_verified: true, advertiser_kind: 'pf', agency_plan: 'pf_free', verification_status: 'verificado'
    }
  ]
};
