// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
let startDateGlobal, endDateGlobal, dataExport;

// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {
    // Verifica o localStorage para alterar a mensagem de boas vindas
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
 
    if (!localStorage.getItem('StorageGoogle')) {
        window.location.href = '/app/login';
    } else {
        document.querySelector('body').style.display = 'block'
    }
 
 
 
    const loginTime = localStorage.getItem('loginTime');
 
    if (loginTime) {
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - parseInt(loginTime);
    
        // 24 horas em milissegundos
        const twentyFourHours = 1000;
 
        if (elapsedTime >= twentyFourHours) {
            // Limpa os dados do usuário e redireciona para a página de login
            localStorage.removeItem('StorageGoogle');
            localStorage.removeItem('loginTime');
            window.location.href = '/app/login';
        }
    }
};

// Verifica o localStorage para setar informações
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
 
    return StorageGoogle;
};

// Verifica o localStorage para setar informações
async function setInfosLogin(StorageGoogle) {
    document.querySelectorAll('.imgUser').forEach(element => {
        element.src = StorageGoogle.picture ? StorageGoogle.picture : StorageGoogle.system_image
    });
 
    document.querySelectorAll('.UserName').forEach(element => {
        element.textContent = StorageGoogle.given_name.replace(/[^a-zA-Z\s]/g, '');
    });
 
    document.querySelectorAll('.buttonLogout').forEach(element => {
        element.addEventListener('click', function (e) {
                e.preventDefault()
        
                localStorage.removeItem('StorageGoogle');
                localStorage.removeItem('loginTime');
        
                window.location.href = '/app/login'
        })
 
    });
 
 
};

// Função Lista de faturas
async function invoicesTable(totalInvoices) {
    // Fazer a requisição à API
    const divlistInvoices = document.getElementById('listInvoices');
    
    let printlistInvoices = '';

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        let icon = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
        }

        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        

        const date = await formattedDateTime(totalInvoices[index].Data);
        const clientName = totalInvoices[index].Pessoa
       

        printlistInvoices += `
            <a class="border-0" id="${totalInvoices[index].Numero_Processo}">
                <div class="list-group-item border-0">
                   <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                        <div class="w-100">
                            <div class="d-flex align-items-top justify-content-between">
                                <div class="mt-0">
                                    <p class="mb-0 fw-semibold"><span class="fs-13 me-3">${clientName}</span>
                                    </p><span class="mb-0 fs-13 text-muted">${totalInvoices[index].Numero_Processo} - ${totalInvoices[index].Situacao_Fatura}</span>
                                </div>
                                <div class="text-muted fs-20 text-center"></div> 
                                <span class="ms-auto"> 
                                    <span class="text-end text-danger d-block fs-15">${formattedValue}</span> 
                                    <span class="text-end text-muted d-block fs-13">${date}</span> 
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </a>`
    }

    buttons: [
        'excel', 'pdf', 'print'
    ]

    divlistInvoices.innerHTML = printlistInvoices

    // Preparar os dados para exportação no excel 
    dataExport = totalInvoices.map(invoice => {
        return {
            Nome: invoice.Pessoa,
            'Número do Processo': invoice.Numero_Processo,
            Modal: invoice.Modal,
            'Situação da Fatura': invoice.Situacao_Fatura,
            Valor: invoice.Valor,
            Moeda: invoice.Moeda,
            Data: new Date(invoice.Data).toLocaleDateString('pt-BR')
        };
    });

};

// Função Despesas Administativas puxa da API
async function tableFinancialExpenses(dados) {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_despesasFIN')) {
        $('#table_despesasFIN').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#table_despesasFIN').DataTable({
        dom: 'Bfrtip',
        pageLength: 10,
        order: [[0, 'desc']],
        data: dados.data,

        columns: [
            { data: 'Data_Vencimento' },
            { data: 'Situacao' },
            { data: 'Historico_Resumo' },
            { data: 'Pessoa' },
            { data: 'Tipo_Fatura' },
            { data: 'Valor' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

};

// Função para formatar a data (dia, mês, ano) no gráfico
async function formattedDateTime(time) {
    const date = new Date(time);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
};

// Função para calcular o valor total dos cards
async function totalCard(data) {
    const totalInvoicing = document.querySelector('.total-invoicing')
    const totalAnticipated = document.querySelector('.total-anticipated')
    const totalInvoiceLosers = document.querySelector('.total-invoiceLosers')
    const totalTotalReceived = document.querySelector('.total-totalReceived')
    const totalTotalPaid = document.querySelector('.total-totalPaid')
    const totalADM = document.querySelector('.total-ADM')

    let invoicing = 0
    let anticipated = 0
    let invoiceLosers = 0
    let totalReceived = 0
    let totalPaid = 0
    let total_ADM = 0


    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.Tipo_Fatura && item.Tipo_Fatura === 'Faturado') {
            invoicing += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Antecipado') {
            anticipated += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Vencido') {
            invoiceLosers += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Recebido') {
            totalReceived += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Pago') {
            totalPaid += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Adm') {
            total_ADM += item.Valor_Total
        }
        
    }

    invoicing = invoicing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    anticipated = anticipated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    invoiceLosers = invoiceLosers.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    totalReceived = totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    totalPaid = totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    total_ADM = total_ADM.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    totalInvoicing.textContent = invoicing
    totalAnticipated.textContent = anticipated
    totalInvoiceLosers.textContent = invoiceLosers
    totalTotalReceived.textContent = totalReceived
    totalTotalPaid.textContent = totalPaid
    totalADM.textContent = total_ADM
};

