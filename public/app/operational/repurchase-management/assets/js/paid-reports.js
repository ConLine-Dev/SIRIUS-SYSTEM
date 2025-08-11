const socket = io();
let table = null;
let allData = [];
let monthlyChart = null;
let topResponsibleChart = null;
let responsibleChoices = null;
let approverChoices = null;

// Utils
function hideLoader() {
  const el = document.querySelector('#loader2');
  if (el) el.classList.add('d-none');
}

function formatCurrencyBRL(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

function formatDateBR(dateISO) {
  if (!dateISO) return '-';
  const d = new Date(dateISO);
  d.setHours(d.getHours() - 3);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  return JSON.parse(StorageGoogleData);
}

async function fetchPaidData() {
  // Usa o endpoint existente de pagamentos agregados
  const data = await makeRequest(`/api/headcargo/repurchase-management/GetRepurchasesPayment`, 'GET');
  return Array.isArray(data) ? data : [];
}

async function fetchPaymentDetails(unique_id) {
  const details = await makeRequest(`/api/headcargo/repurchase-management/GetRepurchasesPaymentDetails`, 'POST', { unique_id });
  return Array.isArray(details) ? details : [];
}

function detectModalFromReference(ref) {
  if (!ref) return '';
  // Normaliza e lê os 2 primeiros caracteres
  const prefix = String(ref).trim().toUpperCase().slice(0, 2);
  // Mapear prefixo para modal
  const map = {
    'IM': 'Importação Marítima',
    'IA': 'Importação Aérea',
    'EM': 'Exportação Marítima',
    'EA': 'Exportação Aérea'
  };
  return map[prefix] ? prefix : '';
}

function populateSelects(data) {
  const responsibleSelect = document.getElementById('filter-responsible');
  const modalSelect = document.getElementById('filter-modal');

  const responsibles = [...new Set(data.map(i => i.responsible).filter(Boolean))].sort();
  const modals = ['IM','IA','EM','EA'];

  responsibleSelect.innerHTML = '<option value="">Todos</option>' + responsibles.map(v => `<option>${v}</option>`).join('');
  modalSelect.innerHTML = '<option value="">Todos</option>' + modals.map(v => `<option value="${v}">${v}</option>`).join('');

  if (responsibleChoices) responsibleChoices.destroy();
  responsibleChoices = new Choices(responsibleSelect, { searchEnabled: true, shouldSort: true });
}

function applyFiltersToArray(data) {
  const start = document.getElementById('filter-start').value;
  const end = document.getElementById('filter-end').value;
  const responsible = document.getElementById('filter-responsible').value;
  const modal = document.getElementById('filter-modal').value;

  return data.filter(item => {
    const dt = item.payment_date ? new Date(item.payment_date) : null;
    let pass = true;
    if (start) pass = pass && dt && dt >= new Date(start);
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      pass = pass && dt && dt <= endDate;
    }
    if (responsible) pass = pass && item.responsible === responsible;

    if (modal) {
      // precisamos checar o prefixo do processo dentre os detalhes de cada pagamento (agrupado)
      // como o endpoint agregado não traz o reference_process, filtramos usando uma heurística: 
      // se o agrupamento tiver pelo menos um detalhe com o modal escolhido, mantém
      const matchModal = item.__hasModalCache && item.__hasModalCache[modal];
      pass = pass && matchModal === true; // se não houver cache ainda, ficará falso até preencher cache abaixo
    }

    return pass;
  });
}

async function ensureModalCacheForCurrent(data) {
  // Para viabilizar filtro por modal baseado no reference_process, vamos popular um cache por unique_id
  const promises = data.map(async (item) => {
    if (!item.unique_id) return;
    if (item.__hasModalCache) return; // já populado
    try {
      const details = await fetchPaymentDetails(item.unique_id);
      const cache = { IM: false, IA: false, EM: false, EA: false };
      for (const fee of details) {
        const modal = detectModalFromReference(fee.reference_process);
        if (modal) cache[modal] = true;
      }
      item.__hasModalCache = cache;
    } catch (e) {
      console.error('Falha ao montar cache de modal para', item.unique_id, e);
    }
  });
  await Promise.all(promises);
}

