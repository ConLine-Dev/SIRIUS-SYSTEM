let clientsTable, TEUsChart, LCLChart, AirChart, profitChart;
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

async function printData(sales, month, quarter) {

    const getTEUsAndProfit = await makeRequest(`/api/commercial-individual-goal/getTEUsAndProfit`, 'POST', { sales, month, quarter });

    let TEUsActual = 0;
    let LCLActual = 0;
    let AirActual = 0;
    let profitActual = 0;
    if (getTEUsAndProfit[0]) {
        TEUsActual = getTEUsAndProfit[0].Total_TEUS;
        profitActual = getTEUsAndProfit[0].Lucro_Estimado;
    }

    for (let index = 0; index < getTEUsAndProfit.length; index++) {
        if (getTEUsAndProfit[index].Tipo_Carga == 'LCL') {
            LCLActual = getTEUsAndProfit[index].Quantidade_Processos;
        }
        if (getTEUsAndProfit[index].Tipo_Carga == 'Aéreo') {
            AirActual = getTEUsAndProfit[index].Quantidade_Processos;
        }
    }

    const getGoals = await makeRequest(`/api/commercial-individual-goal/getGoals`, 'POST', { sales, month, quarter });
    let TEUsGoal = getGoals[0];
    let profitGoal = getGoals[1];
    let LCLGoal = getGoals[2];
    let airGoal = getGoals[3];

    await createTEUsChart(TEUsActual, TEUsGoal);
    await createLCLChart(LCLActual, LCLGoal);
    await createAirChart(AirActual, airGoal);
    await createProfitsChart(profitActual, profitGoal);
}

async function createTable(getVolumes) {

    const listTable = [];

    for (let index = 0; index < getVolumes.length; index++) {
        const item = getVolumes[index];

        if (!item.Lucro_Abertura) {
            item.Lucro_Abertura = 0;
        }
        if (!item.Lucro_Estimado) {
            item.Lucro_Estimado = 0;
        }

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
    percent = parseFloat(percent.toFixed(2));

    if (percent >= 100) {
        color = '#7fcf11'
    }

    if (TEUsChart) {
        TEUsChart.destroy();
    }

    var options = {
        series: [percent],
        chart: {
            type: 'radialBar',
            offsetY: -20,
            sparkline: {
                enabled: true
            }
        },
        tooltip: {
            enabled: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                return `
                <div style="padding: 8px; font-size: 13px;">
                    <strong>Atual:</strong> ${TEUsActual} TEUs <br>
                    <strong>Meta:</strong> ${TEUsGoal} TEUs
                </div>
            `;
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

async function createLCLChart(LCLActual, LCLGoal) {

    let color = '#0d8ade'
    let percent = (LCLActual / LCLGoal) * 100
    percent = parseFloat(percent.toFixed(2));

    if (percent >= 100) {
        color = '#7fcf11'
    }

    if (LCLChart) {
        LCLChart.destroy();
    }

    var options = {
        series: [percent],
        chart: {
            type: 'radialBar',
            offsetY: -20,
            sparkline: {
                enabled: true
            }
        },
        tooltip: {
            enabled: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                return `
                <div style="padding: 8px; font-size: 13px;">
                    <strong>Atual:</strong> ${LCLActual} processos <br>
                    <strong>Meta:</strong> ${LCLGoal} processos
                </div>
            `;
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

    LCLChart = new ApexCharts(document.querySelector("#LCLChart"), options);
    LCLChart.render();
}

async function createAirChart(AirActual, AirGoal) {

    let color = '#0d8ade'
    let percent = (AirActual / AirGoal) * 100
    percent = parseFloat(percent.toFixed(2));

    if (percent >= 100) {
        color = '#7fcf11'
    }

    if (AirChart) {
        AirChart.destroy();
    }

    var options = {
        series: [percent],
        chart: {
            type: 'radialBar',
            offsetY: -20,
            sparkline: {
                enabled: true
            }
        },
        tooltip: {
            enabled: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                return `
                <div style="padding: 8px; font-size: 13px;">
                    <strong>Atual:</strong> ${AirActual} processos <br>
                    <strong>Meta:</strong> ${AirGoal} processos
                </div>
            `;
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

    AirChart = new ApexCharts(document.querySelector("#AirChart"), options);
    AirChart.render();
}

async function createProfitsChart(profitActual, profitGoal) {

    let color = '#0d8ade'
    let percent = (profitActual / profitGoal) * 100
    percent = parseFloat(percent.toFixed(2));

    if (percent >= 100) {
        color = '#7fcf11'
    }

    if (profitChart) {
        profitChart.destroy();
    }

    var options = {
        series: [percent],
        chart: {
            type: 'radialBar',
            offsetY: -20,
            sparkline: {
                enabled: true
            }
        },
        tooltip: {
            enabled: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                return `
                <div style="padding: 8px; font-size: 13px;">
                    <strong>Atual:</strong> R$ ${profitActual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<br>
                    <strong>Meta:</strong> R$ ${profitGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
            `;
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

    document.querySelector('#loader2').classList.add('d-none')
})