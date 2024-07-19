
// Conecta-se ao servidor Socket.io
const socket = io();

 // Evento para receber mensagens do servidor
 socket.on('att-non-compliance', async (msg) => {
    document.querySelector('#loader2').classList.remove('d-none')
    await listPendingOccurrences();
    await listAllOccurrences();
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

window.addEventListener("load", async () => {
  
    await listPendingOccurrences();
    await listAllOccurrences();
    await Events()
    await occurrencesStatusChart()
    await occurrencesTypeChart()


    document.querySelector('#loader2').classList.add('d-none')
})

