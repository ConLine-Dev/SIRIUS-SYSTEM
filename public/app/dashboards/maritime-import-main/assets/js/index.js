let openedArray = [];
let canceledArray = [];
let sentMailArray = [];
let receivedMailArray = [];
let repurchaseArray = [];
let FprocessesArray = [];
let FprocessesLabels = [];
let LprocessesArray = [];
let LprocessesLabels = [];

async function printProcesses() {

  let loggedData = await getInfosLogin();
  let userId = loggedData.system_id_headcargo;
  let processes = await makeRequest(`/api/maritime-import-main/totalProcesses`, 'POST', { userId });

  let divNoETD = document.getElementById('noETD');
  let countNoETD = 0;
  let fullNoETD = 0;
  let lessNoETD = 0

  let divNoETA = document.getElementById('noETA');
  let countNoETA = 0;
  let fullNoETA = 0;
  let lessNoETA = 0;

  let divWithETA = document.getElementById('withETA');
  let countWithETA = 0;
  let fullWithETA = 0;
  let lessWithETA = 0;

  let divTotal = document.getElementById('total');
  let countTotal = processes.length;

  for (let index = 0; index < processes.length; index++) {
    if (processes[index].Data_Desembarque) {
      if (processes[index].Tipo_Carga == 'FCL') {
        fullWithETA++;
      } else if (processes[index].Tipo_Carga == 'LCL') {
        lessWithETA++;
      }
      countWithETA++;
    } else if (processes[index].Data_Embarque) {
      if (processes[index].Tipo_Carga == 'FCL') {
        fullNoETA++;
      } else if (processes[index].Tipo_Carga == 'LCL') {
        lessNoETA++;
      }
      countNoETA++;
    } else {
      if (processes[index].Tipo_Carga == 'FCL') {
        fullNoETD++;
      } else if (processes[index].Tipo_Carga == 'LCL') {
        lessNoETD++;
      }
      countNoETD++;
    }
  }

  let fullTotal = fullNoETD + fullNoETA + fullWithETA;
  let lessTotal = lessNoETD + lessNoETA + lessWithETA;

  let printNoETD = `<div><h2>${countNoETD}</h2>
  <h6>FCL: ${fullNoETD} / LCL: ${lessNoETD}</h6></div>`
  let printNoETA = `<div><h2>${countNoETA}</h2>
  <h6>FCL: ${fullNoETA} / LCL: ${lessNoETA}</h6></div>`
  let printWithETA = `<div><h2>${countWithETA}</h2>
  <h6>FCL: ${fullWithETA} / LCL: ${lessWithETA}</h6></div>`
  let printTotal = `<div><h2>${countTotal}</h2>
  <h6>FCL: ${fullTotal} / LCL: ${lessTotal}</h6></div>`

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

async function createRepurchaseArrays() {
  let loggedData = await getInfosLogin();
  let userId = loggedData.system_id_headcargo
  let repurchases = await makeRequest(`/api/maritime-import-main/repurchases`, 'POST', { userId });

  for (let index = 0; index < repurchases.length; index++) {
    for (let index2 = 0; index2 < 12; index2++) {
      if (repurchases[index].month - 1 == index2) {
        if (repurchaseArray[index2] == null) {
          repurchaseArray[index2] = 0;
        }
        repurchaseArray[index2] += parseFloat(repurchases[index].value);
      } else if (repurchaseArray[index2] == null) {
        repurchaseArray[index2] = 0;
      }
    }
  }
}

async function createProcessesArray() {

  let loggedData = await getInfosLogin();
  let userId = loggedData.system_id_headcargo
  let processes = await makeRequest(`/api/maritime-import-main/filteredProcesses`, 'POST', {userId})

  for (let index = 0; index < processes.length; index++) {
    if (processes[index].Tipo_Carga == 'FCL' && FprocessesArray.length < 4) {
      FprocessesArray[index] = processes[index].Quantidade_Processos;
      FprocessesLabels[index] = processes[index].Cia_Transporte;
      FprocessesArray = FprocessesArray.filter(item => item !== undefined && item !== null);
      FprocessesLabels = FprocessesLabels.filter(item => item !== undefined && item !== null);
    }
    if (processes[index].Tipo_Carga == 'LCL' && LprocessesArray.length < 4) {
      LprocessesArray[index] = processes[index].Quantidade_Processos;
      LprocessesLabels[index] = processes[index].Cia_Transporte;
      LprocessesArray = LprocessesArray.filter(item => item !== undefined && item !== null);
      LprocessesLabels = LprocessesLabels.filter(item => item !== undefined && item !== null);
    }
  }

  for (let index = 0; index < FprocessesArray.length; index++) {
    FprocessesLabels[index] = FprocessesLabels[index].trim().split(' ');
    FprocessesLabels[index] = FprocessesLabels[index].slice(0, 2).join(' ');
  }

  for (let index = 0; index < LprocessesArray.length; index++) {
    LprocessesLabels[index] = LprocessesLabels[index].trim().split(' ');
    LprocessesLabels[index] = LprocessesLabels[index].slice(0, 2).join(' ');
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
      stacked: false,
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
      name: 'Recompras',
      data: repurchaseArray
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

function createProcessesChart() {

  var chartDataFCL = {
    series: FprocessesArray,
    chart: {
      width: 350,
      type: 'pie',
    },
    plotOptions: {
      pie: {
        expandOnClick: false
      }
    },
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    labels: FprocessesLabels,
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'bottom'
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        return '<div style="padding: 5px; background-color: rgba(24, 24, 24, 0.8); color: #ffffff; border-radius: 5px; font-weight: lighter;">'
          + w.globals.labels[seriesIndex] + ': ' + series[seriesIndex]
          + '</div>';
      }
    }
  };

  var chartDataLCL = {
    series: LprocessesArray,
    chart: {
      width: 350,
      type: 'pie',
    },
    plotOptions: {
      pie: {
        expandOnClick: false
      }
    },
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    labels: LprocessesLabels,
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'bottom'
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        return '<div style="padding: 5px; background-color: rgba(24, 24, 24, 0.8); color: #ffffff; border-radius: 5px; font-weight: lighter;">'
          + w.globals.labels[seriesIndex] + ': ' + series[seriesIndex]
          + '</div>';
      }
    }
  };

  processesChartFCL = new ApexCharts(document.querySelector("#processes-chart"), chartDataFCL);
  processesChartFCL.render();

  processesChartLCL = new ApexCharts(document.querySelector("#processes-chart2"), chartDataLCL);
  processesChartLCL.render();

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
  await createRepurchaseArrays();
  createRepurchaseChart();
  await createProcessesArray();
  createProcessesChart();

  document.querySelector('#loader2').classList.add('d-none')
});