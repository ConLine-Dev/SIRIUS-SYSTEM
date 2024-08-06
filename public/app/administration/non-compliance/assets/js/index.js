
// Conecta-se ao servidor Socket.io
const socket = io();

 // Evento para receber mensagens do servidor
 socket.on('att-non-compliance', async (msg) => {
    document.querySelector('#loader2').classList.remove('d-none')
    await listPendingOccurrences();
    await listAllOccurrences();
    await listAllActions()
    await occurrencesStatusChart()
    await occurrencesTypeChart()
    document.querySelector('#loader2').classList.add('d-none')
});

const elements = {
    newOccurenceButton: document.querySelector('#newOccurenceButton'),
    rowTableOccurence: document.querySelectorAll('#occurrences_table tbody tr')
}


async function listPendingOccurrences(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/getPendingOccurrences`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#pending_occurrences_table')) {
        $('#pending_occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#pending_occurrences_table').DataTable({
        dom: 'frtip',
        scrollY: '270px',  // Altura fixa com rolagem
        scrollCollapse: false, // Permite a tabela colapsar caso tenha menos dados
        paging: false, // Desativar paginação para usar rolagem
        order: [[0, 'desc']],
        data: dados,
        pageInfo: false,
        bInfo: false,
        columns: [
            { data: 'reference' },
            { data: 'title' },
            { data: 'type' },
            { data: 'responsibles' },
            { data: 'status' },
            { data: 'date_occurrence' },
            // { data: 'action' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf'
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
        },
        "rowCallback": function(row, data, index) {
            // Adiciona um atributo id a cada linha
            $(row).attr('occurrence-id', data.id);
        },
        initComplete: function () {
            requestAnimationFrame(async () => {
                await dblClickOnOccurrence('#pending_occurrences_table')
            });
        },
    });

    
}

async function generateCharts(data){
    // carrega as unidades cadastradas (filiais)
    const Units = await makeRequest(`/api/non-compliance/AllUnit`);
    console.log(Units,data)
   
     // Dados para preencher os elementos
     const occurrencesByUnit = await Promise.all(Units.map(async (unit) => {
        // Filtra as ocorrências para a unidade atual
        const unitOccurrences = data.filter(item => item.company_id === unit.id);
        const total = unitOccurrences.length.toString().padStart(4, '0');
        
        // Retorna um objeto com os dados da unidade
        return {
            city: unit.city,
            country: unit.country,
            total: total
        };
    }));

    // Preenche os elementos de ocorrências por unidade
    const occurrencesContainer = document.querySelector('.bodyOccurrencePerUnit');
    occurrencesContainer.innerHTML = '';
    occurrencesByUnit.forEach(unit => {
        const unitElement = `
            <div class="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-12">
                <div class="d-flex align-items-top">
                    <div class="me-3"> <span class="avatar text-primary"> <i class="ti ti-files fs-18"></i> </span> </div>
                    <div> <span class="d-block mb-1 text-muted">${unit.city} | ${unit.country}</span>
                        <h6 class="fw-semibold mb-0">${unit.total}</h6> </div>
                </div>
            </div>
        `;
        occurrencesContainer.insertAdjacentHTML('beforeend', unitElement);
    });

      // Filtra ocorrências abertas neste mês
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
  
      const openOccurrences = data.filter(item => {
          const occurrenceDate = new Date(item.date_occurrence_noformat);
          return occurrenceDate.getMonth() === currentMonth && 
                 occurrenceDate.getFullYear() === currentYear;
      }).length;


      document.querySelector('.open-occurrences').textContent = openOccurrences.toString().padStart(openOccurrences.length >= 2 ? 4 : 2, '0');
      

     await occurrencesStatusChart(data)
     await occurrencesTypeChart(data)

   
}   

// Função fictícia para calcular o tempo médio de resolução
function calculateAverageResolutionTime(data) {
    // Calcule o tempo médio de resolução com base nos dados
    return (data.reduce((acc, item) => acc + item.resolutionTime, 0) / data.length).toFixed(1);
}

async function listAllOccurrences(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/AllOccurrence`);

    await generateCharts(dados)

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#all_occurrences_table')) {
        $('#all_occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#all_occurrences_table').DataTable({
        dom: 'frtip',
        pageLength: 5,
        order: [[0, 'desc']],
        data: dados,
        pageInfo: false,
        bInfo: false,
        columns: [
            { data: 'reference' },
            { data: 'title' },
            { data: 'description' },
            { data: 'type' },
            { data: 'responsibles' },
            { data: 'status' },
            { data: 'date_occurrence' },
            // { data: 'action' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf'
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
        },
        "rowCallback": function(row, data, index) {
            // Adiciona um atributo id a cada linha
            $(row).attr('occurrence-id', data.id);
        },
        initComplete: function () {
            requestAnimationFrame(async () => {
                await dblClickOnOccurrence('#all_occurrences_table')
            });
        },
    });
    
}

