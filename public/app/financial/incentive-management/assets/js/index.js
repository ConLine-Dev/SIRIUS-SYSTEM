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
   * Preenche a tabela de segurança com os dados fornecidos.
   * @param {Array<Array<string|number>>} data - Dados a serem populados na tabela.
   */
    async function populateTableAgent(data) {

    

      const agentData = await makeRequest('/api/incentive-management/getAllAgent');

      // console.log(data, agentData)
  
      // Array para armazenar os novos dados
      const newData = [];
      
      data.slice(2).forEach(row => {

        if (row.some(cell => cell !== undefined && cell !== '')) {
          if (row[1] !== undefined && row[1] !== '') {
      
          const matchingAgent = agentData.find(agent => {
            if (row[0] == agent.MBL) {
              return true;
            }

            if (row[1] == agent.HBL) {
              return true;
            }
      
            return false;
          });


          console.log(matchingAgent, row[0])
            if (matchingAgent) {
              let status_invoice = ''
              
              // if (row[0] != matchingAgent.MBL) {
              //   status_invoice += '<span class="badge bg-danger-transparent">MBL não encontrado</span>'
              // }

              if (row[0] != '' && row[0] != undefined) {
                const newMbl = matchingAgent.MBL || ''
                const mbl = new RegExp(`${(((newMbl)).trim()).replace(/-/g, '')}`).test((row[0].toString()).replace(/-/g, ''));

              if (!mbl) {
                status_invoice += '<span class="badge bg-danger-transparent">MBL não encontrado</span>  ';
              }
              }

              if ((row[1] != '' && row[1] != undefined)) {
          
                const newHbl = matchingAgent.HBL || ''
                const hbl = new RegExp(`${(((newHbl)).trim()).replace(/-/g, '')}`).test((row[1].toString()).replace(/-/g, ''));

              if (!hbl) {
                status_invoice += '<span class="badge bg-danger-transparent">HBL não encontrado</span>  ';
              }
              }
         
              
              

            
             const moeda = new RegExp(`${matchingAgent.Moeda}`, 'i').test(row[2]);

             if (!moeda) {
               status_invoice += '<span class="badge bg-danger-transparent">Moeda divergente</span>  ';
             }
             
              console.log(matchingAgent, row[2])

            if (row[3] != matchingAgent.Valor_Total) {
              status_invoice += '<span class="badge bg-danger-transparent">Valor divergente</span>  '
            }

            if (matchingAgent.Status == 1) {

              status_invoice += '<span class="badge bg-danger-transparent">Mais de uma fatura para o agente</span>  '

             }

             const valor_formatado = (matchingAgent.Valor_Total).toLocaleString('pt-BR', {
              style: 'currency',
              currency: matchingAgent.Moeda
            });

            const valor_formatado_excel = (row[3]).toLocaleString('pt-BR', {
              style: 'currency',
              currency: row[2]
            });

            if (status_invoice == '') {
              status_invoice = '<span class="badge bg-success-transparent">OK</span>'
            }
             
             
              newData.push({
                check: '<input class="form-check-input me-2 " type="checkbox">',
                mbl: row[0] || '',
                hbl: row[1] || '',
                moeda: row[2] || '',
                valor: valor_formatado_excel || '',
                valorSistema: valor_formatado || '',
                status_invoice: status_invoice
              })


            } else {

              const valor_formatado_excel = (row[3]).toLocaleString('pt-BR', {
                style: 'currency',
                currency: row[2]
              });

              newData.push({
                check: '<input class="form-check-input me-2 " type="checkbox">',
                mbl: row[0] || '',
                hbl: row[1] || '',
                moeda: row[2] || '',
                valor: valor_formatado_excel || '',
                valorSistema: '',
                status_invoice: '<span class="badge bg-warning-transparent">Nenhum registro foi encontrado no sistema</span>'
              })
            }
          }
        }
      });

      
      // $.fn.dataTable.ext.type.order['currency-pre'] = function(data) {
      //   // Remove tudo exceto números, pontos e vírgulas
      //   return parseFloat(data.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
      // };
   
  
      const table = $('#incentive_management_table').DataTable({
        dom: 'Bfrtip',
        pageInfo: false,
        pageLength: 15,
        data: newData,
        bInfo: false,
        columns: [
          { data: 'check' },
          { data: 'mbl' },
          { data: 'hbl' },
          { data: 'moeda' },
          { data: 'valor' },
          { data: 'valorSistema' },
          { data: 'status_invoice' }
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
  