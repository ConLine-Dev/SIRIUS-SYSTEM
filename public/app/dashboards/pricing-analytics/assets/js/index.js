let agentsTable, cancelChart, originQChart, originTChart, agentChart;

async function updateTable() {
  const countrySelect = document.getElementById("countrySelect");
  const agentSelect = document.getElementById("agentSelect");
  const yearSelect = document.getElementById("yearSelect");

  let country = countrySelect.value;
  let agent = agentSelect.value;
  let year = yearSelect.value;

  const getVolumes = await makeRequest(`/api/pricing-analytics/updateTable`, 'POST', {country, agent, year});
  await createTable(getVolumes);
  await createTEUsArrays(getVolumes);
}

async function createSelects() {

  const countrySelect = document.getElementById("countrySelect");
  const countrySelect2 = document.getElementById("countrySelect2");
  const agentSelect = document.getElementById("agentSelect");
  const yearSelect = document.getElementById("yearSelect");
  const yearSelect2 = document.getElementById("yearSelect2");
  const yearSelect3 = document.getElementById("yearSelect3");

  const getCountries = await makeRequest(`/api/pricing-analytics/getCountries`)
  const getAgents = await makeRequest(`/api/pricing-analytics/getAgents`)
  const getYears = await makeRequest(`/api/pricing-analytics/getYears`)

  for (let index = 0; index < getCountries.length; index++) {
    const element = getCountries[index];
    let option = document.createElement("option");
    option.value = element.IdPais;
    option.textContent = element.Pais;
    countrySelect.appendChild(option);
  }
  for (let index = 0; index < getAgents.length; index++) {
    const element = getAgents[index];
    let option = document.createElement("option");
    option.value = element.IdPessoa;
    option.textContent = element.Agente;
    agentSelect.appendChild(option);
  }
  for (let index = 0; index < getYears.length; index++) {
    const element = getYears[index].Ano;
    let option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    yearSelect.appendChild(option);
  }
  for (let index = 0; index < getCountries.length; index++) {
    const element = getCountries[index];
    let option = document.createElement("option");
    option.value = element.IdPais;
    option.textContent = element.Pais;
    countrySelect2.appendChild(option);
  }
  for (let index = 0; index < getYears.length; index++) {
    const element = getYears[index].Ano;
    let option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    yearSelect2.appendChild(option);
  }
  for (let index = 0; index < getYears.length; index++) {
    const element = getYears[index].Ano;
    let option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    yearSelect3.appendChild(option);
  }
}

async function createTable(getVolumes) {

  const listTable = [];

  for (let index = 0; index < getVolumes.length; index++) {
    const item = getVolumes[index];

    let monthYear = `${item.Mes}/${item.Ano}`
    let quantity = `${item.Quantidade} x ${item.Container}`

    listTable.push({
      agent: item.Agente,
      country: item.Pais,
      monthYear: monthYear,
      quantity: quantity,
      teus: item.Teus,
    });
  }

  if ($.fn.DataTable.isDataTable("#agentsTable")) {
    $('#agentsTable').DataTable().clear().destroy(); // Limpa e destrói a DataTable
  }

  $('#agentsTable tbody').empty(); // Remove apenas as linhas, mantendo os cabeçalhos

  // Recria a DataTable
  agentsTable = $('#agentsTable').DataTable({
    // "autoWidth": false,
    // "responsive": true,
    // "scrollX": true,
    "data": listTable,
    "columns": [
      { "data": "agent" },
      { "data": "country" },
      { "data": "monthYear" },
      { "data": "quantity" },
      { "data": "teus" },
    ],
    "language": {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
    },
    "order": [[4, 'desc']],
    "lengthMenu": [[13], [13]],
    "searching": true,
  });

  $('#searchBox2').off('keyup').on('keyup', function() {
    agentsTable.search(this.value).draw();
  });
}