async function occurrencesStatusChart(data) {
    // Calcula a quantidade de ocorrências finalizadas e em andamento
    const finishOccurrences = data.filter(item => item.statusID === 7).length;
    const progressOccurrences = data.filter(item => item.statusID !== 7).length;

    // Calcula o total de ocorrências para obter as porcentagens
    const totalOccurrences = finishOccurrences + progressOccurrences;

    // Verifica se o total de ocorrências não é zero para evitar divisão por zero
    const finishedPercentage = totalOccurrences ? (finishOccurrences / totalOccurrences * 100) : 0;
    const progressPercentage = totalOccurrences ? (progressOccurrences / totalOccurrences * 100) : 0;

    document.querySelector('.finishedPercentage').textContent = finishedPercentage+'%'
    document.querySelector('.progressPercentage').textContent = progressPercentage+'%'

    var options = {
        series: [progressOccurrences, finishOccurrences],
        labels: ["Andamento", "Finalizadas"],
        chart: {
            height: 250,
            type: 'donut',
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        stroke: {
            show: true,
            curve: 'smooth',
            lineCap: 'round',
            colors: "#fff",
            width: 0,
            dashArray: 0,
        },
        plotOptions: {
            pie: {
                expandOnClick: false,
                donut: {
                    size: '70%',
                    background: 'transparent',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '20px',
                            color: '#495057',
                            offsetY: -4
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            color: '#495080',
                            offsetY: 8,
                            formatter: function (val) {
                                return val + "%"
                            }
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Total',
                            fontSize: '22px',
                            fontWeight: 600,
                            color: '#495057',
                            formatter: function (w) {
                                return totalOccurrences.toString();
                            }
                        }
                    }
                }
            }
        },
        colors: ["rgb(132, 90, 223)", "rgba(132, 90, 223, 0.7)", "rgba(132, 90, 223,0.4)", "rgb(243, 246, 248)"],
    };

    document.querySelector("#occurrencesStatusChart").innerHTML = " ";
    var chart = new ApexCharts(document.querySelector("#occurrencesStatusChart"), options);
    chart.render();
}

async function occurrencesTypeChart(data) {
    const AllTypes = await makeRequest(`/api/non-compliance/AllTypes`);

    // Contagem de tipos
    const typeCounts = AllTypes.reduce((acc, type) => {
        acc[type.name] = data.filter(occurrence => occurrence.typeID === type.id).length;
        return acc;
    }, {});

    // Calcular porcentagens
    const totalOccurrences = data.length;
    const typePercentages = Object.entries(typeCounts).map(([name, count]) => ({
        name,
        percentage: ((count / totalOccurrences) * 100)
    }));

    // Configurações do gráfico
    const options = {
        series: typePercentages.map(type => parseFloat(type.percentage)),
        labels: typePercentages.map(type => type.name),
        chart: {
            height: 250,
            type: 'donut',
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        stroke: {
            show: true,
            curve: 'smooth',
            lineCap: 'round',
            colors: "#fff",
            width: 0,
            dashArray: 0,
        },
        plotOptions: {
            pie: {
                expandOnClick: false,
                donut: {
                    size: '70%',
                    background: 'transparent',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '20px',
                            color: '#495057',
                            offsetY: -4
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            color: undefined,
                            offsetY: 8,
                            formatter: function (val) {
                                return val + "%"
                            }
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Total',
                            fontSize: '22px',
                            fontWeight: 600,
                            color: '#495057',
                        }
                    }
                }
            }
        },
        colors: ["rgb(132, 90, 223)", "rgba(132, 90, 223, 0.7)", "rgba(132, 90, 223,0.4)", "rgb(243, 246, 248)"],
    };

    // Renderizar gráfico
    document.querySelector("#occurrencesTypeChart").innerHTML = "";
    var chart = new ApexCharts(document.querySelector("#occurrencesTypeChart"), options);
    chart.render();

    // Atualizar HTML com tipos e porcentagens
    const footerContainer = document.querySelector(".footerOccurencePerType");
    footerContainer.innerHTML = typePercentages.map(type => `
        <div class="col pe-0 text-center">
            <div class="p-sm-3 p-2">
                <span class="text-muted fs-11">${type.name}</span>
                <span class="d-block fs-16 fw-semibold">${type.percentage}%</span>
            </div>
        </div>
    `).join('');
}

// Chamar a função occurrencesTypeChart com os dados necessários
// occurrencesTypeChart(data);

