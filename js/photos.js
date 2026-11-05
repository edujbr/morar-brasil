window.MorarPhotos = (function () {
  // Standard photo order for residential listings
  const BASE_SLOTS = [
    { key: 'fachada', label: '1. Frente da casa (fachada)', required: true },
    { key: 'sala', label: '2. Sala de estar', required: true },
    { key: 'cozinha', label: '3. Cozinha', required: true },
    { key: 'banheiro_social', label: '4. Banheiro social', required: true }
  ];

  function buildSlots({ bedrooms, hasSuite, bathrooms, propertyType }) {
    const beds = Math.max(0, Number(bedrooms) || 0);
    const baths = Math.max(1, Number(bathrooms) || 1);
    const slots = BASE_SLOTS.map((s) => Object.assign({}, s));

    if (propertyType === 'terreno') {
      return [
        { key: 'fachada', label: '1. Frente do terreno', required: true },
        { key: 'vista', label: '2. Vista geral', required: true },
        { key: 'limites', label: '3. Limites / muros', required: false },
        { key: 'acesso', label: '4. Acesso / rua', required: false }
      ];
    }
    if (propertyType === 'comercial' || propertyType === 'barracao') {
      return [
        { key: 'fachada', label: '1. Frente / fachada', required: true },
        { key: 'interno', label: '2. Área interna', required: true },
        { key: 'banheiro', label: '3. Banheiro', required: false },
        { key: 'estacionamento', label: '4. Estacionamento', required: false }
      ];
    }

    // quartos
    let n = slots.length + 1;
    for (let i = 1; i <= beds; i++) {
      const isSuite = hasSuite && i === beds;
      slots.push({
        key: isSuite ? 'suite' : ('quarto_' + i),
        label: n + '. ' + (isSuite ? 'Suíte' : ('Quarto ' + i)),
        required: true
      });
      n++;
    }
    // banheiros extras além do social
    for (let i = 2; i <= baths; i++) {
      slots.push({
        key: 'banheiro_' + i,
        label: n + '. Banheiro ' + i,
        required: i <= 2
      });
      n++;
    }
    slots.push({ key: 'area_ext', label: n + '. Área externa / quintal (opcional)', required: false });
    return slots;
  }

  function watermarkDataUrl(file, username) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 960;
          let w = img.width, h = img.height;
          if (w > max || h > max) {
            const r = Math.min(max / w, max / h);
            w = Math.round(w * r); h = Math.round(h * r);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const tag = '@' + String(username || 'anunciante').replace(/^@/, '');
          ctx.save();
          ctx.font = 'bold ' + Math.max(16, Math.round(w / 28)) + 'px sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 2;
          // diagonal repeats
          ctx.translate(w / 2, h / 2);
          ctx.rotate(-Math.PI / 6);
          const stepY = Math.round(h / 4);
          const stepX = Math.round(w / 2.2);
          for (let y = -h; y < h; y += stepY) {
            for (let x = -w; x < w; x += stepX) {
              ctx.strokeText(tag, x, y);
              ctx.fillText(tag, x, y);
            }
          }
          ctx.restore();
          // corner badge
          ctx.font = 'bold ' + Math.max(14, Math.round(w / 36)) + 'px sans-serif';
          const pad = 10;
          const tw = ctx.measureText(tag).width + pad * 2;
          const th = Math.max(22, Math.round(w / 28));
          ctx.fillStyle = 'rgba(15,107,76,0.85)';
          ctx.fillRect(w - tw - 12, h - th - 12, tw, th);
          ctx.fillStyle = '#fff';
          ctx.fillText(tag, w - tw - 12 + pad, h - 12 - th / 3);
          resolve(canvas.toDataURL('image/jpeg', 0.62));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function overlayHTML(username) {
    if (!username) return '';
    return '<span class="photo-wm">@' + String(username).replace(/^@/, '') + '</span>';
  }

  return { buildSlots, watermarkDataUrl, overlayHTML, BASE_SLOTS };
})();
