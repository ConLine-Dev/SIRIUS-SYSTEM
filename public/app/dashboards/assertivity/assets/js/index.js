let iaCourierChart, iaNormalChart, imLCLChart, imFCLChart;
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

async function printData() {

    const getOffers = await makeRequest(`/api/assertivity/getOffers`);

    let date = new Date();
    date = date.getMonth();

    let iaCourierTotal = [];
    let iaCourierApproved = [];
    let iaNormalTotal = [];
    let iaNormalApproved = [];
    let imLCLTotal = [];
    let imLCLApproved = [];
    let imFCLTotal = [];
    let imFCLApproved = [];

    for (let index = 0; index < date + 1; index++) {
        iaCourierTotal[index] = 0;
        iaCourierApproved[index] = 0;
        iaNormalTotal[index] = 0;
        iaNormalApproved[index] = 0;
        imLCLTotal[index] = 0;
        imLCLApproved[index] = 0;
        imFCLTotal[index] = 0;
        imFCLApproved[index] = 0;

    }

    for (let index = 0; index < getOffers.length; index++) {
        if (getOffers[index].Modal == 'IA - Courier') {
            if (getOffers[index].Situacao == 'Aprovada') {
                iaCourierApproved[getOffers[index].Mes - 1] = getOffers[index].Total
            }
            if (getOffers[index].Situacao == 'Outro') {
                iaCourierTotal[getOffers[index].Mes - 1] = getOffers[index].Total
            }
        }
        if (getOffers[index].Modal == 'IA - Normal') {
            if (getOffers[index].Situacao == 'Aprovada') {
                iaNormalApproved[getOffers[index].Mes - 1] = getOffers[index].Total
            }
            if (getOffers[index].Situacao == 'Outro') {
                iaNormalTotal[getOffers[index].Mes - 1] = getOffers[index].Total
            }
        }
        if (getOffers[index].Modal == 'IM - LCL') {
            if (getOffers[index].Situacao == 'Aprovada') {
                imLCLApproved[getOffers[index].Mes - 1] = getOffers[index].Total
            }
            if (getOffers[index].Situacao == 'Outro') {
                imLCLTotal[getOffers[index].Mes - 1] = getOffers[index].Total
            }
        }
        if (getOffers[index].Modal == 'IM - FCL') {
            if (getOffers[index].Situacao == 'Aprovada') {
                imFCLApproved[getOffers[index].Mes - 1] = getOffers[index].Total
            }
            if (getOffers[index].Situacao == 'Outro') {
                imFCLTotal[getOffers[index].Mes - 1] = getOffers[index].Total
            }
        }
    }

    createIaCourierChart(iaCourierTotal, iaCourierApproved)
    createIaNormalChart(iaNormalTotal, iaNormalApproved)
    createImLCLChart(imLCLTotal, imLCLApproved)
    createImFCLChart(imFCLTotal, imFCLApproved)
}

async function createIaCourierChart(iaCourierTotal, iaCourierApproved) {

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const goal = 30;

    let result = [];
    for (let index = 0; index < iaCourierTotal.length; index++) {
        result[index] = ((iaCourierApproved[index] / (iaCourierTotal[index] + iaCourierApproved[index])) * 100).toFixed(2);
    }

    const seriesData = iaCourierTotal.map((v, i) => {

        let goalStyle = {
            name: 'Meta',
            value: goal,
            strokeHeight: 2,
            strokeColor: '#acee50ff'
        };

        if (result[i] >= goal) {
            goalStyle = {
                ...goalStyle,
                strokeHeight: 12,
                strokeWidth: 0,
                strokeLineCap: 'round'
            };
        }

        return {
            x: months[i],
            y: result[i],
            goals: [goalStyle]
        };
    });

    var options = {
        series: [
            {
                name: 'Total',
                data: seriesData
            }
        ],
        chart: {
            height: 350,
            type: 'bar'
        },
        legend: {
            show: false,
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val + "%";
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + "%";
                }
            }
        }
    };

    iaCourierChart = new ApexCharts(document.querySelector("#iaCourierChart"), options);
    iaCourierChart.render();

}