// Função para calcular os valores do recibo por mês no gráfico
async function received_for_month(data) {
    const filteredData = data.filter(element => element.Tipo_Fatura === 'Recebido');
    const sum_for_month = [];
 
    for (let i = 0; i < filteredData.length; i++) {
       const item = filteredData[i];
       const [year, month] = item.Data.split('-').map(Number);
       const received = item.Valor_Total;
 
       const existing_month_year = sum_for_month.find(ma => ma.YEAR === year && ma.MONTH === month); // Encontra o mês e ano na consulta do banco e salva na variável
 
       if (existing_month_year) {
          existing_month_year.RECEIVED += received; // Se o mês e o ano existirem na variável, ele concatena o novo valor localizado
       } else {
          sum_for_month.push({
             YEAR: year,
             MONTH: month,
             RECEIVED: received
          });
       }
    }
 
    sum_for_month.sort((a, b) => a.YEAR - b.YEAR || a.MONTH - b.MONTH); // Ordena os meses e anos em ordem crescente
    return sum_for_month;
};

// Função para calcular os valores de despesas por mês no gráfico
async function paid_for_month(data) {
    const filteredData = data.filter(element => element.Tipo_Fatura === 'Pago');
    const sum_for_month = [];
 
    for (let i = 0; i < filteredData.length; i++) {
       const item = filteredData[i];
       const [year, month] = item.Data.split('-').map(Number);
       const paid = item.Valor_Total;
 
       const existing_month_year = sum_for_month.find(ma => ma.YEAR === year && ma.MONTH === month); // Encontra o mês e ano na consulta do banco e salva na variável
 
       if (existing_month_year) {
          existing_month_year.PAID += paid; // Se o mês e o ano existirem na variável, ele concatena o novo valor localizado
       } else {
          sum_for_month.push({
             YEAR: year,
             MONTH: month,
             PAID: paid
          });
       }
    }
 
    sum_for_month.sort((a, b) => a.YEAR - b.YEAR || a.MONTH - b.MONTH); // Ordena os meses e anos em ordem crescente
    return sum_for_month;
};

// Função para gerar o gráfico
let chart
async function graphic_month(data) {
    const received = await received_for_month(data)
    const paid = await paid_for_month(data)

    const array_received = new Array(12).fill(0)
    const array_paid = new Array(12).fill(0)

    received.forEach(item => {
        array_received[item.MONTH -1] = Number(item.RECEIVED.toFixed(2))
    });

    paid.forEach(item => {
        array_paid[item.MONTH -1] = Number(item.PAID.toFixed(2))
    });

    var options = {
        series: [
           {
              name: 'Receita',
              data: array_received
           },
           {
              name: 'Despesas',
              data: array_paid
           },
        ],
  
        chart: {
           type: 'bar',
           height: 450,
           toolbar: {
              show: false,
           },
        },
  
        colors: ['#45cb86', '#f06548'],
  
        plotOptions: {
           bar: {
                 borderRadius: 3,
                 columnWidth: '60%',
                 horizontal: false,
                 dataLabels: {
                    position: 'top',
                 },
           }
        },
  
        dataLabels: {
           enabled: false,
        },
  
        stroke: {
           show: true,
           width: 1,
           colors: ['#fff']
        },
  
        tooltip: {
           shared: true,
           enabled: true,
           intersect: false,
           y: {
              formatter: function (val) {
                return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              }
           }
        },
  
        xaxis: {
           categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
           labels: {
              show: true,
           }
        },
  
        yaxis: {
           show: false,
        },
     };
  
     // Verifique se o gráfico já existe
     if (chart) {
        // Se existir, atualize os dados e renderize novamente
        chart.updateOptions(options);
     } else {
        // Se não existir, crie um novo gráfico
        chart = new ApexCharts(document.querySelector("#invoice-chart"), options);
        chart.render();
     }
};

// Inicializa o seletor de data (Filtro)
async function initializeDatePicker() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1); // 1° de Janeiro do ano atual

    flatpickr("#inputDateFilter", {
        mode: "range",
        dateFormat: "d M Y",
        defaultDate: [startOfYear, today], // Defini o intervalo de data
    });
};

