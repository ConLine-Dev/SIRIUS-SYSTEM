let processesMonth;
let profitMonth;
let processesAgent;
let processesCarrier;
let processesTerminal;
let processesCustomer;
let processesCountry;
let clientSelect, clientsChoices;
let originSelect, originsChoices;
let destinationSelect, destinationChoices;

async function printProcesses(filters) {

  let processes = await makeRequest(`/api/pricing-main/getProcessesTotal`, 'POST', filters);

  let divAIR = document.getElementById('AIR');
  let divLCL = document.getElementById('LCL');
  let divFCL = document.getElementById('FCL');
  let divTotal = document.getElementById('total');
  let divProfitTotal = document.getElementById('profitTotal');
  let divProfitProcess = document.getElementById('profitProcess');

  let printAir = `<div><h2>${processes[0].Total_Aereo}</h2>`
  let printLCL = `<div><h2>${processes[0].Total_LCL}</h2>`
  let printFCL = `<div><h2>${processes[0].Total_FCL}</h2>`
  let printTotal = `<div><h2>${processes[0].Total_Processos}</h2>`
  let printProfitTotal = `<div><h3>${processes[0].Lucro_Total}</h3>`
  let printProfitProcess = `<div><h3>${processes[0].Lucro_Medio}</h3>`

  divAIR.innerHTML = printAir;
  divLCL.innerHTML = printLCL;
  divFCL.innerHTML = printFCL;
  divTotal.innerHTML = printTotal;
  divProfitTotal.innerHTML = printProfitTotal;
  divProfitProcess.innerHTML = printProfitProcess;
}

async function createSelects() {

  clientSelect = document.getElementById('client');
  clientsChoices = new Choices(clientSelect, {
    searchEnabled: true,
    itemSelectText: '',
    placeholderValue: 'Cliente',
    searchPlaceholderValue: 'Buscar cliente...'
  });

  clientSelect.addEventListener('search', function (event) {
    const searchTerm = event.detail.value;

    if (searchTerm.length > 2) {
      fetchClients(searchTerm);
    }
  });

  originSelect = document.getElementById('origin');
  originsChoices = new Choices(originSelect, {
    searchEnabled: true,
    itemSelectText: '',
    placeholderValue: 'Origem',
    searchPlaceholderValue: 'Buscar origem...'
  });

  originSelect.addEventListener('search', function (event) {
    const searchTerm = event.detail.value;

    if (searchTerm.length > 2) {
      fetchOrigins(searchTerm);
    }
  });

  destinationSelect = document.getElementById('destination');
  destinationChoices = new Choices(destinationSelect, {
    searchEnabled: true,
    itemSelectText: '',
    placeholderValue: 'Destino',
    searchPlaceholderValue: 'Buscar destino...'
  });

  destinationSelect.addEventListener('search', function (event) {
    const searchTerm = event.detail.value;

    if (searchTerm.length > 2) {
      fetchDestinations(searchTerm);
    }
  });
}

async function fetchClients(search) {
  let clients = await makeRequest(`/api/pricing-main/getClients`, 'POST', { search })

  for (let index = 0; index < clients.length; index++) {
    clientsChoices.setChoices([{ value: clients[index].id, label: clients[index].Nome }], 'value', 'label', false);
  }
}

async function fetchOrigins(search) {
  let origins = await makeRequest(`/api/pricing-main/getOrigins`, 'POST', { search })

  for (let index = 0; index < origins.length; index++) {
    originsChoices.setChoices([{ value: origins[index].id, label: origins[index].origem }], 'value', 'label', false);
  }
}

async function fetchDestinations(search) {
  let destinations = await makeRequest(`/api/pricing-main/getDestinations`, 'POST', { search })

  for (let index = 0; index < destinations.length; index++) {
    destinationChoices.setChoices([{ value: destinations[index].id, label: destinations[index].destino }], 'value', 'label', false);
  }
}

