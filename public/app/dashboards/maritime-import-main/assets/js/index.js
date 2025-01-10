let openedArray = [];
let canceledArray = [];
let sentMailArray = [];
let receivedMailArray = [];

async function printProcesses() {

  let loggedData = await getInfosLogin();
  let userId = loggedData.system_id_headcargo;
  let processes = await makeRequest(`/api/maritime-import-main/totalProcesses`, 'POST', { userId });

  let divNoETD = document.getElementById('noETD');
  let countNoETD = 0;

  let divNoETA = document.getElementById('noETA');
  let countNoETA = 0;

  let divWithETA = document.getElementById('withETA');
  let countWithETA = 0;

  let divTotal = document.getElementById('total');
  let countTotal = processes.length;

  for (let index = 0; index < processes.length; index++) {
    if (processes[index].Data_Desembarque) {
      countWithETA++;
    } else if (processes[index].Data_Embarque) {
      countNoETA++;
    } else {
      countNoETD++;
    }
  }

  let printNoETD = `<h2>${countNoETD}</h2>`
  let printNoETA = `<h2>${countNoETA}</h2>`
  let printWithETA = `<h2>${countWithETA}</h2>`
  let printTotal = `<h2>${countTotal}</h2>`

  divNoETD.innerHTML = printNoETD;
  divNoETA.innerHTML = printNoETA;
  divWithETA.innerHTML = printWithETA;
  divTotal.innerHTML = printTotal;

}

async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

async function createCancelArrays() {

  let loggedData = await getInfosLogin();

  let userId = loggedData.system_id_headcargo;

  let openedProcesses = await makeRequest(`/api/maritime-import-main/openedProcesses`, 'POST', { userId })
  let canceledProcesses = await makeRequest(`/api/maritime-import-main/canceledProcesses`, 'POST', { userId })

  for (let index = 0; index < openedProcesses.length; index++) {
    if (openedProcesses[index].mes - 1 == index) {
      openedArray[index] = openedProcesses[index].TotalProcessosAbertos
    }
  }

  for (let index = 0; index < canceledProcesses.length; index++) {
    for (let index2 = 0; index2 < 12; index2++) {
      if (canceledProcesses[index].mes - 1 == index2) {
        canceledArray[index2] = canceledProcesses[index].TotalProcessosCancelados
      } else if (canceledArray[index2] == null) {
        canceledArray[index2] = 0;
      }
    }
  }
}

async function createMailArrays() {
  let loggedData = await getInfosLogin();

  let email = loggedData.email

  let emailsList = await makeRequest(`/api/maritime-import-main/totalEmails`, 'POST', { email });

  for (let index = 0; index < emailsList.length; index++) {
    if (emailsList[index].mes - 1 == index) {
      sentMailArray[index] = emailsList[index].enviados;
      receivedMailArray[index] = emailsList[index].recebidos;
    }
  }

}

function createMailChart() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'Enviados',
      data: sentMailArray
    }, {
      name: 'Recebidos',
      data: receivedMailArray
    }],
    chart: {
      height: 600,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 2,
        columnWidth: "40%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      offsetX: -15,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    tooltip: {
      enabled: false
    },
    colors: ["#F9423A", "#3f2021"],
    markers: {
      size: [0, 0],
      strokeColors: ["#F9423A", "#3f2021"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
    },
    stroke: {
      width: [0, 0],
      curve: "smooth",
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
    },
  };

  var chart = new ApexCharts(document.querySelector('#mails-chart'), chartData);
  chart.render();
}

function createCancelChart() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      data: openedArray
    }, {
      data: canceledArray
    }],
    chart: {
      height: 600,
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 0,
        columnWidth: "40%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [0],
      offsetX: -15,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      },
    },
    tooltip: {
      enabled: true,
      shared: false,  // Mostra o tooltip para ambas as séries ao passar o mouse
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const seriesAValue = series[0][dataPointIndex];
        const seriesBValue = series[1][dataPointIndex];
        const percentage = ((seriesBValue / seriesAValue) * 100).toFixed(2);

        return `
          <div style="padding: 10px; font-size: 12px; border-radius: 5px; background: rgba(0, 0, 0, 0.7); color: #fff;">
            <strong>${w.globals.labels[dataPointIndex]}</strong><br>
            Processos abertos: ${seriesAValue}<br>
            Processos cancelados: ${seriesBValue}<br>
            Porcentagem de Cancelamento: ${percentage}%
          </div>
        `;
      }
    },
    colors: ["#F9423A", "#3f2021"],
    markers: {
      size: [0, 0],
      strokeColors: ["#F9423A", "#3f2021"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
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
    },
    legend: {
      show: false
    }

  };

  var chart = new ApexCharts(document.querySelector('#cancels-chart'), chartData);
  chart.render();
}

function createRepurchaseChart() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {
    series: [{
      name: 'Inflation',
      data: ['15.541.22', '16.412.12', '10.341.20', '16.412.12', '14.232.43', '21.333.00', '14.232.65']
    }],
    chart: {
      height: 600,
      type: 'bar',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 3,
        dataLabels: {
          position: 'center',
        },
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return "R$ " + val;
      },
      style: {
        fontSize: '12px',
        colors: ['#fff'],
        fontWeight: 'bold',
      },
      offsetY: 0,
      offsetX: 0,
      textAnchor: 'middle'
    },
    tooltip: {
      enabled: false,
    },
    xaxis: {
      categories: months,
      position: 'bottom',
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
    },
    yaxis: {
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false,
      },
    },
    colors: ["#F9423A"],
  };



  var chart = new ApexCharts(document.querySelector('#repurchase-chart'), chartData);
  chart.render();
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  await printProcesses();
  await createMailArrays();
  createMailChart();
  await createCancelArrays();
  createCancelChart();
  createRepurchaseChart();

});