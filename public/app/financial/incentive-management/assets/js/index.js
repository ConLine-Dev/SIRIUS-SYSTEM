/**
 * Executa quando o DOM é completamente carregado.
 * Inicializa os elementos da página e configura os eventos de clique nos botões de comparação.
 */
document.addEventListener("DOMContentLoaded", async () => {
    await createElements(); // Inicializa os elementos do FilePond
    document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader
    
    // Configura os eventos de clique nos botões de comparação
    document.querySelector('#startComparison-security').addEventListener('click', handleFileSecurity);
    document.querySelector('#startComparison-comission').addEventListener('click', handleFileComission);
  });
  
  /**
   * Inicializa os elementos do FilePond para uploads de arquivos.
   * Registra plugins necessários e cria instâncias do FilePond.
   */
  async function createElements() {
    FilePond.registerPlugin(
      FilePondPluginImagePreview,
      FilePondPluginImageExifOrientation,
      FilePondPluginFileValidateSize,
      FilePondPluginFileEncode,
      FilePondPluginImageEdit,
      FilePondPluginFileValidateType,
      FilePondPluginImageCrop,
      FilePondPluginImageResize,
      FilePondPluginImageTransform
    );
  
    // Cria a instância FilePond para comissão
    const filePondComission = FilePond.create(document.querySelector('.file-upload-comission'), {
      labelIdle: 'Arraste e solte seu arquivo aqui ou <span class="filepond--label-action">Procure</span> para comparar com o sistema.'
    });
  
    // Cria a instância FilePond para segurança
    const filePondSecurity = FilePond.create(document.querySelector('.file-upload-security'), {
      labelIdle: 'Arraste e solte seu arquivo aqui ou <span class="filepond--label-action">Procure</span> para comparar com o sistema.'
    });
  
    // Habilita o botão "Comparar" quando um arquivo é adicionado
    filePondComission.on('addfile', () => {
      document.querySelector('#startComparison-comission').disabled = false;
    });
  
    filePondSecurity.on('addfile', () => {
      document.querySelector('#startComparison-security').disabled = false;
    });
  }
  
  /**
   * Manipula o arquivo de segurança carregado.
   * Realiza a leitura do arquivo Excel, processa os dados e popula a tabela de segurança.
   */
  function handleFileSecurity() {
    document.querySelector('.title-table').textContent = 'Comparação de seguro';
    const filePondInstance = FilePond.find(document.querySelector('.file-upload-security'));
    const file = filePondInstance.getFile();
  
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        await resetAndChangeHeaderTable(changeHeaderTableSecurity);
        populateTableSecurity(json);
      };
      reader.readAsArrayBuffer(file.file);
    } else {
      alert('Por favor, faça o upload de um arquivo primeiro.');
    }
  }
  
  /**
   * Converte números de série do Excel para datas formatadas.
   * @param {number} serial - Número de série do Excel representando a data.
   * @returns {string} Data formatada no formato 'dd/mm/aaaa'.
   */
  function excelDateToJSDate(serial) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serial - Math.floor(serial) + 0.0000001;
    var total_seconds = Math.floor(86400 * fractional_day);
    var seconds = total_seconds % 60;
    total_seconds -= seconds;
    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    var jsDate = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate() + 1, hours, minutes, seconds);

    var day = jsDate.getDate().toString().padStart(2, '0');
    var month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
    var year = jsDate.getFullYear();

    return `${day}/${month}/${year}`;
}
  
  /**
   * Manipula o arquivo de comissão carregado.
   * Realiza a leitura do arquivo Excel, processa os dados e popula a tabela de comissão.
   */
  function handleFileComission() {
    document.querySelector('.title-table').textContent = 'Comparação de Incentivo & Comissão';
    const filePondInstance = FilePond.find(document.querySelector('.file-upload-comission'));
    const file = filePondInstance.getFile();
  
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        await resetAndChangeHeaderTable(changeHeaderTableComission);
        populateTableComission(json);
      };
      reader.readAsArrayBuffer(file.file);
    } else {
      alert('Por favor, faça o upload de um arquivo primeiro.');
    }
  }
  
  /**
   * Redefine a tabela de incentivos e comissões existente.
   * Destrói a tabela anterior, limpa o cabeçalho e corpo da tabela, e chama a função de mudança de cabeçalho especificada.
   * @param {Function} changeHeaderFunction - Função para mudar o cabeçalho da tabela.
   */
  async function resetAndChangeHeaderTable(changeHeaderFunction) {
    if ($.fn.DataTable.isDataTable('#incentive_management_table')) {
      $('#incentive_management_table').DataTable().destroy();
    }
    document.querySelector('#incentive_management_table thead').innerHTML = '';
    document.querySelector('#incentive_management_table tbody').innerHTML = '';
  
    await changeHeaderFunction();
  }
  
  /**
   * Muda o cabeçalho da tabela de segurança.
   */
  async function changeHeaderTableSecurity() {
    const header = `<tr>
      <th>Documento</th>
      <th>Data Embarque</th>
      <th>Valor TI</th>
      <th>Observação</th>
    </tr>`;
    document.querySelector('#incentive_management_table thead').innerHTML = header;
  }
  
  /**
   * Muda o cabeçalho da tabela de comissão.
   */
  async function changeHeaderTableComission() {
    const header = `<tr>
      <th>Adquirente</th>
      <th>BL</th>
      <th>DI</th>
      <th>Referência Poly</th>
      <th>Valor Comissão</th>
    </tr>`;
    document.querySelector('#incentive_management_table thead').innerHTML = header;
  }
  
  /**
   * Formata um valor numérico para o formato de moeda brasileira.
   * @param {number} value - Valor numérico a ser formatado.
   * @returns {string} Valor formatado em moeda brasileira (R$).
   */
  function formatToBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  /**
   * Preenche a tabela de comissão com os dados fornecidos.
   * @param {Array<Array<string|number>>} data - Dados a serem populados na tabela.
   */
  function populateTableComission(data) {
    const table = $('#incentive_management_table').DataTable({
      language: {
        url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
        searchPlaceholder: 'Pesquisar...',
      },
    });
    table.clear().draw();
  
    data.slice(2).forEach(row => {
      if (row.some(cell => cell !== undefined && cell !== '')) {
        if (row[5] !== undefined && row[5] !== '') {
          table.row.add([
            row[4] || '',
            row[5] || '',
            row[6] || '',
            row[7] || '',
            formatToBRL(parseFloat(row[9])) || ''
          ]).draw(false);
        }
      }
    });
  }
  
  /**
   * Preenche a tabela de segurança com os dados fornecidos.
   * @param {Array<Array<string|number>>} data - Dados a serem populados na tabela.
   */
  function populateTableSecurity(data) {
    const table = $('#incentive_management_table').DataTable({
      dom: 'Bfrtip',
      pageInfo: false,
      pageLength: 10,
      bInfo: false,
      buttons: [
        'excel', 'pdf'
      ],
      language: {
        url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
        searchPlaceholder: 'Pesquisar...',
      },
    });
    table.clear().draw();
  
    data.slice(7).forEach(row => {
      if (row.some(cell => cell !== undefined && cell !== '')) {
        if (row[10] !== undefined && row[10] !== '') {
          table.row.add([
            row[1] || '',
            excelDateToJSDate(row[5]) || '',
            formatToBRL(parseFloat(row[10])) || '',
            row[16] || ''
          ]).draw(false);
        }
      }
    });
  }
  