async function generateActionsMetrics(data){
    console.log(data)
    document.querySelector('.ActionsMetrics').textContent = (data.length).toString().padStart(2, '0');

    let actionsPendents = 0
    for (let index = 0; index < data.length; index++) {
        const element = data[index];

        if(element.statusID != 3){
            actionsPendents++
        }
        
    }

    document.querySelector('.ActionsPendents').textContent = actionsPendents.toString().padStart(2, '0');
}
    

async function listAllActions(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/get-actions-pendents`);
    await generateActionsMetrics(dados)
    let actonsHTML = '';
    for (let index = 0; index < dados.length; index++) {
        const element = dados[index];
        console.log(element)
        actonsHTML += `<li data-type="${element.statusID}" occurrence-id="${element.occurrence_id}" action-id="${element.id}" class="list-group-item border-top-0 border-start-0 border-end-0">
                            <a href="javascript:void(0);">
                                <div class="d-flex align-items-center">
                                    <div class="me-2 lh-1"> 
                                        <span title="${element.name} ${element.family_name}" class="avatar avatar-md avatar-rounded bg-primary-transparent"> 
                                            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> 
                                        </span> 
                                    </div>
                                    <div class="flex-fill">
                                        <p class="mb-0 fw-semibold" style="display: flex;">${element.reference}&#8287;&#8287;${element.status}</p>
                                        <p class="fs-12 text-muted mb-0">${element.action}</p>
                                    </div>
                                    <div class="text-end">
                                        <p class="mb-0 fs-12">Prazo</p>
                                        ${element.deadline}
                                    </div>
                                </div>
                            </a>
                        </li>`
    }


    document.querySelector('.allactions').innerHTML = actonsHTML

    await filterActions()
    await dblClickOnAction()
}


async function filterActions() {
    const dropdownItems = document.querySelectorAll('.filterActions');
    const dropdownToggle = document.querySelector('.dropdown-filterActions');

    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            const types = this.getAttribute('data-type').split(',');
            const selectedText = this.textContent.trim();
            
            const allActions = document.querySelector('.allactions');
            const listItems = allActions.querySelectorAll('li');
            
            listItems.forEach(item => {
                const itemType = item.getAttribute('data-type');
                if (types.includes(itemType)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            // Atualiza o texto do dropdown para refletir a opção selecionada
            dropdownToggle.innerHTML = `${selectedText} <i class="ri-arrow-down-s-line align-middle ms-1 d-inline-block"></i>`;
        });
    });

    // Filtra e seleciona a opção "Todas" ao iniciar
    const initialFilter = document.querySelector('.filterActions[data-type="0"]');
    if (initialFilter) {
        initialFilter.click();
    }
}

async function Events(){
    await clickNewOccurence()
    
}

async function clickNewOccurence() {
    // Remove o evento 'click' antes de adicionar novamente
    elements.newOccurenceButton.removeEventListener('click', clickNewOccurence);

    // Adiciona o evento 'click' atualizado
    elements.newOccurenceButton.addEventListener('click', async function(e) {
        e.preventDefault();

        const body = {
            url: '/app/administration/non-compliance/new-occurrence'
        };

        window.ipcRenderer.invoke('open-exWindow', body);
    });
}


async function dblClickOnOccurrence(tableId){
    const rowTableOccurence = document.querySelectorAll(`${tableId} tbody tr`);

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        // Define a função de callback do evento
        const handleDoubleClick = async function(e) {
            e.preventDefault();
            const id = this.getAttribute('occurrence-id');
            const body = {
                url: `/app/administration/non-compliance/view-occurrence?id=${id}`
            };

            window.ipcRenderer.invoke('open-exWindow', body);
        };

        // Remove event listener se já existir
        element.removeEventListener('dblclick', handleDoubleClick);
        // Adiciona event listener
        element.addEventListener('dblclick', handleDoubleClick);
    }
}

async function dblClickOnAction(){
    const rowTableOccurence = document.querySelectorAll(`.allactions li`);

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        // Define a função de callback do evento
        const handleDoubleClick = async function(e) {
            e.preventDefault();
            const occurrenceID = this.getAttribute('occurrence-id');
            const actionID = this.getAttribute('action-id');
            
          
            const body = {
                url: `/app/administration/non-compliance/view-occurrence?id=${occurrenceID}&action=${actionID}`
            };

            window.ipcRenderer.invoke('open-exWindow', body);
        };

        // Remove event listener se já existir
        element.removeEventListener('dblclick', handleDoubleClick);
        // Adiciona event listener
        element.addEventListener('dblclick', handleDoubleClick);
    }
}

window.addEventListener("load", async () => {
    // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.time(`A página "${document.title}" carregou em`)

    await listPendingOccurrences();
    await listAllOccurrences();
    await Events()
    await listAllActions()
    


    document.querySelector('#loader2').classList.add('d-none')
    // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.timeEnd(`A página "${document.title}" carregou em`);
})