function updateKPIs(data) {
  const totalRecompra = data.reduce((acc, cur) => acc + Number(cur.total_recompra || 0), 0);
  const totalComissao = data.reduce((acc, cur) => acc + Number(cur.valor_comissao || 0), 0);
  const qtd = data.length;
  const mediaComissao = qtd ? totalComissao / qtd : 0;
  const ultimo = data
    .map(i => i.payment_date)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];
  const totalRecompras = data.reduce((acc, cur) => acc + Number(cur.quant_recompras || 0), 0);

  document.getElementById('kpi-total-pago').textContent = formatCurrencyBRL(totalRecompra);
  document.getElementById('kpi-total-comissao').textContent = formatCurrencyBRL(totalComissao);
  const mediaComissaoEl = document.getElementById('kpi-media-comissao');
  if (mediaComissaoEl) mediaComissaoEl.textContent = formatCurrencyBRL(mediaComissao);
  document.getElementById('kpi-qtd').textContent = String(qtd);
  document.getElementById('kpi-ultimo').textContent = ultimo ? formatDateBR(ultimo) : '-';
  document.getElementById('kpi-qtd-recompras').textContent = String(totalRecompras);
}

function groupByMonthDual(data) {
  const map = {};
  data.forEach(i => {
    if (!i.payment_date) return;
    const d = new Date(i.payment_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { recompra: 0, comissao: 0 };
    map[key].recompra += Number(i.total_recompra || 0);
    map[key].comissao += Number(i.valor_comissao || 0);
  });
  const categories = Object.keys(map).sort();
  const seriesRecompra = categories.map(k => map[k].recompra);
  const seriesComissao = categories.map(k => map[k].comissao);
  return { categories, seriesRecompra, seriesComissao };
}

function groupTopResponsibleDual(data, topN = 10) {
  const map = {};
  data.forEach(i => {
    const key = i.responsible || '—';
    if (!map[key]) map[key] = { recompra: 0, comissao: 0 };
    map[key].recompra += Number(i.total_recompra || 0);
    map[key].comissao += Number(i.valor_comissao || 0);
  });
  const arr = Object.entries(map).map(([name, v]) => ({ name, ...v }));
  arr.sort((a, b) => (b.recompra + b.comissao) - (a.recompra + a.comissao));
  const top = arr.slice(0, topN);
  return {
    categories: top.map(i => i.name),
    seriesRecompra: top.map(i => i.recompra),
    seriesComissao: top.map(i => i.comissao)
  };
}

function renderMonthlyChart(data) {
  const { categories, seriesRecompra, seriesComissao } = groupByMonthDual(data);
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new ApexCharts(document.querySelector('#chart-monthly'), {
    series: [
      { name: 'Recompra (R$)', data: seriesRecompra },
      { name: 'Comissão (R$)', data: seriesComissao }
    ],
    chart: { type: 'bar', stacked: true, height: 300, toolbar: { show: false } },
    xaxis: { categories },
    yaxis: { labels: { formatter: (val) => formatCurrencyBRL(val) } },
    tooltip: { y: { formatter: (val) => formatCurrencyBRL(val) } },
    dataLabels: { enabled: false },
    colors: ['#0d6efd', '#ffc107'],
    legend: { position: 'top' }
  });
  monthlyChart.render();
}

function renderTopResponsibleChart(data) {
  const { categories, seriesRecompra, seriesComissao } = groupTopResponsibleDual(data);
  if (topResponsibleChart) topResponsibleChart.destroy();
  topResponsibleChart = new ApexCharts(document.querySelector('#chart-top-responsible'), {
    series: [
      { name: 'Recompra (R$)', data: seriesRecompra },
      { name: 'Comissão (R$)', data: seriesComissao }
    ],
    chart: { type: 'bar', stacked: true, height: 300, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true } },
    // Em gráfico horizontal, o eixo X é o de valores; o Y mostra as categorias
    xaxis: { categories, labels: { formatter: (val) => formatCurrencyBRL(val) } },
    yaxis: { labels: { formatter: (val) => val } },
    tooltip: { y: { formatter: (val) => formatCurrencyBRL(val) } },
    dataLabels: { enabled: false },
    colors: ['#0d6efd', '#ffc107'],
    legend: { position: 'top' }
  });
  topResponsibleChart.render();
}

