async function printAll() {

    const sumOffers = await makeRequest(`/api/organizational-chart/totalProcesses`);

    console.log(sumOffers);

}

function createChart(dataArray, totalArray, goal, div) {
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    const goalArray = [];
    for (let index = 0; index < totalArray.length; index++) {
        goalArray[index] = ((totalArray[index] * goal) / 100).toFixed();
        goalArray[index] = parseInt(goalArray[index]);
    }

    var chartData = {
        series: [
            {
                name: "Cotações Totais",
                type: "column",
                data: totalArray,
            },
            {
                name: "Cotações Aprovadas",
                type: "line",
                data: dataArray,
            },
            {
                name: "Meta",
                type: "line",
                data: goalArray,
            },
        ],
        colors: ["#F9423A", "#348ceb", "#30c229"],

        markers: {
            size: [0, 4],
            strokeColors: ["#30c229", "#348ceb"],
            strokeWidth: 2,
            strokeOpacity: 0.9,
            fillOpacity: 1,
            shape: "circle",
            showNullDataPoints: true,
        },

        chart: {
            height: 200,
            type: "area",
            stacked: false,
            toolbar: {
                show: false,
            },
        },

        stroke: {
            width: [0, 5, 2],
            curve: "smooth",
        },

        plotOptions: {
            bar: {
                borderRadius: 7,
                columnWidth: "40%",
            },
        },

        fill: {
            type: ["solid", "solid", "solid"],
        },

        dataLabels: {
            enabled: true,
            enabledOnSeries: [0],
            offsetY: -15,
            style: {
                fontSize: "12px",
                colors: ["#F9423A"],
            },
        },

        xaxis: {
            categories: months,
            position: "bottom",
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            crosshairs: {
                fill: {
                    type: "gradient",
                    gradient: {
                        colorFrom: "#D8E3F0",
                        colorTo: "#BED1E6",
                        stops: [0, 100],
                        opacityFrom: 0.4,
                        opacityTo: 0.5,
                    },
                },
            },
        },

        yaxis: [
            {
                show: false,
                min: 0,
            },
        ],

        legend: {
            show: true
        },

        tooltip: {
            y: {
                formatter: function (value, { seriesIndex, dataPointIndex }) {
                    if (seriesIndex === 1) {
                        const total = totalArray[dataPointIndex] || 1;
                        const percentage = ((value / total) * 100).toFixed(2);
                        return percentage + "%";
                    } else if (seriesIndex === 2) {
                        const total = totalArray[dataPointIndex] || 1;
                        const percentage = (value / total * 100).toFixed();
                        return percentage + "%";
                    }
                    return value;
                }
            }
        }
    };

    var chart = new ApexCharts(document.querySelector(div), chartData);
    chart.render();
}

document.addEventListener('DOMContentLoaded', async function () {

    // const socket = io();

    // socket.on('updateCalendarEvents', (data) => {
    //   calendar.refetchEvents();
    // })

    await printAll();

});