async function createArrays(filters) {

  const countries = await makeRequest(`/api/pricing-main/getProcessesCountries`, 'POST', filters);
  let results = [];

  for (let index = 0; index < countries.length; index++) {
    let continent = await fetch(`https://restcountries.com/v3.1/name/${countries[index].Nome}`)
    let data = await continent.json();
    if (!results[`'${data[0].region}'`]) {
      results[`'${data[0].region}'`] = 0;
    }
    results[`'${data[0].region}'`] += countries[index].Total;
  }

  createProcessesChart(results);

  const details = await makeRequest(`/api/pricing-main/getProcessesMonth`, 'POST', filters);

  let processes = []
  let profit = []

  for (let index = 0; index < 12; index++) {
    processes[index] = 0
    profit[index] = 0
  }

  for (let index = 0; index < details.length; index++) {
    processes[details[index].Mes - 1] = details[index].Total_Processos
    profit[details[index].Mes - 1] = details[index].Lucro_Estimado_Total
  }
  createProcessesMonthChart(processes);
  createProfitMonthChart(profit);

  const processesByAgent = await makeRequest(`/api/pricing-main/processesByAgent`, 'POST', filters);
  let agentsData = []
  let agentsNames = []
  let agentsSize = 10;

  if (processesByAgent.length < agentsSize) {
    agentsSize = processesByAgent.length;
  }

  for (let index = 0; index < agentsSize; index++) {
    if (processesByAgent[index].Total_Processos) {
      agentsData[index] = processesByAgent[index].Total_Processos;
      agentsNames[index] = processesByAgent[index].Agente_Origem;
    }
  }
  createProcessesAgentChart(agentsData, agentsNames);

  const processesByCarrier = await makeRequest(`/api/pricing-main/processesByCarrier`, 'POST', filters);
  let carriersData = []
  let carriersNames = []
  let carriersSize = 10;

  if (processesByCarrier.length < carriersSize) {
    carriersSize = processesByCarrier.length
  }

  for (let index = 0; index < carriersSize; index++) {
    if (processesByCarrier[index].Total_Processos) {
      carriersData[index] = processesByCarrier[index].Total_Processos;
      carriersNames[index] = processesByCarrier[index].Companhia_Transporte;
    }
  }
  createProcessesCarrierChart(carriersData, carriersNames);

  const processesByTerminal = await makeRequest(`/api/pricing-main/processesByTerminal`, 'POST', filters);
  let terminalData = []
  let terminalNames = []
  let terminalSize = 10;

  if (processesByTerminal.length < terminalSize) {
    terminalSize = processesByTerminal.length
  }

  for (let index = 0; index < terminalSize; index++) {
    if (processesByTerminal[index].Total_Processos) {
      terminalData[index] = processesByTerminal[index].Total_Processos;
      terminalNames[index] = processesByTerminal[index].Terminal_Redestinacao;
    }
  }
  createProcessesTerminalChart(terminalData, terminalNames);

  const processesByCustomer = await makeRequest(`/api/pricing-main/processesByCustomer`, 'POST', filters);
  let customerData = []
  let customerNames = []
  let customerSize = 10;

  if (processesByCustomer.length < customerSize) {
    customerSize = processesByCustomer.length
  }

  for (let index = 0; index < customerSize; index++) {
    if (processesByCustomer[index].Total_Processos) {
      customerData[index] = processesByCustomer[index].Total_Processos;
      customerNames[index] = processesByCustomer[index].Cliente;
    }
  }
  createProcessesCustomersChart(customerData, customerNames);
}