function bindTableRowDetails() {
  $('#table-paid-reports tbody').on('click', 'button[data-action="details"]', async function () {
    const tr = $(this).closest('tr');
    const row = table.row(tr);
    if (row.child.isShown()) {
      row.child.hide();
      $(this).text('Ver mais');
      return;
    }
    const unique_id = row.data().unique_id;
    const details = await fetchPaymentDetails(unique_id);
    const content = `
      <div class="table-responsive">
        <table class="table table-sm table-bordered mb-0">
          <thead>
            <tr>
              <th>Processo</th>
              <th>Lucro</th>
              <th>Taxa</th>
              <th>Compra Antiga</th>
              <th>Compra Nova</th>
              <th>Fator Compra</th>
              <th>Dif. Compra</th>
              <th>Venda Antiga</th>
              <th>Venda Nova</th>
              <th>Fator Venda</th>
              <th>Dif. Venda</th>
              <th>Aprovado por</th>
              <th>Data Pagamento</th>
              <th>Comissão</th>
            </tr>
          </thead>
          <tbody>
            ${details.map(fee => `
              <tr>
                <td>${fee.reference_process}</td>
                <td>${fee.fullpaid_formated}</td>
                <td>${fee.fee_name}</td>
                <td>${fee.old_purchase_value_cell}</td>
                <td>${fee.new_purchase_value_cell}</td>
                <td>${fee.purchase_factor}</td>
                <td>${fee.purchase_difference_formated}</td>
                <td>${fee.old_sale_value_cell}</td>
                <td>${fee.new_sale_value_cell}</td>
                <td>${fee.sale_factor}</td>
                <td>${fee.sale_difference_formated}</td>
                <td>${fee.fullNameAproved}</td>
                <td>${formatDateBR(fee.payment_date)}</td>
                <td>${fee.percent_repurchase_comission_formated}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    row.child(content).show();
    $(this).text('Ocultar');
  });
}

function stripHTML(value) {
  if (value == null) return '';
  const div = document.createElement('div');
  div.innerHTML = String(value);
  return div.textContent || div.innerText || '';
}

function makeWorkbookFromAOA(aoa, sheetName = 'Dados') {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

function downloadWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename);
}

function buildExportRows(data) {
  // Monta linhas com as colunas exibidas na tabela, removendo qualquer HTML
  return data.map(r => ([
    stripHTML(r.responsible || ''),
    String(r.quant_recompras || 0),
    stripHTML(r.fullNameAproved || ''),
    stripHTML(formatDateBR(r.payment_date)),
    stripHTML(formatCurrencyBRL(r.total_recompra)),
    stripHTML(formatCurrencyBRL(r.valor_comissao))
  ]));
}

function exportExcelAggregated() {
  if (!table) return;
  const data = table.rows({ search: 'applied' }).data().toArray();
  const header = ['Comissionado','Quantidade','Aprovado por','Data Pagamento','Valor Recompras','Comissão'];
  const rows = buildExportRows(data);
  const aoa = [header, ...rows];
  const wb = makeWorkbookFromAOA(aoa, 'Recompras Pagas');
  downloadWorkbook(wb, 'Relatorio_Recompras_Pagas.xlsx');
}

async function exportDetailedExcel() {
  if (!table) return;
  const current = table.rows({ search: 'applied' }).data().toArray();
  if (!current.length) return;

  const header = [
    'Unique ID','Comissionado','Aprovado por','Data Pagamento',
    'Processo','Lucro','Taxa','Compra Antiga','Compra Nova','Fator Compra','Dif. Compra','Venda Antiga','Venda Nova','Fator Venda','Dif. Venda','% Comissão'
  ];

  const rows = [];
  for (const item of current) {
    try {
      const details = await fetchPaymentDetails(item.unique_id);
      details.forEach(fee => {
        rows.push([
          stripHTML(item.unique_id),
          stripHTML(item.responsible || ''),
          stripHTML(fee.fullNameAproved || item.fullNameAproved || ''),
          stripHTML(formatDateBR(fee.payment_date || item.payment_date)),
          stripHTML(fee.reference_process || ''),
          stripHTML(fee.fullpaid_formated || ''),
          stripHTML(fee.fee_name || ''),
          stripHTML(fee.old_purchase_value_cell || ''),
          stripHTML(fee.new_purchase_value_cell || ''),
          stripHTML(String(fee.purchase_factor || '')),
          stripHTML(fee.purchase_difference_formated || ''),
          stripHTML(fee.old_sale_value_cell || ''),
          stripHTML(fee.new_sale_value_cell || ''),
          stripHTML(String(fee.sale_factor || '')),
          stripHTML(fee.sale_difference_formated || ''),
          stripHTML(fee.percent_repurchase_comission_formated || '')
        ]);
      });
    } catch (e) {
      console.error('Falha ao buscar detalhes para exportação', item.unique_id, e);
    }
  }

  const aoa = [header, ...rows];
  const wb = makeWorkbookFromAOA(aoa, 'Comissoes Detalhadas');
  downloadWorkbook(wb, 'Comissoes_Detalhadas_Recompras_Pagas.xlsx');
}

