/**
 * Executa quando o DOM é completamente carregado.
 * Inicializa os elementos da página e configura os eventos de clique nos botões de comparação.
 */
document.addEventListener("DOMContentLoaded", async () => {
    await createElements(); // Inicializa os elementos do FilePond

    
    // Configura os eventos de clique nos botões de comparação
    document.querySelector('#startComparison-security').addEventListener('click', handleFileSecurity);
    document.querySelector('#startComparison-comission').addEventListener('click', handleFileComission);
    document.querySelector('#startComparison-agent').addEventListener('click', handleFileAgent);
    
    document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader
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

    // Cria a instância FilePond para Agente
    const filePondAgent = FilePond.create(document.querySelector('.file-upload-agent'), {
      labelIdle: 'Arraste e solte seu arquivo aqui ou <span class="filepond--label-action">Procure</span> para comparar com o sistema.'
    });
  
  
    // Habilita o botão "Comparar" quando um arquivo é adicionado
    filePondComission.on('addfile', () => {
      document.querySelector('#startComparison-comission').disabled = false;
    });
  
    filePondSecurity.on('addfile', () => {
      document.querySelector('#startComparison-security').disabled = false;
    });

    filePondAgent.on('addfile', () => {
      document.querySelector('#startComparison-agent').disabled = false;
    });
  }
  
  /**
   * Manipula o arquivo de segurança carregado.
   * Realiza a leitura do arquivo Excel, processa os dados e popula a tabela de segurança.
   */
  function handleFileSecurity() {
    document.querySelector('.title-table').textContent = 'Conferencia taxas de seguro';
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
        await populateTableSecurity(json);
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
    document.querySelector('.title-table').textContent = 'Conferencia taxas de Incentivo & Comissão';
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
   * Manipula o arquivo de comissão carregado.
   * Realiza a leitura do arquivo Excel, processa os dados e popula a tabela de Agente.
   */
  function handleFileAgent() {
    document.querySelector('.title-table').textContent = 'Conferencia de pagamento ao Agente';
    const filePondInstance = FilePond.find(document.querySelector('.file-upload-agent'));
    const file = filePondInstance.getFile();
  
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        await resetAndChangeHeaderTable(changeHeaderTableAgent);
        populateTableAgent(json);
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
      <th>Check</th>
      <th>Documento</th>
      <th>Valor TI</th>
      <th>Valor Sistema</th>
      <th>Status Valor</th>
      <th>Status</th>
      <th>Status Fatura</th>
      <th>Observação</th>
    </tr>`;
    document.querySelector('#incentive_management_table thead').innerHTML = header;
  }

  
  /**
   * Muda o cabeçalho da tabela de comissão.
   */
  async function changeHeaderTableComission() {
    const header = `<tr>
      <th>Check</th>
      <th>Adquirente</th>
      <th>BL</th>
      <th>Status</th>
      <th>Referencia</th>
      <th>Valor Comissão</th>
      <th>Valor Encontrado</th>
      <th>Status Valor</th>
      <th>Status da Fatura</th>
      
      
    </tr>`;
    document.querySelector('#incentive_management_table thead').innerHTML = header;
  }

  /**
   * Muda o cabeçalho da tabela de Agente.
   */
  async function changeHeaderTableAgent() {
    const header = `<tr>
      <th>Check</th>
      <th>MBL</th>
      <th>HBL</th>
      <th>Moeda</th>
      <th>Valor</th>
      <th>Valor do Sistema</th>
      <th>Status da Fatura</th>
      
      
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
   * Formata um valor numérico para o formato de moeda brasileira.
   * @param {number} value - Valor numérico a ser formatado.
   * @returns {string} Valor formatado em moeda brasileira (R$).
   */
    function formatToUSD(value) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(value);
    }



  /**
   * Formata um valor numérico para o formato de moeda brasileira.
   * @param {number} value - Valor numérico a ser formatado.
   * @returns {string} Valor formatado em moeda brasileira (R$).
   */
    function formatToMoney(value, money) {
     
      return value && money ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: money }).format(value) : 'NÃO DEFINIDO';
    }


  /**
   * Preenche a tabela de comissão com os dados fornecidos.
   * @param {Array<Array<string|number>>} data - Dados a serem populados na tabela.
   */
  function populateTableComission2(data) {

    
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
    async function populateTableComission(data) {

    
      const securityData = await makeRequest('/api/incentive-management/getAllComission');
  

      // Array para armazenar os novos dados
      const newData = [];
      
      data.slice(2).forEach(row => {
        if (row.some(cell => cell !== undefined && cell !== '')) {
          if (row[1] !== undefined && row[1] !== '') {
      
            const rowObservation = row[3] || null;
      
            // const matchingSecurity = securityData.find(security => 
            //   (security.Numero_Processo == row[3] || 
            //   security.Conhecimentos == row[5]) || 
            //   (rowObservation && rowObservation.includes(security.Conhecimentos)) || 
            //   (rowObservation && rowObservation.includes(security.Numero_Processo))
            // );

          const matchingSecurity = securityData.find(security => {
            if (row[3] == security.Numero_Processo) {
              // console.log('Matching by Numero_Processo:', security.Numero_Processo);
              return true;
            }
            
            if (row[5] == security.Conhecimentos) {
              // console.log('Matching by Conhecimentos:', security.Conhecimentos);
              return true;
            }
          

            if (rowObservation && new RegExp(`\\b${security.Conhecimentos}\\b`).test(rowObservation)) {
               // console.log('Matching by Conhecimentos rowObservation:', security.Conhecimentos);
              return true;
            }

            if (rowObservation && new RegExp(`\\b${security.Numero_Processo}\\b`).test(rowObservation)) {
               // console.log('Matching by rowObservation Numero_Processo:', security.Conhecimentos);
              return true;
            }
            
      
            return false;
          });






      
            if (matchingSecurity) {
              let statusValor = '-';
          
              if (row[9] == matchingSecurity.Valor_Recebimento_Total) {
                statusValor = '<span class="text-success">Valores Iguais</span>';
                if (matchingSecurity.IdMoeda_Recebimento != 110) {
                  statusValor = '<span class="text-danger">Moeda divergentes</span>';
                }
              } else {
                statusValor = '<span class="text-danger">Valores divergentes</span>';
              }
         
      
              newData.push({
                check: '<input class="form-check-input me-2 " type="checkbox">',
                adquirente: row[4] || '',
                data_saida: row[2] || '',
                bl: row[5] || '',
                di: row[6] || '',
                referencia_interna: row[3] || '',
                referenci_poly: row[7] || '',
                valor_comission: formatToBRL(parseFloat(row[9])) || '',
                status: '<span class="text-success">Processo encontrado</span>',
                Status_Fatura: '<span class="badge bg-success-transparent">' + matchingSecurity.Status_Fatura + '</span>',
                statusValor: statusValor,
                valorSistema: formatToMoney(parseFloat(matchingSecurity.Valor_Recebimento_Total), matchingSecurity.Sigla),
                actions: '<button class="btn btn-primary-light btn-icon ms-1 btn-sm task-delete-btn" title="Finalizar Fatura" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Finalizar Fatura"><i class="ri-lock-2-line"></i></button>'
              });
            } else {
              newData.push({
                check: '<input class="form-check-input me-2 " type="checkbox">',
                adquirente: row[4] || '',
                data_saida: row[2] || '',
                bl: row[5] || '',
                di: row[6] || '',
                referencia_interna: row[3] || '',
                referenci_poly: row[7] || '',
                valor_comission: formatToBRL(parseFloat(row[9])) || '',
                status: '<span class="text-danger">Processo não encontrado</span>',
                Status_Fatura: '<span class="badge bg-danger-transparent">-</span>',
                statusValor: '<span class="text-danger">Valor não encontrado</span>',
                valorSistema: '-',
                actions: '<button disabled class="btn btn-primary-light btn-icon ms-1 btn-sm task-delete-btn" title="Processo não encontrado" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Finalizar Fatura"><i class="ri-lock-2-line"></i></button>'
              });
            }
          }
        }
      });

      
      $.fn.dataTable.ext.type.order['currency-pre'] = function(data) {
        // Remove tudo exceto números, pontos e vírgulas
        return parseFloat(data.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
      };
   
  
      const table = $('#incentive_management_table').DataTable({
        dom: 'Bfrtip',
        pageInfo: false,
        pageLength: 15,
        data: newData,
        bInfo: false,
        columns: [
          { data: 'check' },
          { data: 'adquirente' },
          { data: 'bl' },
          { data: 'status' },
          { data: 'referencia_interna' },
          { data: 'valor_comission', type: 'currency' },
          { data: 'valorSistema', type: 'currency'},
          { data: 'statusValor' },
          { data: 'Status_Fatura' }
      ],
        buttons: [
          'excel', 'pdf'
        ],
        language: {
          url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
          searchPlaceholder: 'Pesquisar...',
        },
      });
  
  
  
  
    }

/**
 * Função que preenche a tabela de agente com os dados fornecidos e faz a comparação com os dados do sistema.
 * @param {Array<Array<string|number>>} data - Dados extraídos do Excel para serem populados na tabela.
 */
async function populateTableAgent(data) {
  try {
    // Faz uma requisição para buscar todos os agentes da API.
    const agentData = await makeRequest('/api/incentive-management/getAllAgent');
    
    // Array para armazenar os novos dados que serão exibidos na tabela.
    const newData = [];

    // Itera sobre os dados fornecidos do Excel, a partir da terceira linha (índice 2) para ignorar cabeçalhos.
    data.slice(2).forEach(row => {
      // Verifica se a linha tem ao menos uma célula preenchida. Caso contrário, a linha será ignorada.
      if (!(row[0] === undefined || row[0] === '' || row[0] === null) || !(row[1] === undefined || row[1] === '' || row[1] === null)) {
        
        // Procura um agente no sistema cujo MBL ou HBL correspondam aos valores da linha do Excel.
        const matchingAgent = agentData.find(agent => {
          return (row[0] == agent.MBL && agent.MBL) || (row[1] == agent.HBL && agent.HBL);
        });

        // Se um agente correspondente foi encontrado, começa a verificar os dados e preencher o status.
        if (matchingAgent) {
          let status_invoice = '';  // Variável para armazenar o status da comparação.

          // Validação do MBL - Verifica se o MBL da planilha corresponde ao do sistema.
          status_invoice += validateField(row[0], matchingAgent.MBL, 'MBL');

          // Validação do HBL - Verifica se o HBL da planilha corresponde ao do sistema.
          status_invoice += validateField(row[1], matchingAgent.HBL, 'HBL');

          // Validação da Moeda - Verifica se a moeda do sistema é a mesma da planilha.
          const moedaValida = new RegExp(`${matchingAgent.Moeda}`, 'i').test(row[2]);
          if (!moedaValida) {
            status_invoice += '<span class="badge bg-danger-transparent">Moeda divergente</span>';
          }

          // Validação do valor total - Verifica se o valor total da planilha corresponde ao do sistema.
          if (parseFloat(row[3]) !== parseFloat(matchingAgent.Valor_Total)) {
            status_invoice += '<span class="badge bg-danger-transparent">Valor divergente</span>';
          }

          // Verifica se o agente tem mais de uma fatura, e adiciona a respectiva mensagem de status.
          if (matchingAgent.Status == 1) {
            status_invoice += '<span class="badge bg-danger-transparent">Mais de uma fatura para o agente</span>';
          }

          // Se o status_invoice não tiver nenhuma mensagem de erro, significa que está tudo certo.
          if (status_invoice === '') {
            status_invoice = '<span class="badge bg-success-transparent">TUDO OK</span>';
          }

          // Adiciona os dados formatados e validados no array `newData` para exibição na tabela.
          newData.push({
            check: '<input class="form-check-input me-2 " type="checkbox">',  // Checkbox para seleção manual.
            mbl: row[0] || '',  // MBL da planilha ou valor vazio.
            hbl: row[1] || '',  // HBL da planilha ou valor vazio.
            moeda: row[2].toUpperCase() || '',  // Moeda da planilha ou valor vazio.
            valor: formatCurrency(parseFloat(row[3]), row[2]),  // Valor da planilha formatado.
            valorSistema: formatCurrency(matchingAgent.Valor_Total, matchingAgent.Moeda),  // Valor do sistema formatado.
            status_invoice: status_invoice  // Status final da fatura (validado ou divergente).
          });
        } else {
          // Se nenhum agente correspondente for encontrado, adiciona uma mensagem de aviso.
          newData.push({
            check: '<input class="form-check-input me-2 " type="checkbox">',  // Checkbox para seleção.
            mbl: row[0] || '',  // MBL da planilha ou valor vazio.
            hbl: row[1] || '',  // HBL da planilha ou valor vazio.
            moeda: row[2].toUpperCase() || '',  // Moeda da planilha ou valor vazio.
            valor: formatCurrency(row[3], row[2]),  // Valor da planilha formatado.
            valorSistema: 'NÃO DEFINIDO',  // Valor do sistema será vazio, pois o agente não foi encontrado.
            status_invoice: '<span class="badge bg-warning-transparent">Nenhum registro foi encontrado no sistema</span>'  // Status indicando que o registro não foi encontrado.
          });
        }
      }
    });

    // Inicializa o DataTable com os novos dados coletados.
    const table = $('#incentive_management_table').DataTable({
      dom: 'Bfrtip',  // Define a estrutura da tabela (botões e pesquisa no topo).
      pageInfo: false,  // Desabilita a exibição de informações de página.
      pageLength: 15,  // Define o número de linhas exibidas por página.
      data: newData,  // Alimenta a tabela com os dados processados.
      bInfo: false,  // Remove a exibição de informações gerais da tabela.
      columns: [
        { data: 'check' },  // Coluna de checkbox para seleção de linhas.
        { data: 'mbl' },  // Coluna de MBL.
        { data: 'hbl' },  // Coluna de HBL.
        { data: 'moeda' },  // Coluna de moeda.
        { data: 'valor' },  // Coluna do valor da planilha.
        { data: 'valorSistema' },  // Coluna do valor do sistema.
        { data: 'status_invoice' }  // Coluna do status de validação.
      ],
      buttons: ['excel', 'pdf'],  // Botões para exportar a tabela em Excel ou PDF.
      language: {
        url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",  // Tradução para português.
        searchPlaceholder: 'Pesquisar...',  // Placeholder do campo de busca.
      },
    });

  } catch (error) {
    // Em caso de erro ao buscar os dados do agente, exibe uma mensagem no console.
    console.error('Erro ao obter dados do agente:', error);
  }
}

/**
 * Função que valida um campo específico (MBL ou HBL) comparando a planilha com o sistema.
 * @param {string} fieldValue - Valor do campo na planilha.
 * @param {string} matchingValue - Valor correspondente no sistema.
 * @param {string} fieldLabel - Nome do campo para exibição de mensagens de erro.
 * @returns {string} - Mensagem de erro ou vazio se não houver erro.
 */
function validateField(fieldValue, matchingValue, fieldLabel) {
  const formattedValue = matchingValue || '';  // Formata o valor comparável do sistema.
  const regex = new RegExp(`${(formattedValue.trim()).replace(/-/g, '')}`);  // Remove traços e cria uma expressão regular.
  // Se o valor do campo na planilha não corresponder ao do sistema, retorna uma mensagem de erro.
  if (fieldValue && !regex.test((fieldValue || '').toString().replace(/-/g, ''))) {
    return `<span class="badge bg-danger-transparent">${fieldLabel} não encontrado</span>  `;
  }
  return '';  // Se tudo estiver correto, retorna uma string vazia.
}

/**
 * Função que formata um valor numérico como moeda.
 * @param {number} value - Valor a ser formatado.
 * @param {string} currency - Código da moeda (BRL, USD, etc.).
 * @returns {string} - Valor formatado como moeda.
 */
function formatCurrency(value, currency) {

  console.log(value, currency)
  return value ? value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: currency
  }) : 'NÃO DEFINIDO';
}

  
  /**
   * Preenche a tabela de segurança com os dados fornecidos.
   * @param {Array<Array<string|number>>} data - Dados a serem populados na tabela.
   */
  async function populateTableSecurity(data) {

    const securityData = await makeRequest('/api/incentive-management/getAllSecurity');
  
    // Array para armazenar os novos dados
    const newData = [];
    
    data.slice(7).forEach(row => {
      if (row.some(cell => cell !== undefined && cell !== '')) {
        if (row[10] !== undefined && row[10] !== '') {
          

          row[1] = row[1].replace(/\s+/g, '');
     
    
          const rowObservation = row[17] || null;

          const matchingSecurity = securityData.find(security => {
            if (row[1] == security.Numero_Processo) {
              // console.log('Matching by Numero_Processo:', security.Numero_Processo);
              return true;
            }
            
            if (row[1] == security.Conhecimentos) {
              // console.log('Matching by Conhecimentos:', security.Conhecimentos);
              return true;
            }
          

            if (rowObservation && new RegExp(`\\b${security.Conhecimentos}\\b`).test(rowObservation)) {
               // console.log('Matching by Conhecimentos rowObservation:', security.Conhecimentos);
              return true;
            }

            if (rowObservation && new RegExp(`\\b${security.Numero_Processo}\\b`).test(rowObservation)) {
               // console.log('Matching by rowObservation Numero_Processo:', security.Conhecimentos);
              return true;
            }
            
      
            return false;
          });

   
      
             let valorSemFormat = (row[10]).toString().replace('.', '');
 

          if (matchingSecurity) {
  
            if(row[1] == 'IM2777-24'){
              console.log(matchingSecurity)
            }
            
            let statusValor = '-';
            if (row[10] == matchingSecurity.Valor_Pagamento_Total) {
              statusValor = '<span class="text-success">Valores Iguais</span>';
              if (matchingSecurity.IdMoeda_Pagamento != 31) {
                statusValor = '<span class="text-danger">Moeda divergentes</span>';
              }
            } else {
              statusValor = '<span class="text-danger">Valores divergentes</span>';
            }
    
            newData.push({
              check: '<input class="form-check-input me-2 " type="checkbox">',
              document: row[1] || '',
              data_embarque: excelDateToJSDate(row[5]) || '',
              valor_ti: formatToUSD(parseFloat(row[10])) || '',
              observation: rowObservation,
              status: '<span class="text-success">Processo encontrado</span>',
              Status_Fatura: '<span class="badge bg-success-transparent">' + matchingSecurity.Status_Fatura + '</span>',
              statusValor: statusValor,
              valorSistema: formatToMoney(parseFloat(matchingSecurity.Valor_Pagamento_Total), matchingSecurity.Sigla),
              actions: '<button class="btn btn-primary-light btn-icon ms-1 btn-sm task-delete-btn" title="Finalizar Fatura" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Finalizar Fatura"><i class="ri-lock-2-line"></i></button>'
            });
          } else {
            newData.push({
              check: '<input class="form-check-input me-2 " type="checkbox">',
              document: row[1] || '',
              data_embarque: excelDateToJSDate(row[5]) || '',
              valor_ti: formatToUSD(parseFloat(row[10])) || '',
              observation: rowObservation,
              status: '<span class="text-danger">Processo não encontrado</span>',
              Status_Fatura: '<span class="badge bg-danger-transparent">-</span>',
              statusValor: '<span class="text-danger">Valor não encontrado</span>',
              valorSistema: '-',
              actions: '<button disabled class="btn btn-primary-light btn-icon ms-1 btn-sm task-delete-btn" title="Processo não encontrado" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Finalizar Fatura"><i class="ri-lock-2-line"></i></button>'
            });
          }
        }
      }
    });

    // Função customizada para ordenar valores monetários no DataTable
    $.fn.dataTable.ext.type.order['currency-pre'] = function(data) {
      // Remove tudo exceto números, pontos e vírgulas
      return parseFloat(data.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
    };
 

    const table = $('#incentive_management_table').DataTable({
      dom: 'Bfrtip',
      pageInfo: false,
      pageLength: 15,
      data: newData,
      bInfo: false,
      columns: [
        { data: 'check' },
        { data: 'document' },
        { data: 'valor_ti', type: 'currency'},
        { data: 'valorSistema', type: 'currency'  },
        { data: 'statusValor' },
        { data: 'status' },
        { data: 'Status_Fatura' },
        { data: 'observation' }
    ],
      buttons: [
        'excel', 'pdf'
      ],
      language: {
        url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
        searchPlaceholder: 'Pesquisar...',
      },
    });




  }
  