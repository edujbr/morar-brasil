window.MORAR = {
  brand: 'Morar Brasil',
  tagline: 'Casas, terrenos e sítios em todo o Brasil',
  supabaseUrl: 'https://jubndqjzpthckxpabtog.supabase.co',
  supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Ym5kcWp6cHRoY2t4cGFidG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MjE5ODEsImV4cCI6MjEwNjk5Nzk4MX0.bgV31GymC0op8yyLwWVJhWDL5kCT69pabnGfOlOhMl0',
  featuredCity: 'Sapezal',
  featuredUf: 'MT',
  // Quick chips (not a lock — any IBGE city works via search)
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
  types: [
    { id: 'casa', label: 'Casa', emoji: '🏠' },
    { id: 'terreno', label: 'Terreno', emoji: '📐' },
    { id: 'sitio', label: 'Sítio', emoji: '🌾' },
    { id: 'chacara', label: 'Chácara', emoji: '🏡' },
    { id: 'apartamento', label: 'Apartamento', emoji: '🏢' },
    { id: 'comercial', label: 'Comercial', emoji: '🏪' }
  ],
  fallbackExamples: [
    {
      id: 'local-1', title: 'Casa 3 quartos no Centro — Sapezal/MT', city: 'Sapezal', neighborhood: 'Centro',
      purpose: 'comprar', property_type: 'casa', price: 480000, bedrooms: 3, area_m2: 180,
      description: 'Exemplo de anúncio em Sapezal-MT (cidade em destaque). Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Brasil', whatsapp: '65999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-2', title: 'Apartamento 2 quartos no Bueno — Goiânia/GO', city: 'Goiânia', neighborhood: 'Setor Bueno',
      purpose: 'comprar', property_type: 'apartamento', price: 420000, bedrooms: 2, area_m2: 78,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Brasil', whatsapp: '62999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-3', title: 'Sítio 8 alqueires com sede — Uberaba/MG', city: 'Uberaba', neighborhood: 'Zona Rural',
      purpose: 'comprar', property_type: 'sitio', price: 890000, bedrooms: 2,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Brasil', whatsapp: '34999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-4', title: 'Apartamento para alugar — Batel/Curitiba', city: 'Curitiba', neighborhood: 'Batel',
      purpose: 'alugar', property_type: 'apartamento', price: 2800, bedrooms: 2, area_m2: 70,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Brasil', whatsapp: '41999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-5', title: 'Chácara com pomar e lago — Campinas/SP', city: 'Campinas', neighborhood: 'Sousas',
      purpose: 'comprar', property_type: 'chacara', price: 320000, bedrooms: 2, area_m2: 5000,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Brasil', whatsapp: '19999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-6', title: 'Sala comercial na avenida — Fortaleza/CE', city: 'Fortaleza', neighborhood: 'Meireles',
      purpose: 'comprar', property_type: 'comercial', price: 350000, area_m2: 90,
      description: 'Exemplo de anúncio. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Brasil', whatsapp: '85999999999', status: 'exemplo', is_example: true
    }
  ]
};