function exportPDF() {
  if (!table) return;
  if (typeof pdfMake === 'undefined') {
    Swal && Swal.fire ? Swal.fire({icon:'warning', title:'PDF indisponível', text:'Biblioteca pdfMake não carregada.'}) : alert('Biblioteca pdfMake não carregada.');
    return;
  }
  const data = table.rows({ search: 'applied' }).data().toArray();
  const header = ['Comissionado','Quantidade','Aprovado por','Data Pagamento','Valor Recompras','Comissão'];
  const rows = buildExportRows(data);
  const body = [header, ...rows.map(r => r.map(c => stripHTML(c)))];

  const docDefinition = {
    pageOrientation: 'landscape',
    pageMargins: [20, 20, 20, 20],
    content: [
      { text: 'Relatório de Recompras Pagas', style: 'header' },
      { text: new Date().toLocaleString('pt-BR'), style: 'subheader', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*','auto','*','auto','auto','auto'],
          body
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      header: { fontSize: 14, bold: true },
      subheader: { fontSize: 9, color: '#666' }
    }
  };
  pdfMake.createPdf(docDefinition).download('Relatorio_Recompras_Pagas.pdf');
}

function initDataTable(data) {
  if ($.fn.DataTable.isDataTable('#table-paid-reports')) {
    $('#table-paid-reports').DataTable().destroy();
    $('#table-paid-reports').empty();
    $('#table-paid-reports').html(`
      <thead>
        <tr>
          <th>#</th>
          <th>Comissionado</th>
          <th>Quantidade</th>
          <th>Aprovado por</th>
          <th>Data Pagamento</th>
          <th>Valor Recompras</th>
          <th>Comissão</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody></tbody>
    `);
  }

  table = $('#table-paid-reports').DataTable({
    dom: 'frtip',
    paging: true,
    pageLength: 25,
    responsive: true,
    info: true,
    order: [[4, 'desc']],
    data: data,
    columns: [
      {
        data: null,
        render: () => '<button class="btn btn-sm btn-primary" data-action="details">Ver mais</button>',
        orderable: false
      },
      { data: 'responsible' },
      { data: 'quant_recompras' },
      { data: 'fullNameAproved' },
      { data: 'payment_date', render: (d) => formatDateBR(d) },
      { data: 'total_recompra', render: (d) => formatCurrencyBRL(d) },
      { data: 'valor_comissao', render: (d) => formatCurrencyBRL(d) },
      { data: null, render: () => '<div class="text-muted">—</div>', orderable: false },
    ],
    language: {
      searchPlaceholder: 'Pesquisar...',
      sSearch: '',
      url: '../../assets/libs/datatables/pt-br.json'
    }
  });

  bindTableRowDetails();
}

function wireActions() {
  document.getElementById('btn-apply-filters').addEventListener('click', async () => {
    await ensureModalCacheForCurrent(allData);
    const filtered = applyFiltersToArray(allData);
    updateKPIs(filtered);
    renderMonthlyChart(filtered);
    renderTopResponsibleChart(filtered);
    initDataTable(filtered);
  });
  document.getElementById('btn-clear-filters').addEventListener('click', async () => {
    document.getElementById('filter-start').value = '';
    document.getElementById('filter-end').value = '';
    if (responsibleChoices) responsibleChoices.setChoiceByValue(''); else document.getElementById('filter-responsible').value = '';
    const modalSelect = document.getElementById('filter-modal');
    if (modalSelect) modalSelect.value = '';
    updateKPIs(allData);
    renderMonthlyChart(allData);
    renderTopResponsibleChart(allData);
    initDataTable(allData);
  });
  document.getElementById('btn-toggle-indicators').addEventListener('click', () => {
    const ind = document.getElementById('indicators-container');
    const charts = document.getElementById('charts-row');
    ind.classList.toggle('d-none');
    charts.classList.toggle('d-none');
  });
  document.getElementById('btn-export-excel').addEventListener('click', exportExcelAggregated);
  document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);
  document.getElementById('btn-export-detailed').addEventListener('click', exportDetailedExcel);

  socket.on('updateRepurchase', async () => {
    allData = await fetchPaidData();
    const filtered = applyFiltersToArray(allData);
    updateKPIs(filtered);
    renderMonthlyChart(filtered);
    renderTopResponsibleChart(filtered);
    initDataTable(filtered);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    allData = await fetchPaidData();
    // monta cache de modal de forma assíncrona, sem bloquear o primeiro render
    ensureModalCacheForCurrent(allData).then(() => {
      // nada, o cache será usado quando aplicar filtros
    });
    populateSelects(allData);
    updateKPIs(allData);
    renderMonthlyChart(allData);
    renderTopResponsibleChart(allData);
    initDataTable(allData);
    wireActions();
  } catch (e) {
    console.error('Erro ao carregar relatório:', e);
    Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha ao carregar dados.' });
  } finally {
    hideLoader();
  }
}); 