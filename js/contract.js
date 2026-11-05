window.MorarContract = (function () {
  function money(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function todayBR() {
    return new Date().toLocaleDateString('pt-BR');
  }
  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function build(data, listing) {
    const locador = data.landlord_name || '________________';
    const locatario = data.tenant_name || '________________';
    const cpfL = data.landlord_doc || '________________';
    const cpfT = data.tenant_doc || '________________';
    const rent = money(data.rent || (listing && listing.purpose === 'alugar' ? listing.price : 0));
    const start = data.start_date || '____/____/______';
    const end = data.end_date || '____/____/______';
    const guarantee = data.guarantee || 'Caução equivalente a 3 aluguéis';
    const address = data.address || (listing && (listing.address_text || [listing.neighborhood, listing.city].filter(Boolean).join(', '))) || '________________';
    const city = (listing && listing.city) || data.city || '________________';
    const title = (listing && listing.title) || 'Imóvel residencial';
    const photos = (listing && listing.photo_urls) || [];
    const desc = (listing && listing.description) || '';

    const page1 = `
      <div class="contract-page" id="contract-page-1">
        <p style="text-align:center;font-size:12px;color:#666;margin:0 0 8px">MODELO · Lei do Inquilinato (Lei 8.245/91)</p>
        <h1>CONTRATO DE LOCAÇÃO RESIDENCIAL</h1>
        <p style="text-align:center;margin:0 0 18px"><em>${escape(title)}</em></p>
        <p>Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente <strong>Contrato de Locação Residencial</strong>, que se regerá pela Lei nº 8.245/1991 e pelas cláusulas seguintes:</p>
        <h2>1. Das partes</h2>
        <p><strong>LOCADOR(A):</strong> ${escape(locador)}, inscrito(a) no CPF/CNPJ sob nº ${escape(cpfL)}.</p>
        <p><strong>LOCATÁRIO(A):</strong> ${escape(locatario)}, inscrito(a) no CPF/CNPJ sob nº ${escape(cpfT)}.</p>
        <h2>2. Do imóvel</h2>
        <p>O LOCADOR dá em locação ao LOCATÁRIO o imóvel situado em <strong>${escape(address)}</strong>, município de <strong>${escape(city)}</strong>, destinado exclusivamente à moradia do LOCATÁRIO e de sua família.</p>
        <p><strong>Descrição do anúncio:</strong> ${escape(desc || 'conforme vistoria e fotos anexas.')}</p>
        <h2>3. Do prazo</h2>
        <p>A locação terá início em <strong>${escape(start)}</strong> e término em <strong>${escape(end)}</strong>, podendo ser prorrogada por acordo escrito entre as partes.</p>
        <h2>4. Do aluguel e encargos</h2>
        <p>O aluguel mensal é de <strong>${rent}</strong>, vencível todo dia ${escape(data.due_day || '05')} de cada mês, mediante Pix ou depósito indicado pelo LOCADOR. Encargos de água, luz, gás, condomínio e IPTU correm por conta do LOCATÁRIO, salvo pacto em contrário.</p>
        <p style="margin-top:24px;font-size:12px;color:#b54708;border:1px solid #f9dbaf;background:#fffaeb;padding:10px;border-radius:8px">
          <strong>Aviso:</strong> este é um <strong>modelo</strong> gerado automaticamente. Não substitui assessoria jurídica. Revise com um advogado antes de assinar.
        </p>
      </div>`;

    const page2 = `
      <div class="contract-page" id="contract-page-2">
        <h2>5. Da garantia</h2>
        <p>Como garantia locatícia, as partes elegem: <strong>${escape(guarantee)}</strong>, nos termos do art. 37 da Lei 8.245/91 (vedada a cumulação de mais de uma modalidade).</p>
        <h2>6. Das obrigações do LOCATÁRIO</h2>
        <p>Cumprir a legislação, conservar o imóvel, não ceder ou sublocar sem autorização escrita, permitir vistorias mediante aviso prévio de 48h e restituir o imóvel no estado em que recebeu, salvo desgaste natural.</p>
        <h2>7. Das obrigações do LOCADOR</h2>
        <p>Entregar o imóvel em estado de servir ao uso ajustado, garantir a higidez durante a locação e responder pelos vícios anteriores à entrega.</p>
        <h2>8. Da rescisão e multa</h2>
        <p>A rescisão antecipada pelo LOCATÁRIO implica multa proporcional ao tempo restante do contrato, limitada ao equivalente a 3 aluguéis, podendo ser reduzida judicialmente. O atraso superior a 30 dias autoriza a ação de despejo, sem prejuízo de cobrança.</p>
        <h2>9. Da vistoria e fotos</h2>
        <p>Integram este contrato a descrição do imóvel e as imagens abaixo (quando houver), que servem de referência para a vistoria de entrada e saída.</p>
        <div style="display:grid;gap:8px;grid-template-columns:1fr 1fr;margin:12px 0">
          ${(photos && photos.length)
            ? photos.slice(0, 4).map((u) => `<div style="border:1px solid #ddd;padding:6px;font-size:11px;word-break:break-all">Foto: ${escape(u)}</div>`).join('')
            : '<div style="border:1px dashed #ccc;padding:16px;grid-column:1/-1;text-align:center;color:#666">Sem fotos anexadas no anúncio — anexe na vistoria presencial.</div>'}
        </div>
        <h2>10. Do foro</h2>
        <p>Fica eleito o foro da comarca do imóvel para dirimir quaisquer dúvidas.</p>
        <p style="margin-top:28px">E por estarem justos e contratados, assinam o presente em 2 vias de igual teor.</p>
        <p>${escape(city)}, ${todayBR()}.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:48px;text-align:center">
          <div>_______________________________<br>LOCADOR(A)<br>${escape(locador)}</div>
          <div>_______________________________<br>LOCATÁRIO(A)<br>${escape(locatario)}</div>
        </div>
        <p style="margin-top:28px;font-size:11px;color:#666">Documento gerado por Imóvel Seguro (nome temporário). Modelo educativo — revise com advogado.</p>
      </div>`;

    return { page1, page2 };
  }

  function renderPreview(targetId, data, listing, unlocked) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const { page1, page2 } = build(data, listing);
    if (unlocked) {
      el.innerHTML = `<div class="contract-preview">${page1}${page2}
        <div class="no-print" style="padding:16px;text-align:center;border-top:1px solid #d9e1ea">
          <button type="button" class="btn btn-primary" onclick="window.print()">Imprimir / salvar PDF</button>
        </div></div>`;
    } else {
      el.innerHTML = `<div class="contract-preview">
        ${page1}
        <div class="contract-locked">
          <div class="blur">${page2}</div>
          <div class="paywall">
            <strong>Recurso pago · Contrato completo</strong>
            <p style="margin:8px 0;color:#5b6b7c;font-size:14px">A 1ª página é prévia grátis. Desbloqueie cláusulas, garantia, vistoria/fotos e assinaturas por <strong>${(window.MORAR && window.MORAR.contractPrice) || 'R$ 49'}</strong> (em breve).</p>
            <button type="button" class="btn btn-primary" id="btn-unlock-demo">Simular desbloqueio (demo)</button>
            <p class="help" style="margin-top:8px">Pagamento real ainda não está ligado. O botão só libera a prévia completa neste navegador.</p>
          </div>
        </div>
      </div>`;
      document.getElementById('btn-unlock-demo')?.addEventListener('click', () => {
        sessionStorage.setItem('imovel_seguro_contract_unlock', '1');
        renderPreview(targetId, data, listing, true);
      });
    }
  }

  return { build, renderPreview, money };
})();
