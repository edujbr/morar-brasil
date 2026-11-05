window.MORAR = {
  brand: 'Morar Sapezal',
  tagline: 'Casas, terrenos e sítios em Sapezal e região',
  supabaseUrl: 'https://jubndqjzpthckxpabtog.supabase.co',
  supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Ym5kcWp6cHRoY2t4cGFidG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MjE5ODEsImV4cCI6MjEwNjk5Nzk4MX0.bgV31GymC0op8yyLwWVJhWDL5kCT69pabnGfOlOhMl0',
  cities: [
    'Sapezal',
    'Campo Novo do Parecis',
    'Campos de Júlio',
    'Brasnorte',
    'Tangará da Serra',
    'Nova Marilândia',
    'Diamantino'
  ],
  types: [
    { id: 'casa', label: 'Casa', emoji: '🏠' },
    { id: 'terreno', label: 'Terreno', emoji: '📐' },
    { id: 'sitio', label: 'Sítio', emoji: '🌾' },
    { id: 'chacara', label: 'Chácara', emoji: '🏡' },
    { id: 'apartamento', label: 'Apartamento', emoji: '🏢' },
    { id: 'comercial', label: 'Comercial', emoji: '🏪' }
  ],
  // Fallback if Supabase is offline — clearly marked as examples
  fallbackExamples: [
    {
      id: 'local-1', title: 'Casa 3 quartos no Centro', city: 'Sapezal', neighborhood: 'Centro',
      purpose: 'comprar', property_type: 'casa', price: 480000, bedrooms: 3, area_m2: 180,
      description: 'Exemplo de anúncio. Casa ampla com quintal e garagem. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Sapezal', whatsapp: '65999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-2', title: 'Lote 360 m² — Jardim Tropical', city: 'Sapezal', neighborhood: 'Jardim Tropical',
      purpose: 'comprar', property_type: 'terreno', price: 95000, area_m2: 360,
      description: 'Exemplo de anúncio. Lote plano, pronto para construir. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Sapezal', whatsapp: '65999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-3', title: 'Sítio 8 alqueires com sede', city: 'Campo Novo do Parecis', neighborhood: 'Zona Rural',
      purpose: 'comprar', property_type: 'sitio', price: 890000, bedrooms: 2,
      description: 'Exemplo de anúncio. Sítio com sede, curral e açude. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Sapezal', whatsapp: '65999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-4', title: 'Casa para alugar — 2 quartos', city: 'Sapezal', neighborhood: 'Residencial Primavera',
      purpose: 'alugar', property_type: 'casa', price: 2200, bedrooms: 2, area_m2: 95,
      description: 'Exemplo de anúncio. Casa mobiliada, aceita pet. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Sapezal', whatsapp: '65999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-5', title: 'Chácara com pomar e lago', city: 'Campos de Júlio', neighborhood: 'Linha 7',
      purpose: 'comprar', property_type: 'chacara', price: 320000, bedrooms: 2, area_m2: 5000,
      description: 'Exemplo de anúncio. Chácara de lazer com pomar e lago. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Sapezal', whatsapp: '65999999999', status: 'exemplo', is_example: true
    },
    {
      id: 'local-6', title: 'Terreno comercial na avenida', city: 'Brasnorte', neighborhood: 'Centro',
      purpose: 'comprar', property_type: 'terreno', price: 65000, area_m2: 450,
      description: 'Exemplo de anúncio. Frente para avenida principal. Este imóvel é fictício para demonstração.',
      owner_name: 'Exemplo Morar Sapezal', whatsapp: '65999999999', status: 'exemplo', is_example: true
    }
  ]
};