async function createIaNormalChart(iaNormalTotal, iaNormalApproved) {

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const goal = 30;

    let result = [];
    for (let index = 0; index < iaNormalTotal.length; index++) {
        result[index] = ((iaNormalApproved[index] / (iaNormalTotal[index] + iaNormalApproved[index])) * 100).toFixed(2);
    }

    const seriesData = iaNormalTotal.map((v, i) => {

        let goalStyle = {
            name: 'Meta',
            value: goal,
            strokeHeight: 2,
            strokeColor: '#acee50ff'
        };

        if (result[i] >= goal) {
            goalStyle = {
                ...goalStyle,
                strokeHeight: 12,
                strokeWidth: 0,
                strokeLineCap: 'round'
            };
        }

        return {
            x: months[i],
            y: result[i],
            goals: [goalStyle]
        };
    });

    var options = {
        series: [
            {
                name: 'Total',
                data: seriesData
            }
        ],
        chart: {
            height: 350,
            type: 'bar'
        },
        legend: {
            show: false,
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val + "%";
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + "%";
                }
            }
        }
    };

    iaNormalChart = new ApexCharts(document.querySelector("#iaNormalChart"), options);
    iaNormalChart.render();

}

async function createImLCLChart(imLCLTotal, imLCLApproved) {

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const goal = 30;

    let result = [];
    for (let index = 0; index < imLCLTotal.length; index++) {
        result[index] = ((imLCLApproved[index] / (imLCLTotal[index] + imLCLApproved[index])) * 100).toFixed(2);
    }

    const seriesData = imLCLTotal.map((v, i) => {

        let goalStyle = {
            name: 'Meta',
            value: goal,
            strokeHeight: 2,
            strokeColor: '#acee50ff'
        };

        if (result[i] >= goal) {
            goalStyle = {
                ...goalStyle,
                strokeHeight: 12,
                strokeWidth: 0,
                strokeLineCap: 'round'
            };
        }

        return {
            x: months[i],
            y: result[i],
            goals: [goalStyle]
        };
    });

    var options = {
        series: [
            {
                name: 'Total',
                data: seriesData
            }
        ],
        chart: {
            height: 350,
            type: 'bar'
        },
        legend: {
            show: false,
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val + "%";
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + "%";
                }
            }
        }
    };

    imLCLChart = new ApexCharts(document.querySelector("#imLCLChart"), options);
    imLCLChart.render();

}

async function createImFCLChart(imFCLTotal, imFCLApproved) {

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const goal = 30;

    let result = [];
    for (let index = 0; index < imFCLTotal.length; index++) {
        result[index] = ((imFCLApproved[index] / (imFCLTotal[index] + imFCLApproved[index])) * 100).toFixed(2);
    }

    const seriesData = imFCLTotal.map((v, i) => {

        let goalStyle = {
            name: 'Meta',
            value: goal,
            strokeHeight: 2,
            strokeColor: '#acee50ff'
        };

        if (result[i] >= goal) {
            goalStyle = {
                ...goalStyle,
                strokeHeight: 12,
                strokeWidth: 0,
                strokeLineCap: 'round'
            };
        }

        return {
            x: months[i],
            y: result[i],
            goals: [goalStyle]
        };
    });

    var options = {
        series: [
            {
                name: 'Total',
                data: seriesData
            }
        ],
        chart: {
            height: 350,
            type: 'bar'
        },
        legend: {
            show: false,
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val + "%";
            }
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + "%";
                }
            }
        }
    };

    imFCLChart = new ApexCharts(document.querySelector("#imFCLChart"), options);
    imFCLChart.render();

}

window.addEventListener("load", async () => {

    const socket = io();

    socket.on('updateRefunds', (data) => {

    })

    await printData();

    document.querySelector('#loader2').classList.add('d-none')
})