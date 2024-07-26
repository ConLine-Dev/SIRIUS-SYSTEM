
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

async function listAllOccurrences(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/AllOccurrence`);

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

async function occurrencesStatusChart(){
/* Jobs Summary chart */
var options = {
    series: [5, 24],
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

document.querySelector("#occurrencesStatusChart").innerHTML = " ";
var chart = new ApexCharts(document.querySelector("#occurrencesStatusChart"), options);
chart.render();

/* Jobs Summary chart */
}

async function occurrencesTypeChart(){
    /* Jobs Summary chart */
    var options = {
        series: [4, 32],
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
    
    document.querySelector("#occurrencesTypeChart").innerHTML = " ";
    var chart = new ApexCharts(document.querySelector("#occurrencesTypeChart"), options);
    chart.render();
    
    /* Jobs Summary chart */
}
    

async function listAllActions(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/get-actions-pendents`);

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
  
    await listPendingOccurrences();
    await listAllOccurrences();
    await Events()
    await listAllActions()
    await occurrencesStatusChart()
    await occurrencesTypeChart()
    


    document.querySelector('#loader2').classList.add('d-none')
})

