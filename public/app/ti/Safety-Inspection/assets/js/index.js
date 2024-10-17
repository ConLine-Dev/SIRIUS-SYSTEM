const table = [];

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {


    await loadListMonitoring();
    await correctiveActionsPending();   
    await loadComplianceData()



    document.querySelector('#loader2').classList.add('d-none')

})

async function charts(conformidadeData, mesesData, conformidadeSeries) {

    // Pie Chart (Distribuição de Conformidade)
    var pieOptions = {
        chart: {
            type: 'pie'
        },
        series: conformidadeData, // [conforme, naoConforme] e.g. [80, 20]
        labels: ['Conforme', 'Não Conforme'],
        colors: ['#28a745', '#dc3545'],
    };

    var compliancePieChart = new ApexCharts(document.querySelector("#compliancePieChart"), pieOptions);
    compliancePieChart.render();

    // Gerar nomes dos meses ou usar meses fornecidos
    const months = mesesData || Array.from({ length: 12 }, (_, i) => {
        const date = new Date(0, i);
        return date.toLocaleString('pt-BR', { month: 'short' });
    });

    // Bar Chart (Tendência de Conformidade ao longo dos meses)
    var barOptions = {
        chart: {
            type: 'bar'
        },
        series: [{
            name: 'Taxa de Conformidade (%)',
            data: conformidadeSeries // [70, 75, 65, 80, 85, 90] por exemplo
        }],
        xaxis: {
            categories: months // meses (e.g. Jan, Feb, Mar...)
        },
        colors: ['#3498db'],
    };

    var complianceTrendChart = new ApexCharts(document.querySelector("#complianceTrendChart"), barOptions);
    complianceTrendChart.render();
}


// Verifica informações no localStorage do usuario logado
// Esta função recupera e retorna os dados armazenados localmente relacionados ao login do Google.
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}




// Função que envia para a proxima janela o id da senha clicada
async function openInspection() {
    const body = {
        url: `/app/ti/Safety-Inspection/Inspections`,
        max:true
    }
    window.ipcRenderer.invoke('open-exWindow', body);
 };

 // Função que envia para a proxima janela o id da senha clicada
async function openActions() {
    const body = {
        url: `/app/ti/Safety-Inspection/Corrective-Actions`,
        max:true
    }
    window.ipcRenderer.invoke('open-exWindow', body);
 };


async function loadListMonitoring(){
const Monitoring = await makeRequest(`/api/safety-inspection/safety_monitoring`);
    document.querySelector('.BodyMonitoringSystems').innerHTML = ''
    document.querySelector('.BodyLockingDevices').innerHTML = ''

    for (let index = 0; index < Monitoring.length; index++) {
        const element = Monitoring[index];

        if(element.type == 1){
            document.querySelector('.BodyMonitoringSystems').innerHTML += `<li class="list-group-item border-top-0 border-start-0 border-end-0">
            <a href="javascript:void(0);">
              <div class="d-flex align-items-center">
                <div class="me-2 lh-1">
                  <span class="avatar avatar-md avatar-rounded bg-primary-transparent"> R </span>
                </div>
                <div class="flex-fill">
                  <p class="mb-0 fw-semibold">${element.name}</p>
                  <p class="fs-12 text-muted mb-0"></p>
                </div>
                <div class="text-end">
                  <p class="mb-0 fs-12"></p>
                  ${element.status == 1 ? `<span class="badge bg-success-transparent">Online</span>` : `<span class="badge bg-danger-transparent">Inativo</span>`}
                </div>
              </div>
            </a>
          </li>`
           
        }else if(element.type == 2){
            document.querySelector('.BodyLockingDevices').innerHTML += `<li class="list-group-item border-top-0 border-start-0 border-end-0">
            <a href="javascript:void(0);">
              <div class="d-flex align-items-center">
                <div class="me-2 lh-1">
                  <span class="avatar avatar-md avatar-rounded bg-primary-transparent"> R </span>
                </div>
                <div class="flex-fill">
                  <p class="mb-0 fw-semibold">${element.name}</p>
                  <p class="fs-12 text-muted mb-0"></p>
                </div>
                <div class="text-end">
                  <p class="mb-0 fs-12"></p>
                  ${element.status == 1 ? `<span class="badge bg-success-transparent">Online</span>` : `<span class="badge bg-danger-transparent">Inativo</span>`}
                </div>
              </div>
            </a>
          </li>`
        }
        
    }
}