function createProcessesMonthChart(data) {
  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (processesMonth) {
    processesMonth.destroy();
  }

  var chartData = {

    series: [{
      data: data
    }],
    chart: {
      height: 200,
      width: 1240,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
        columnWidth: "60%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
        colors: ['#fff']
      }
    },
    tooltip: {
      enabled: false
    },
    colors: ["#F9423A"],
    markers: {
      size: 0,
      strokeColors: ["#F9423A"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
    },
    stroke: {
      width: 0,
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

  processesMonth = new ApexCharts(document.querySelector('#processesMonthChart'), chartData);
  processesMonth.render();
}

function createProfitMonthChart(data) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (profitMonth) {
    profitMonth.destroy();
  }

  var chartData = {

    series: [{
      data: data
    }],
    chart: {
      height: 200,
      width: 1240,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
        columnWidth: "60%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      },
      formatter: function (val) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val);
      }
    },
    tooltip: {
      enabled: false
    },
    colors: ["#F9423A"],
    markers: {
      size: 0,
      strokeColors: ["#F9423A"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
    },
    stroke: {
      width: 0,
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

  profitMonth = new ApexCharts(document.querySelector('#profitMonthChart'), chartData);
  profitMonth.render();
}

function createProcessesAgentChart(data, names) {

  if (processesAgent) {
    processesAgent.destroy();
  }

  var chartData = {

    series: [{
      data: data
    }],
    chart: {
      height: 500,
      width: 450,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        columnWidth: "60%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    tooltip: {
      enabled: false
    },
    colors: ["#F9423A"],
    markers: {
      size: 0,
      strokeColors: ["#F9423A"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
    },
    stroke: {
      width: 0,
      curve: "smooth",
    },
    xaxis: {
      categories: names,
      position: "bottom",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  processesAgent = new ApexCharts(document.querySelector('#processesAgentChart'), chartData);
  processesAgent.render();
}

function createProcessesCarrierChart(data, names) {

  if (processesCarrier) {
    processesCarrier.destroy();
  }

  var chartData = {

    series: [{
      data: data
    }],
    chart: {
      height: 500,
      width: 450,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        columnWidth: "60%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    tooltip: {
      enabled: false
    },
    colors: ["#F9423A"],
    markers: {
      size: 0,
      strokeColors: ["#F9423A"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
    },
    stroke: {
      width: 0,
      curve: "smooth",
    },
    xaxis: {
      categories: names,
      position: "bottom",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  processesCarrier = new ApexCharts(document.querySelector('#processesCarrierChart'), chartData);
  processesCarrier.render();
}

function createProcessesTerminalChart(data, names) {

  if (processesTerminal) {
    processesTerminal.destroy();
  }

  var chartData = {

    series: [{
      data: data
    }],
    chart: {
      height: 500,
      width: 450,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        columnWidth: "60%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    tooltip: {
      enabled: false
    },
    colors: ["#F9423A"],
    markers: {
      size: 0,
      strokeColors: ["#F9423A"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
    },
    stroke: {
      width: 0,
      curve: "smooth",
    },
    xaxis: {
      categories: names,
      position: "bottom",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  processesTerminal = new ApexCharts(document.querySelector('#processesTerminalChart'), chartData);
  processesTerminal.render();
}

function createProcessesCustomersChart(data, names) {

  if (processesCustomer) {
    processesCustomer.destroy();
  }

  var chartData = {

    series: [{
      data: data
    }],
    chart: {
      height: 500,
      width: 450,
      type: "bar",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        columnWidth: "60%",
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    tooltip: {
      enabled: false
    },
    colors: ["#F9423A"],
    markers: {
      size: 0,
      strokeColors: ["#F9423A"],
      strokeWidth: 2,
      strokeOpacity: 0.9,
      fillOpacity: 1,
      shape: "circle",
      showNullDataPoints: true,
    },
    stroke: {
      width: 0,
      curve: "smooth",
    },
    xaxis: {
      categories: names,
      position: "bottom",
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  processesCustomer = new ApexCharts(document.querySelector('#processesCustomersChart'), chartData);
  processesCustomer.render();
}

function createProcessesChart(results) {

  let labels = Object.keys(results).map(label => label.replace(/^'+|'+$/g, ""));
  let data = Object.values(results);

  if (processesCountry) {
    processesCountry.destroy();
  }

  var chartData = {
    series: data,
    chart: {
      width: 500,
      type: 'pie',
      offsetX: 50,
    },
    plotOptions: {
      pie: {
        expandOnClick: false
      }
    },
    labels: labels,
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'bottom',
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

  processesCountry = new ApexCharts(document.querySelector("#processesCountriesChart"), chartData);
  processesCountry.render();

}

// Primeiro: lógica para selecionar/deselecionar os botões
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('selected');
  });
});

async function printFilteredData() {
  const selected = {
    ano: [],
    modal: [],
    mes: [],
    cliente: 0,
    origem: 0,
    destino: 0
  };

  document.querySelectorAll('.filter-btn.selected').forEach(btn => {
    const type = btn.dataset.type;
    const value = btn.dataset.value;

    if (selected[type]) {
      selected[type].push(value);
    }
  });
  
  selected.cliente = document.getElementById('client').value;
  selected.origem = document.getElementById('origin').value;
  selected.destino = document.getElementById('destination').value;
  
  document.querySelector('#loader2').classList.remove('d-none')
  await printProcesses(selected);
  await createArrays(selected);
  document.querySelector('#loader2').classList.add('d-none')
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  let filters = {}

  await printProcesses(filters);
  await createArrays(filters);
  await createSelects();

  document.querySelector('#loader2').classList.add('d-none')
});