async function createTEUsArrays(getVolumes) {
  let teus2024 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let teus2025 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (let index = 0; index < getVolumes.length; index++) {
    if (getVolumes[index].Ano == 2024) {
      teus2024[getVolumes[index].Mes - 1] += getVolumes[index].Teus;
    }
    if (getVolumes[index].Ano == 2025) {
      teus2025[getVolumes[index].Mes - 1] += getVolumes[index].Teus;
    }
  }
  createTEUsChart(teus2024, teus2025);
}

function createTEUsChart(teus2024, teus2025) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (cancelChart) {
    cancelChart.destroy();
  }

  var chartData = {

    series: [{
      data: teus2024,
      name: 'TEUs 2024'
    }, {
      data: teus2025,
      name: 'TEUs 2025'
    }],
    chart: {
      height: 680,
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
      offsetX: -15,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      },
    },
    tooltip: {
      enabled: false,
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

  cancelChart = new ApexCharts(document.querySelector('#totalYear-fcl'), chartData);
  cancelChart.render();
}

async function createOriginArrays(){
  let labels = [];
  let quantity = [];
  let teus = [];

  const yearSelect3 = document.getElementById("yearSelect3");
  let year = yearSelect3.value;

  const moveByOrigin = await makeRequest(`/api/pricing-analytics/getMoveByOrigin`, 'POST', {year});

  for (let index = 0; index < moveByOrigin.length; index++) {
    labels[index] = moveByOrigin[index].Pais;
    quantity[index] = moveByOrigin[index].Quantidade_Aparicoes;
    teus[index] = moveByOrigin[index].Total_TEUS;
  }

  createOriginChart(labels, quantity, teus);
}

function createOriginChart(labels, quantity, teus) {

  if (originQChart) {
    originQChart.destroy();
  }
  if (originTChart) {
    originTChart.destroy();
  }

  var options = {
    series: quantity,
    chart: {
    width: 500,
    type: 'pie',
  },
  labels: labels,
  colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
  tooltip: {
    y: {
      formatter: function (val) {
        return val + " processos"
      }
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'left'
      }
    }
  }]
  };

  originQChart = new ApexCharts(document.querySelector("#moveByQuantity"), options);
  originQChart.render();

  var options2 = {
    series: teus,
    chart: {
    width: 500,
    type: 'pie',
  },
  labels: labels,
  colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
  tooltip: {
    y: {
      formatter: function (val) {
        return val + " TEUs"
      }
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'left'
      }
    }
  }]
  };

  originTChart = new ApexCharts(document.querySelector("#moveByTEUs"), options2);
  originTChart.render();
}

async function createAgentArrays() {
  let labels = [];
  let quantity = [];

  const countrySelect2 = document.getElementById("countrySelect2");
  let idCountry = countrySelect2.value;
  const yearSelect2 = document.getElementById("yearSelect2");
  let year = yearSelect2.value;

  const moveByAgent = await makeRequest(`/api/pricing-analytics/getMoveByAgent`, 'POST', { idCountry, year });

  for (let index = 0; index < moveByAgent.length; index++) {
    labels[index] = moveByAgent[index].Agente.slice(0, 30);
    quantity[index] = moveByAgent[index].Total_TEUS
  }
  createAgentChart(labels, quantity);
}

function createAgentChart(labels, quantity) {

  if (agentChart){
    agentChart.destroy();
  }

  var options = {
    series: quantity,
    chart: {
      width: 680,
      type: 'pie',
    },
    labels: labels,
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " TEUs"
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
      }
    }]
  };

  agentChart = new ApexCharts(document.querySelector("#agent-movement"), options);
  agentChart.render();
}

document.addEventListener('DOMContentLoaded', async function () {

  const getVolumes = await makeRequest(`/api/pricing-analytics/getVolumes`);
  await createTable(getVolumes);
  await createTEUsArrays(getVolumes);
  await createSelects();
  await createOriginArrays();

  document.querySelector('#loader2').classList.add('d-none')
});