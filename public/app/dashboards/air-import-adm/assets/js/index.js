let mailChart, cancelChart, repurchaseChart, processesChartFCL, processesChartLCL;

async function printProcesses(headcargo) {

  let processes = await makeRequest(`/api/air-import-adm/openedProcesses`, 'POST', { userId: headcargo });

  let divNoETD = document.getElementById('noETD');
  let countNoETD = 0;
  let normalNoETD = 0;
  let courierNoETD = 0

  let divNoETA = document.getElementById('noETA');
  let countNoETA = 0;
  let normalNoETA = 0;
  let courierNoETA = 0;

  let divTotal = document.getElementById('total');
  let countTotal = processes.length;

  for (let index = 0; index < processes.length; index++) {
    if (processes[index].Data_Embarque) {
      if (processes[index].IdNivel_Servico_Aereo) {
        courierNoETA++;
      } else {
        normalNoETA++;
      }
      countNoETA++;
    } else {
      if (processes[index].IdNivel_Servico_Aereo) {
        courierNoETD++;
      } else {
        normalNoETD++;
      }
      countNoETD++;
    }
  }

  let courierTotal = courierNoETD + courierNoETA;
  let normalTotal = normalNoETD + normalNoETA;

  let printNoETD = `<div><h2>${countNoETD}</h2>
  <h6>Normal: ${normalNoETD} / Courier: ${courierNoETD}</h6></div>`
  let printNoETA = `<div><h2>${countNoETA}</h2>
  <h6>Normal: ${normalNoETA} / Courier: ${courierNoETA}</h6></div>`
  let printTotal = `<div><h2>${countTotal}</h2>
  <h6>Normal: ${normalTotal} / Courier: ${courierTotal}</h6></div>`

  divNoETD.innerHTML = printNoETD;
  divNoETA.innerHTML = printNoETA;
  divTotal.innerHTML = printTotal;

}

async function createFilters() {
  const dropdown = document.getElementById('dropdown');

  let operationalList = await makeRequest(`/api/air-import-adm/getOperationals`);

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
  // await createMailArrays(item.email_business);
  await createCancelArrays(item.id_headcargo);
  await createRepurchaseArrays(item.id);
  // await createProcessesArray(item.id_headcargo);
  await printProcesses(item.id_headcargo);
  document.querySelector('#loader2').classList.add('d-none')
}

async function createCancelArrays(headcargo) {

  let openedArray = []
  let canceledArray = []

  let canceledProcesses = await makeRequest(`/api/air-import-adm/canceledProcesses`, 'POST', { userId: headcargo })

  for (let index = 0; index < canceledProcesses['openedArray'].length; index++) {
    openedArray[canceledProcesses['openedArray'][index].Mes - 1] = canceledProcesses['openedArray'][index].Processos;
    canceledArray[canceledProcesses['openedArray'][index].Mes - 1] = 0;
  }

  if (canceledProcesses['canceledProcesses']) {
    for (let index = 0; index < canceledProcesses['canceledProcesses'].length; index++) {
      canceledArray[canceledProcesses['canceledProcesses'][index.Mes - 1]] = canceledProcesses['canceledArray'][index].TotalProcessosCancelados;
    }
  }

  createCancelChart(openedArray, canceledArray);
}

async function createMailArrays(email) {

  let sentMailArray = [];
  let receivedMailArray = [];

  let emailsList = await makeRequest(`/api/air-import-adm/totalEmails`, 'POST', { email });

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
  // Busca os dados do backend
  let repurchases = await makeRequest(`/api/air-import-adm/repurchases`, 'POST', { userId });

  // Salva os dados crus para uso no tooltip customizado
  if (!window.ApexCharts) window.ApexCharts = {};
  if (!window.ApexCharts._globals) window.ApexCharts._globals = {};
  window.ApexCharts._globals.rawRepurchases = repurchases;

  // Descobre todos os meses, status e moedas presentes
  const statusList = ['APPROVED', 'PENDING', 'PAID'];
  const statusMap = {
    'APPROVED': 'Aprovado',
    'PENDING': 'Pendente',
    'PAID': 'Finalizado'
  };
  const statusColor = {
    'Aprovado': '#F9423A',
    'Pendente': '#3f2021',
    'Finalizado': '#bdbdbd'
  };
  const moedas = [...new Set(repurchases.map(item => item.moeda))];

  // Para cada status, cria um array de totais por mês e um detalhamento por moeda
  let series = [];
  let colors = [];
  let tooltipDetails = {};
  statusList.forEach(status => {
    let data = Array(12).fill(0);
    let details = Array(12).fill(null).map(() => ({}));
    repurchases.forEach(item => {
      if (item.status === status) {
        const mesIndex = item.mes - 1;
        data[mesIndex] += item.total;
        if (!details[mesIndex][item.moeda]) details[mesIndex][item.moeda] = 0;
        details[mesIndex][item.moeda] += item.total;
      }
    });
    series.push({
      name: statusMap[status],
      data: data,
      stack: statusMap[status]
    });
    colors.push(statusColor[statusMap[status]]);
    tooltipDetails[statusMap[status]] = details;
  });

  // Passa os dados crus para o gráfico via globals
  setTimeout(() => {
    if (window.repurchaseChart && window.repurchaseChart.w && window.ApexCharts._globals.rawRepurchases) {
      window.repurchaseChart.w.globals.rawRepurchases = window.ApexCharts._globals.rawRepurchases;
    }
  }, 500);

  createRepurchaseChart(series, moedas, colors, tooltipDetails);
}

