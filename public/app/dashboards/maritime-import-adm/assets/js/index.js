let mailChart, cancelChart, repurchaseChart;

async function printProcesses(headcargo) {

  let processes = await makeRequest(`/api/maritime-import-adm/totalProcesses`, 'POST', { userId: headcargo });

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

async function createFilters() {
  const dropdown = document.getElementById('dropdown');

  let operationalList = await makeRequest(`/api/maritime-import-adm/getOperationals`);

  operationalList.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    
    a.className = 'dropdown-item';
    a.href = 'javascript:void(0);';
    a.textContent = `${item.name} ${item.family_name}`;
    
    // Define a função onclick com os parâmetros corretos
    a.onclick = () => createArrays(item);
    
    li.appendChild(a);
    dropdown.appendChild(li);
});
}

async function createArrays(item) {
  document.querySelector('#loader2').classList.remove('d-none')
  await createMailArrays(item.email_business);
  await createCancelArrays(item.id_headcargo);
  await createRepurchaseArrays(item.id_headcargo);
  await printProcesses(item.id_headcargo);
  document.querySelector('#loader2').classList.add('d-none')
}

async function createCancelArrays(headcargo) {

  let openedArray = [];
  let canceledArray = [];

  let openedProcesses = await makeRequest(`/api/maritime-import-adm/openedProcesses`, 'POST', { userId: headcargo })
  let canceledProcesses = await makeRequest(`/api/maritime-import-adm/canceledProcesses`, 'POST', { userId: headcargo })

  for (let index = 0; index < openedProcesses.length; index++) {
    for (let index2 = 0; index2 < 12; index2++) {
      if (openedProcesses[index].mes - 1 == index2) {
        openedArray[index2] = openedProcesses[index].TotalProcessosAbertos;
      } else if (openedArray[index2] == null) {
        openedArray[index2] = 0;
      }
    }
  }

  for (let index = 0; index < canceledProcesses.length; index++) {
    for (let index2 = 0; index2 < 12; index2++) {
      if (canceledProcesses[index].mes - 1 == index2) {
        canceledArray[index2] = canceledProcesses[index].TotalProcessosCancelados;
      } else if (canceledArray[index2] == null) {
        canceledArray[index2] = 0;
      }
    }
  }

  createCancelChart(openedArray, canceledArray);
}

async function createMailArrays(email) {

  let sentMailArray = [];
  let receivedMailArray = [];

  let emailsList = await makeRequest(`/api/maritime-import-adm/totalEmails`, 'POST', {email});

  emailsList.forEach(item => {
    const mesIndex = item.mes - 1;

    if (!sentMailArray[mesIndex]) sentMailArray[mesIndex] = 0;
    if (!receivedMailArray[mesIndex]) receivedMailArray[mesIndex] = 0;

    sentMailArray[mesIndex] += item.enviados;
    receivedMailArray[mesIndex] += item.recebidos;
  });

  createMailChart(sentMailArray, receivedMailArray);
}

async function createRepurchaseArrays(userId) {

  let repurchaseArray = [];

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
  createRepurchaseChart(repurchaseArray);
}

function createMailChart(sentMailArray, receivedMailArray) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (mailChart) {
    mailChart.destroy();
  }

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

  mailChart = new ApexCharts(document.querySelector('#mails-chart'), chartData);
  mailChart.render();
}

function createCancelChart(openedArray, canceledArray) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (cancelChart) {
    cancelChart.destroy();
  }

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

  cancelChart = new ApexCharts(document.querySelector('#cancels-chart'), chartData);
  cancelChart.render();
}

function createRepurchaseChart(repurchaseArray) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (repurchaseChart) {
    repurchaseChart.destroy();
  }

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



  repurchaseChart = new ApexCharts(document.querySelector('#repurchase-chart'), chartData);
  repurchaseChart.render();
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  await printProcesses(0);
  await createFilters();
  await createMailArrays('');
  await createCancelArrays(0);
  await createRepurchaseArrays(0);

  document.querySelector('#loader2').classList.add('d-none')
});