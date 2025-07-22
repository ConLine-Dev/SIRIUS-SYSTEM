let clientsTable, TEUsChart, profitChart;
const socket = io();

socket.on('att-non-compliance', async (msg) => {
    document.querySelector('#loader2').classList.remove('d-none')
    await listAllOccurrences();
    document.querySelector('#loader2').classList.add('d-none')
});

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function createSelects() {

    const userData = await getInfosLogin();
    const collabId = userData.system_collaborator_id;
    const salesSelect = document.getElementById("salesSelect");
    const getCommercial = await makeRequest(`/api/commercial-individual-goal/getCommercial`, 'POST', { collabId });

    for (let index = 0; index < getCommercial.length; index++) {
        let option = document.createElement("option");
        option.value = getCommercial[index].userId;
        option.textContent = `${getCommercial[index].name} ${getCommercial[index].family_name}`;
        salesSelect.appendChild(option);
    }
}

async function updateTable() {
    const salesSelect = document.getElementById("salesSelect");
    const monthSelect = document.getElementById("monthSelect");
    const quarterSelect = document.getElementById("quarterSelect");

    let sales = salesSelect.value;
    let month = monthSelect.value;
    let quarter = quarterSelect.value;

    const getClients = await makeRequest(`/api/commercial-individual-goal/getClients`, 'POST', { sales, month, quarter });
    document.querySelector('#loader2').classList.remove('d-none')
    await printData(sales, month, quarter);
    await createTable(getClients);
    document.querySelector('#loader2').classList.add('d-none')
}

async function printData(sales, month, quarter) {

    const getTEUsAndProfit = await makeRequest(`/api/commercial-individual-goal/getTEUsAndProfit`, 'POST', { sales, month, quarter });
    let TEUsActual = 0;
    let profitActual = 0;
    if (getTEUsAndProfit[0]) {
        TEUsActual = getTEUsAndProfit[0].Total_TEUS;
        profitActual = getTEUsAndProfit[0].Lucro_Estimado;
    }

    const getGoals = await makeRequest(`/api/commercial-individual-goal/getGoals`, 'POST', { sales, month, quarter });
    let TEUsGoal = getGoals[0];
    let profitGoal = getGoals[1];

    const divTEUsQuantity = document.getElementById('TEUsQuantity');
    let printTEUsQuantity = `<div class="card-body d-flex flex-column p-0 col-6">
                              <h2 class="fw-bold display-5 m-0">${TEUsActual}</h2>
                              <h6 class="text-muted">Obtido</h6>
                          </div>
                          <div class="card-body d-flex flex-column p-0 col-6">
                              <h2 class="fw-bold display-5 m-0">${TEUsGoal}</h2>
                              <h6 class="text-muted">Esperado</h6>
                          </div>`
    divTEUsQuantity.innerHTML = printTEUsQuantity;

    await createTEUsChart(TEUsActual, TEUsGoal);

    const divProfitQuantity = document.getElementById('profitQuantity');
    let printProfitQuantity = `<div class="card-body d-flex flex-column p-0 col-6">
                              <h3 class="fw-bold display-5 m-0">${profitActual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                              <h6 class="text-muted">Obtido</h6>
                          </div>
                          <div class="card-body d-flex flex-column p-0 col-6">
                              <h3 class="fw-bold display-5 m-0">${profitGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                              <h6 class="text-muted">Esperado</h6>
                          </div>`
    divProfitQuantity.innerHTML = printProfitQuantity;

    await createProfitsChart(profitActual, profitGoal);
}