// Função do Filtro
async function eventClick() {
    //====== BOTÃO DE FILTRO ======//
    const inputDateFilter = document.getElementById('inputDateFilter');
    const btn_filter = document.getElementById('btn-filter');
    btn_filter.addEventListener('click', async function (e) {
        e.preventDefault();
        // Obtém o valor do input
        const dateRange = inputDateFilter.value;
        // Divide o valor em duas data separadas
        const [startDateStr, endDateStr] = dateRange.split(' até ');
        // Função para converter uma data "01 jan 2024" para "2024-01-01"
        const formatDate = (dateStr) => {
            if (!dateStr) {
                return false
            } else {
                const [day, month, year] = dateStr.split(' ');
                const month_map = {
                    'Jan': '01',
                    'Fev': '02',
                    'Mar': '03',
                    'Abr': '04',
                    'Mai': '05',
                    'Jun': '06',
                    'Jul': '07',
                    'Ago': '08',
                    'Set': '09',
                    'Out': '10',
                    'Nov': '11',
                    'Dez': '12',
                };

                return `${year}-${month_map[month]}-${day.padStart(2, 0)}`
            }
        };

        startDateGlobal = formatDate(startDateStr);
        endDateGlobal = formatDate(endDateStr);
        const invoiceActive = document.querySelector('.InvoiceActive').getAttribute('invoicesTable');

        // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
        document.querySelector('#loader2').classList.remove('d-none')

        const outstanding = await makeRequest(`/api/financial-indicators/outstanding`, 'POST', {startDateGlobal, endDateGlobal});
        const despesaAdm = await makeRequest(`/api/financial-indicators/financial-expenses`, 'POST', {startDateGlobal, endDateGlobal});
        const totalInvoices = await makeRequest(`/api/financial-indicators/totalInvoices`, 'POST', {startDateGlobal, endDateGlobal, situacao: invoiceActive});

        await totalCard(outstanding);
        await graphic_month(outstanding);
        await tableFinancialExpenses(despesaAdm);
        await invoicesTable(totalInvoices);

        // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
        document.querySelector('#loader2').classList.add('d-none')
    })

    //====== FILTRO DE FATURA ======//
    const nameInvoices = document.querySelectorAll('[invoicesTable]')
    nameInvoices.forEach(item => {
        item.addEventListener('click', async function(e){
            e.preventDefault()

            // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
            document.querySelector('#loader1').classList.remove('d-none')

            const invoiceActive = document.querySelector('.invoiceActive')
            invoiceActive.classList.remove('invoiceActive')
            this.classList.add('invoiceActive')
            const Invoice = this.getAttribute('invoicesTable')
            const totalInvoices = await makeRequest(`/api/financial-indicators/totalInvoices`, 'POST', {startDateGlobal, endDateGlobal, situacao: Invoice});
            await invoicesTable(totalInvoices);

            document.querySelector('#loader1').classList.add('d-none')

        })
        
    });

     // Função para exportar o relatório de faturas
     document.getElementById('exportExcel').addEventListener('click', () => {
        

        // Converta os dados em uma planilha
        let worksheet = XLSX.utils.json_to_sheet(dataExport);
        
        // Crie uma nova pasta de trabalho e adicione a planilha
        let workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Faturas");

        // Exporte a pasta de trabalho para um arquivo Excel
        XLSX.writeFile(workbook, "faturas.xlsx");
    });

    document.querySelectorAll('[statusFatura]').forEach(item => {
        item.addEventListener('click', async function(e){
            e.preventDefault()
            await showMore(this.getAttribute('statusFatura'))
        })
    });
};

// Função que envia para a proxima janela o id da pessoa clicada
async function showMore(statusFatura) {
    const existDate = !startDateGlobal && !endDateGlobal ? `/app/financial/outstanding/table?status=${statusFatura}` : `/app/financial/outstanding/table?status=${statusFatura}&startDate=${startDateGlobal}&endDate=${endDateGlobal}`
    const body = {
       url: existDate,
       max: true
    }
 
    window.ipcRenderer.invoke('open-exWindow', body);
 };



document.addEventListener("DOMContentLoaded", async () => {
    await checkLoginExpiration()

    setInterval(async () => {
        await checkLoginExpiration()
    }, 1000);

    const StorageGoogle = await getInfosLogin();
    await setInfosLogin(StorageGoogle)

    const outstanding = await makeRequest(`/api/financial-indicators/outstanding`, 'POST');
    const despesaAdm = await makeRequest(`/api/financial-indicators/financial-expenses`, 'POST');
    const totalInvoices = await makeRequest(`/api/financial-indicators/totalInvoices`, 'POST');

    await totalCard(outstanding);
    await graphic_month(outstanding);
    await invoicesTable(totalInvoices); // Inicia a lista das faturas com a situação Parcialmente quitada
    await tableFinancialExpenses(despesaAdm);

    await initializeDatePicker();
    await eventClick();

    introMain()

    document.querySelector('#loader2').classList.add('d-none')

})