function createRepurchaseChart(series, moedas, colors, tooltipDetails) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (repurchaseChart) {
    repurchaseChart.destroy();
  }

  var chartData = {
    series: series,
    chart: {
      height: 600,
      type: 'bar',
      stacked: true, // barras empilhadas
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
      enabled: false // Remover valores das barras
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        // Mostra detalhamento por moeda para cada status
        const monthName = months[dataPointIndex];
        let tooltipHtml = `<div style='padding:8px 12px;'><div style='font-weight:bold;font-size:14px;margin-bottom:4px;'>${monthName}</div>`;
        w.config.series.forEach((s, idx) => {
          const status = w.globals.seriesNames[idx];
          const value = series[idx][dataPointIndex];
          if (value && value !== 0) {
            tooltipHtml += `<div style='font-weight:bold;margin-bottom:2px;'>${status}</div>`;
            const details = tooltipDetails[status][dataPointIndex];
            Object.keys(details).forEach(moeda => {
              if (details[moeda] && details[moeda] !== 0) {
                tooltipHtml += `<div style='margin-left:10px;'>${moeda}: <b>${details[moeda].toLocaleString('pt-BR', { style: 'currency', currency: moeda, maximumFractionDigits: 2 })}</b></div>`;
              }
            });
            // Se for Aprovado, soma o valor convertido para real e exibe logo após as moedas
            if (status === 'Aprovado' && w.config.rawRepurchases) {
              const aprovadosMes = w.config.rawRepurchases.filter(item => item.status === 'APPROVED' && item.mes === dataPointIndex + 1);
              const totalAprovadoBRL = aprovadosMes.reduce((acc, curr) => acc + (curr.total_recompra_brl || 0), 0);
              if (totalAprovadoBRL > 0) {
                tooltipHtml += `<div style='margin-left:10px;margin-top:2px;font-weight:bold;color:#1a7e3c;'>Total em R$: <b>${totalAprovadoBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })}</b></div>`;
              }
            }
          }
        });
        tooltipHtml += `</div>`;
        return tooltipHtml;
      }
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
      labels: {
        formatter: function (val) {
          return val ? val.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '';
        }
      }
    },
    colors: colors,
    legend: {
      show: true,
      position: 'top',
      labels: {
        colors: '#333',
        useSeriesColors: false
      }
    },
    rawRepurchases: window.ApexCharts._globals.rawRepurchases // <-- Passa os dados crus para o gráfico
  };

  repurchaseChart = new ApexCharts(document.querySelector('#repurchase-chart'), chartData);
  repurchaseChart.render();
}

async function createProcessesArray(userId) {

  let FprocessesArray = [];
  let FprocessesLabels = [];
  let LprocessesArray = [];
  let LprocessesLabels = [];

  let processes = await makeRequest(`/api/air-import-adm/filteredProcesses`, 'POST', { userId })

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

  // createProcessesChart(FprocessesArray, FprocessesLabels, LprocessesArray, LprocessesLabels);
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
    legend: {
      show: true,
      position: 'top',
      labels: {
        colors: '#333',
        useSeriesColors: false
      }
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

  cancelChart = new ApexCharts(document.querySelector('#cancels-chart'), chartData);
  cancelChart.render();
}

function createProcessesChart(FprocessesArray, FprocessesLabels, LprocessesArray, LprocessesLabels) {

  if (processesChartFCL) {
    processesChartFCL.destroy();
  }

  if (processesChartLCL) {
    processesChartLCL.destroy();
  }

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
      position: 'top',
      labels: {
        colors: '#333',
        useSeriesColors: false
      }
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
      position: 'top',
      labels: {
        colors: '#333',
        useSeriesColors: false
      }
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

  await printProcesses(0);
  await createFilters();
  // await createMailArrays('');
  await createCancelArrays(0);
  await createRepurchaseArrays(0);
  // await createProcessesArray(0);

  document.querySelector('#loader2').classList.add('d-none')
});