async function createTable(getVolumes) {

    const listTable = [];

    for (let index = 0; index < getVolumes.length; index++) {
        const item = getVolumes[index];

        listTable.push({
            client: item.Nome,
            openingProfit: item.Lucro_Abertura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            estimatedProfit: item.Lucro_Estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            teus: item.Total_TEUS
        });
    }

    if ($.fn.DataTable.isDataTable("#clientsTable")) {
        $('#clientsTable').DataTable().clear().destroy(); // Limpa e destrói a DataTable
    }

    $('#clientsTable tbody').empty(); // Remove apenas as linhas, mantendo os cabeçalhos

    // Recria a DataTable
    clientsTable = $('#clientsTable').DataTable({
        "dom": 'frtip',
        "data": listTable,
        "columns": [
            { "data": "client" },
            { "data": "openingProfit" },
            { "data": "estimatedProfit" },
            { "data": "teus" },
        ],
        "language": {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
        },
        "order": [[0, 'desc']],
        "lengthMenu": [[6], [6]],
        "searching": true,
    });

    $('#searchBox2').off('keyup').on('keyup', function () {
        clientsTable.search(this.value).draw();
    });
}

async function createTEUsChart(TEUsActual, TEUsGoal) {

    let color = '#0d8ade'
    let percent = (TEUsActual / TEUsGoal) * 100

    if (percent >= 100) {
        color = '#7fcf11'
    }

    if (TEUsChart) {
        TEUsChart.destroy();
    }

    var options = {
        series: [percent.toFixed(2)],
        chart: {
            type: 'radialBar',
            offsetY: -20,
            sparkline: {
                enabled: true
            }
        },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                track: {
                    background: "#e7e7e7",
                    strokeWidth: '97%',
                    margin: 5, // margin is in pixels
                    dropShadow: {
                        enabled: true,
                        top: 2,
                        left: 0,
                        color: '#444',
                        opacity: 1,
                        blur: 2
                    }
                },
                dataLabels: {
                    name: {
                        show: false
                    },
                    value: {
                        offsetY: -2,
                        fontSize: '22px'
                    }
                }
            }
        },
        grid: {
            padding: {
                top: -10
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                shadeIntensity: 0.4,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 50, 53, 91]
            },
            colors: [`${color}`]
        },
    };

    TEUsChart = new ApexCharts(document.querySelector("#TEUsChart"), options);
    TEUsChart.render();
}

async function createProfitsChart(profitActual, profitGoal) {

    let color = '#0d8ade'
    let percent = (profitActual / profitGoal) * 100

    if (percent >= 100) {
        color = '#7fcf11'
    }

    if (profitChart) {
        profitChart.destroy();
    }

    var options = {
        series: [percent.toFixed(2)],
        chart: {
            type: 'radialBar',
            offsetY: -20,
            sparkline: {
                enabled: true
            }
        },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                track: {
                    background: "#e7e7e7",
                    strokeWidth: '97%',
                    margin: 5, // margin is in pixels
                    dropShadow: {
                        enabled: true,
                        top: 2,
                        left: 0,
                        color: '#444',
                        opacity: 1,
                        blur: 2
                    }
                },
                dataLabels: {
                    name: {
                        show: false
                    },
                    value: {
                        offsetY: -2,
                        fontSize: '22px'
                    }
                }
            }
        },
        grid: {
            padding: {
                top: -10
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                shadeIntensity: 0.4,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 50, 53, 91]
            },
            colors: [`${color}`]
        },
    };

    profitChart = new ApexCharts(document.querySelector("#profitChart"), options);
    profitChart.render();
}

async function newGoal() {
    const body = {
        url: `/app/dashboards/commercial-individual-goals-adm/create`,
        width: 800,
        height: 300,
        resizable: false,
        max: false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
}

window.addEventListener("load", async () => {

    const socket = io();

    socket.on('updateRefunds', (data) => {
        // createTable()
    })

    const userData = await getInfosLogin();
    const userId = userData.system_id_headcargo;
    const getClients = await makeRequest(`/api/commercial-individual-goal/getClients`, 'POST', { sales: userId, month: null, quarter: null });
    await createTable(getClients);
    await printData(userId, null, null);
    await createSelects();

    document.querySelector('#loader2').classList.add('d-none')
})