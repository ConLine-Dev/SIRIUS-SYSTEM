async function printAll() {

  const sumOffers = await makeRequest(`/api/pricing-main/getoffers`);
  const approvedFCL = []
  const rejectedFCL = []
  const pendingFCL = []
  const totalFCL = []
  const approvedLCL = []
  const rejectedLCL = []
  const pendingLCL = []
  const totalLCL = []
  const approvedAIR = []
  const rejectedAIR = []
  const pendingAIR = []
  const totalAIR = []

  for (let index = 0; index < sumOffers.length; index++) {
    if (sumOffers[index].tipo == 'FCL') {
      approvedFCL[(sumOffers[index].mes) - 1] = sumOffers[index].aprovadas
      rejectedFCL[(sumOffers[index].mes) - 1] = sumOffers[index].reprovadas
      pendingFCL[(sumOffers[index].mes) - 1] = sumOffers[index].pendentes
      totalFCL[(sumOffers[index].mes) - 1] = approvedFCL[(sumOffers[index].mes) - 1] + rejectedFCL[(sumOffers[index].mes) - 1] + pendingFCL[(sumOffers[index].mes) - 1]
    }
    if (sumOffers[index].tipo == 'LCL') {
      approvedLCL[(sumOffers[index].mes) - 1] = sumOffers[index].aprovadas
      rejectedLCL[(sumOffers[index].mes) - 1] = sumOffers[index].reprovadas
      pendingLCL[(sumOffers[index].mes) - 1] = sumOffers[index].pendentes
      totalLCL[(sumOffers[index].mes) - 1] = approvedLCL[(sumOffers[index].mes) - 1] + rejectedLCL[(sumOffers[index].mes) - 1] + pendingLCL[(sumOffers[index].mes) - 1]
    }
    if (sumOffers[index].tipo == 'AIR') {
      approvedAIR[(sumOffers[index].mes) - 1] = sumOffers[index].aprovadas
      rejectedAIR[(sumOffers[index].mes) - 1] = sumOffers[index].reprovadas
      pendingAIR[(sumOffers[index].mes) - 1] = sumOffers[index].pendentes
      totalAIR[(sumOffers[index].mes) - 1] = approvedAIR[(sumOffers[index].mes) - 1] + rejectedAIR[(sumOffers[index].mes) - 1] + pendingAIR[(sumOffers[index].mes) - 1]
    }
  }

  let yearFCL = sumArray(totalFCL);
  let yearApprovedFCL = sumArray(approvedFCL);
  let yearRejectedFCL = sumArray(rejectedFCL);
  let yearPendingFCL = sumArray(pendingFCL);
  let percentApprovedFCL = ((yearApprovedFCL / yearFCL) * 100);
  let yearLCL = sumArray(totalLCL);
  let yearApprovedLCL = sumArray(approvedLCL);
  let yearRejectedLCL = sumArray(rejectedLCL);
  let yearPendingLCL = sumArray(pendingLCL);
  let percentApprovedLCL = ((yearApprovedLCL / yearLCL) * 100);
  let yearAIR = sumArray(totalAIR);
  let yearApprovedAIR = sumArray(approvedAIR);
  let yearRejectedAIR = sumArray(rejectedAIR);
  let yearPendingAIR = sumArray(pendingAIR);
  let percentApprovedAIR = ((yearApprovedAIR / yearAIR) * 100);

  var totalYearFCL = document.getElementById('totalYear-fcl');
  var totalYearLCL = document.getElementById('totalYear-lcl');
  var totalYearAIR = document.getElementById('totalYear-air');

  let printTotalYearFCL = '';
  let printTotalYearLCL = '';
  let printTotalYearAIR = '';

  printTotalYearFCL = `<div class="text-muted mb-2 fs-12"> 
                            <span class="text-dark fw-semibold fs-16 lh-1 vertical-bottom mb-2"> Cotações/Ano - FCL </span> 
                        </div>
                        <div>Aprovadas: ${yearApprovedFCL}</div>
                        <div>Pendentes: ${yearRejectedFCL}</div>
                        <div>Reprovadas: ${yearPendingFCL}</div>
                        <div>Total: ${yearFCL}</div>
                        <br>
                        <div class="text-muted mb-2 fs-12"> 
                            <span class="text-dark fw-semibold fs-16 lh-1 vertical-bottom mb-2"> Assertividade/Ano - FCL </span> 
                        </div>
                        <div>Percentual Aprovação: ${percentApprovedFCL.toFixed(2)}%</div>`

  printTotalYearLCL = `<div class="text-muted mb-2 fs-12"> 
                            <span class="text-dark fw-semibold fs-16 lh-1 vertical-bottom mb-2"> Cotações/Ano - LCL </span> 
                        </div>
                        <div>Aprovadas: ${yearApprovedLCL}</div>
                        <div>Pendentes: ${yearRejectedLCL}</div>
                        <div>Reprovadas: ${yearPendingLCL}</div>
                        <div>Total: ${yearLCL}</div>
                        <br>
                        <div class="text-muted mb-2 fs-12"> 
                            <span class="text-dark fw-semibold fs-16 lh-1 vertical-bottom mb-2"> Assertividade/Ano - LCL </span> 
                        </div>
                        <div>Percentual Aprovação: ${percentApprovedLCL.toFixed(2)}%</div>`

  printTotalYearAIR = `<div class="text-muted mb-2 fs-12"> 
                            <span class="text-dark fw-semibold fs-16 lh-1 vertical-bottom mb-2"> Cotações/Ano - AIR </span> 
                        </div>
                        <div>Aprovadas: ${yearApprovedAIR}</div>
                        <div>Pendentes: ${yearRejectedAIR}</div>
                        <div>Reprovadas: ${yearPendingAIR}</div>
                        <div>Total: ${yearAIR}</div>
                        <br>
                        <div class="text-muted mb-2 fs-12"> 
                            <span class="text-dark fw-semibold fs-16 lh-1 vertical-bottom mb-2"> Assertividade/Ano - AIR </span> 
                        </div>
                        <div>Percentual Aprovação: ${percentApprovedAIR.toFixed(2)}%</div>`

  totalYearFCL.innerHTML = printTotalYearFCL;
  totalYearLCL.innerHTML = printTotalYearLCL;
  totalYearAIR.innerHTML = printTotalYearAIR;

  createChart(approvedFCL, totalFCL, 30, "#fcl-chart");
  createChart(approvedLCL, totalLCL, 30, "#lcl-chart");
  createChart(approvedAIR, totalAIR, 20, "#air-chart");
}

function sumArray(array) {
  let total = 0;
  for (let index = 0; index < array.length; index++) {
    total += array[index];
  }
  return total;
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