// Esta função cria ou recria a tabela de controle de senhas na página
async function correctiveActionsPending() {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#corrective-actions-pedings')) {
        $('#corrective-actions-pedings').DataTable().destroy();
    }


    // Criar a nova tabela com os dados da API
    table['corrective-actions-pedings'] =  $('#corrective-actions-pedings').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: '200px',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/safety-inspection/corrective-actions`,
            dataSrc: ''
          },

        columns: [
            { data: 'id' },
            { data: 'description' },
            { data: 'create_at',
             render: function(data) {
                    return formatDate(data);
                }
            },
            { data: 'status', 
             render: function(data) {
                return data == 1 ? '<span class="badge bg-success-transparent">Concluído</span>' : '<span class="badge bg-warning-transparent">Pendente</span>';
             },
            },
        ],
        createdRow: function(row, data, dataIndex) {
            // // Adiciona o atributo com o id da senha 
            // $(row).attr('password-id', data.id);
            // // Adicionar evento click na linha 
            // $(row).on('dblclick', async function() {
            //     const password_id = $(this).attr('password-id'); // Captura o id do password
            //     await openPassword(password_id);
            // });
        },
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    // Espera o carregamento completo dos dados via AJAX
    table['corrective-actions-pedings'].on('xhr.dt', function() {
        // Coloque aqui o código que precisa ser executado após os dados serem carregados

        // introMain()

        // document.querySelector('#corrective-actions input').focus()
    });

    // Evento disparado quando a tabela é redesenhada
    table['corrective-actions-pedings'].on('draw.dt', function() {
        // Coloque aqui o código que precisa ser executado após o redesenho da tabela
    });


   
}


// Função para organizar inspeções e ações corretivas por mês
function organizeByMonth(data, dateField) {
    const monthlyData = {};

    data.forEach(item => {
        const date = new Date(item[dateField]);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`; // Exemplo: "2023-10" (ano-mês)

        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        monthlyData[monthYear]++;
    });

    return monthlyData; // Retorna um objeto com o número de itens por mês-ano
}

// Função para calcular a taxa de conformidade por mês
function calculateMonthlyComplianceRates(inspectionsByMonth, correctiveActionsByMonth) {
    const months = Object.keys(inspectionsByMonth); // Obter os meses disponíveis

    return months.map(month => {
        const inspections = inspectionsByMonth[month] || 0;
        const correctiveActions = correctiveActionsByMonth[month] || 0;

        const total = inspections + correctiveActions;
        return total > 0 ? (inspections / total) * 100 : 0; // Evitar divisão por zero
    });
}

async function loadComplianceData() {
    // Buscar dados das APIs
    const corrective_actions = await makeRequest(`/api/safety-inspection/corrective-actions`);
    const inspections = await makeRequest(`/api/safety-inspection/inspections`);
    const corrective_actions_completed = await makeRequest(`/api/safety-inspection/corrective-actions-completed`);

    // Organizar inspeções e ações corretivas por mês
    const inspectionsByMonth = organizeByMonth(inspections, 'date'); // Organizar por campo 'date'
    const correctiveActionsByMonth = organizeByMonth(corrective_actions, 'create_at'); // Organizar por 'create_at'

    // Calcular as taxas de conformidade por mês
    const monthlyComplianceRates = calculateMonthlyComplianceRates(inspectionsByMonth, correctiveActionsByMonth);

    // Obter os meses (por exemplo, "2023-10", "2023-11")
    const months = Object.keys(inspectionsByMonth);

    // Atualizar a interface
    document.querySelector('#ComplianceRate').innerText = monthlyComplianceRates.reduce((a, b) => a + b, 0) / monthlyComplianceRates.length + '%'; // Média geral

    // Chamar a função para desenhar gráficos
    await charts([inspections.length, corrective_actions.length], months, monthlyComplianceRates);

    console.log("Corrective Actions:", corrective_actions);
    console.log("Inspections:", inspections);
    console.log("Monthly Compliance Rates:", monthlyComplianceRates);


    document.querySelector('#corrective_actions_completed').innerText = corrective_actions_completed.length
    document.querySelector('#corrective_actions').innerText = corrective_actions.length
    // document.querySelector('#ComplianceRate').innerText = ComplianceRate+'%'
}


function formatDate(dateString) {
    // Dividir a string de data no formato "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-');
    
    // Retornar no formato "DD/MM/YYYY"
    return `${day}/${month}/${year}`;
}
