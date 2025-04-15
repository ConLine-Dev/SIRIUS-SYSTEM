let clientsTable;
let profitTable;
let teusTable;
let processesTable;

function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
}
async function createClientTable() {

  let clientsDetails = await makeRequest(`/api/commercial-main/clientsDetails`);

  const listTable = [];

  for (let index = 0; index < clientsDetails.length; index++) {
    const item = clientsDetails[index];

    let profit = `BRL ${item.Lucro_Estimado}`

    listTable.push({
      client: item.Nome.slice(0, 20),
      processes: item.Total_Processos,
      teus: item.Total_TEUS,
      profit: profit,
      lastProcess: item.Ultimo_Embarque,
      daysNoProcess: item.Ultimo_Embarque
    });
  }

  if ($.fn.DataTable.isDataTable("#clientsTable")) {
    $('#clientsTable').DataTable().clear().destroy(); // Limpa e destrói a DataTable
  }

  $('#clientsTable tbody').empty(); // Remove apenas as linhas, mantendo os cabeçalhos

  // Recria a DataTable
  clientsTable = $('#clientsTable').DataTable({
    "data": listTable,
    "columns": [
      { "data": "client" },
      { "data": "processes" },
      { "data": "teus" },
      { "data": "profit" },
      { "data": "lastProcess" },
      { "data": "daysNoProcess" },
    ],
    "language": {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
    },
    "order": [[1, 'desc']],
    "lengthMenu": [[15], [15]],
    "searching": true,
    "info": false,
    "lengthChange": false
  });

  $('#searchBox2').off('keyup').on('keyup', function () {
    clientsTable.search(this.value).draw();
  });
}
async function createProfitTable() {

  let clientsDetails = await makeRequest(`/api/commercial-main/clientsDetails`);

  const listTable = [];

  for (let index = 0; index < clientsDetails.length; index++) {
    const item = clientsDetails[index];

    let profit = `BRL ${item.Lucro_Estimado}`

    listTable.push({
      client: item.Nome.slice(0, 20),
      profit: profit,
    });
  }

  if ($.fn.DataTable.isDataTable("#profitTable")) {
    $('#profitTable').DataTable().clear().destroy(); // Limpa e destrói a DataTable
  }

  $('#profitTable tbody').empty(); // Remove apenas as linhas, mantendo os cabeçalhos

  // Recria a DataTable
  profitTable = $('#profitTable').DataTable({
    // "autoWidth": false,
    // "responsive": true,
    // "scrollX": true,
    "data": listTable,
    "columns": [
      { "data": "client" },
      { "data": "profit" },
    ],
    "language": {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
    },
    "order": [[1, 'desc']],
    "lengthMenu": [[4], [4]],
    "searching": true,
    "info": false,
    "lengthChange": false
  });

  $('#searchBox2').off('keyup').on('keyup', function () {
    profitTable.search(this.value).draw();
  });
}
async function createTeusTable() {

  let clientsDetails = await makeRequest(`/api/commercial-main/clientsDetails`);

  const listTable = [];

  for (let index = 0; index < clientsDetails.length; index++) {
    const item = clientsDetails[index];

    listTable.push({
      client: item.Nome.slice(0, 20),
      teus: item.Total_TEUS,
    });
  }

  if ($.fn.DataTable.isDataTable("#teusTable")) {
    $('#teusTable').DataTable().clear().destroy(); // Limpa e destrói a DataTable
  }

  $('#teusTable tbody').empty(); // Remove apenas as linhas, mantendo os cabeçalhos

  // Recria a DataTable
  teusTable = $('#teusTable').DataTable({
    // "autoWidth": false,
    // "responsive": true,
    // "scrollX": true,
    "data": listTable,
    "columns": [
      { "data": "client" },
      { "data": "teus" },
    ],
    "language": {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
    },
    "order": [[1, 'desc']],
    "lengthMenu": [[4], [4]],
    "searching": true,
    "info": false,
    "lengthChange": false
  });

  $('#searchBox2').off('keyup').on('keyup', function () {
    teusTable.search(this.value).draw();
  });
}
async function createProcessesTable() {

  let clientsDetails = await makeRequest(`/api/commercial-main/clientsDetails`);

  const listTable = [];

  for (let index = 0; index < clientsDetails.length; index++) {
    const item = clientsDetails[index];

    listTable.push({
      client: item.Nome.slice(0, 20),
      processes: item.Total_Processos,
    });
  }

  if ($.fn.DataTable.isDataTable("#processesTable")) {
    $('#processesTable').DataTable().clear().destroy(); // Limpa e destrói a DataTable
  }

  $('#processesTable tbody').empty(); // Remove apenas as linhas, mantendo os cabeçalhos

  // Recria a DataTable
  processesTable = $('#processesTable').DataTable({
    // "autoWidth": false,
    // "responsive": true,
    // "scrollX": true,
    "data": listTable,
    "columns": [
      { "data": "client" },
      { "data": "processes" },
    ],
    "language": {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
    },
    "order": [[1, 'desc']],
    "lengthMenu": [[4], [4]],
    "searching": true,
    "info": false,
    "lengthChange": false
  });

  $('#searchBox2').off('keyup').on('keyup', function () {
    processesTable.search(this.value).draw();
  });
}
async function createTables() {
  await createClientTable();
  await createProfitTable();
  await createTeusTable();
  await createProcessesTable();
}
async function createActivityArray() {

  let activityArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let IACourierCount = 0;
  let IANormalCount = 0;
  let IMFCLCount = 0;
  let IMLCLCount = 0;
  let EACourierCount = 0;
  let EANormalCount = 0;
  let EMFCLCount = 0;
  let EMLCLCount = 0;
  let activeClients = await makeRequest(`/api/commercial-main/activeClients`);

  for (let index = 0; index < activeClients.length; index++) {
    activityArray[activeClients[index].Mes - 1]++;
    if (activeClients[index].Tipo_Processo == 'IA-COURIER') {
      IACourierCount++;
    }
    if (activeClients[index].Tipo_Processo == 'IA-NORMAL') {
      IANormalCount++;
    }
    if (activeClients[index].Tipo_Processo == 'IM-FCL') {
      IMFCLCount++;
    }
    if (activeClients[index].Tipo_Processo == 'IM-LCL') {
      IMLCLCount++;
    }
    if (activeClients[index].Tipo_Processo == 'EA-COURIER') {
      EACourierCount++;
    }
    if (activeClients[index].Tipo_Processo == 'EA-NORMAL') {
      EANormalCount++;
    }
    if (activeClients[index].Tipo_Processo == 'EM-FCL') {
      EMFCLCount++;
    }
    if (activeClients[index].Tipo_Processo == 'EM-LCL') {
      EMLCLCount++;
    }
  }

  modalData = [IACourierCount, IANormalCount, IMFCLCount, IMLCLCount, EACourierCount, EANormalCount, EMFCLCount, EMLCLCount]
  modalLabel = ['IA-Courier', 'IA-Normal', 'IM-FCL', 'IM-LCL', 'EA-Courier', 'EA-Normal', 'EM-FCL', 'EM-LCL']
  createActivityChart(activityArray);
  createActiveModalChart(modalData, modalLabel);
}
function createActivityChart(activityArray) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'Clientes Ativos',
      data: activityArray
    }],
    chart: {
      height: 340,
      width: 450,
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

  var activeChart = new ApexCharts(document.querySelector('#activeClients-chart'), chartData);
  activeChart.render();
}
async function createNewClientsArray() {

  let newClientsArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let IACourierCount = 0;
  let IANormalCount = 0;
  let IMFCLCount = 0;
  let IMLCLCount = 0;
  let EACourierCount = 0;
  let EANormalCount = 0;
  let EMFCLCount = 0;
  let EMLCLCount = 0;
  let newClients = await makeRequest(`/api/commercial-main/newClients`);

  for (let index = 0; index < newClients.length; index++) {
    newClientsArray[newClients[index].Mes - 1]++;
    if (newClients[index].Tipo_Processo == 'IA-COURIER') {
      IACourierCount++;
    }
    if (newClients[index].Tipo_Processo == 'IA-NORMAL') {
      IANormalCount++;
    }
    if (newClients[index].Tipo_Processo == 'IM-FCL') {
      IMFCLCount++;
    }
    if (newClients[index].Tipo_Processo == 'IM-LCL') {
      IMLCLCount++;
    }
    if (newClients[index].Tipo_Processo == 'EA-COURIER') {
      EACourierCount++;
    }
    if (newClients[index].Tipo_Processo == 'EA-NORMAL') {
      EANormalCount++;
    }
    if (newClients[index].Tipo_Processo == 'EM-FCL') {
      EMFCLCount++;
    }
    if (newClients[index].Tipo_Processo == 'EM-LCL') {
      EMLCLCount++;
    }
  }

  modalData = [IACourierCount, IANormalCount, IMFCLCount, IMLCLCount, EACourierCount, EANormalCount, EMFCLCount, EMLCLCount]
  modalLabel = ['IA-Courier', 'IA-Normal', 'IM-FCL', 'IM-LCL', 'EA-Courier', 'EA-Normal', 'EM-FCL', 'EM-LCL']
  createNewClientsChart(newClientsArray);
  createNewModalChart(modalData, modalLabel)
}
function createNewClientsChart(newClientsArray) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'Clientes Novos',
      data: newClientsArray
    }],
    chart: {
      height: 340,
      width: 450,
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

  var newClientsChart = new ApexCharts(document.querySelector('#newClients-chart'), chartData);
  newClientsChart.render();
}
function createActiveModalChart(modalData, modalLabel) {

  var options = {
    series: modalData,
    chart: {
      width: 450,
      type: 'pie',
    },
    labels: modalLabel,
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " processos"
        }
      }
    },
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'bottom'
    },
    responsive: [{
      options: {
        chart: {
          toolbar: {
            show: false,
          }
        }
      }
    }],
  };

  let activeModalChart = new ApexCharts(document.querySelector("#activeModal-chart"), options);
  activeModalChart.render();
}
function createNewModalChart(modalData, modalLabel) {

  var options = {
    series: modalData,
    chart: {
      width: 450,
      type: 'pie',
    },
    labels: modalLabel,
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " processos"
        }
      }
    },
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'bottom'
    },
    responsive: [{
      options: {
        chart: {
          toolbar: {
            show: false,
          }
        }
      }
    }],
  };

  let newModalChart = new ApexCharts(document.querySelector("#newModal-chart"), options);
  newModalChart.render();
}
async function createProcessesArray() {
  let processesArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let processesUserArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let IACourierCount = 0;
  let IANormalCount = 0;
  let IMFCLCount = 0;
  let IMLCLCount = 0;
  let EACourierCount = 0;
  let EANormalCount = 0;
  let EMFCLCount = 0;
  let EMLCLCount = 0;
  let processes = await makeRequest(`/api/commercial-main/totalProcesses`);
  let dataByUser = getInfosLogin();
  let userId = dataByUser.system_id_headcargo;
  let processesByUser = await makeRequest(`/api/commercial-main/processesByUser`, 'POST', {userId})

  for (let index = 0; index < processes.length; index++) {
    processesArray[processes[index].Mes-1] += processes[index].Quantidade;
  }

  for (let index = 0; index < processesByUser.length; index++) {
    processesUserArray[processesByUser[index].Mes - 1] += processesByUser[index].Quantidade;
    if (processesByUser[index].Tipo_Processo == 'IA-COURIER') {
      IACourierCount += processesByUser[index].Quantidade;
    }
    if (processesByUser[index].Tipo_Processo == 'IA-NORMAL') {
      IANormalCount += processesByUser[index].Quantidade;
    }
    if (processesByUser[index].Tipo_Processo == 'IM-FCL') {
      IMFCLCount += processesByUser[index].Quantidade;
    }
    if (processesByUser[index].Tipo_Processo == 'IM-LCL') {
      IMLCLCount += processesByUser[index].Quantidade;
    }
    if (processesByUser[index].Tipo_Processo == 'EA-COURIER') {
      EACourierCount += processesByUser[index].Quantidade;
    }
    if (processesByUser[index].Tipo_Processo == 'EA-NORMAL') {
      EANormalCount += processesByUser[index].Quantidade;
    }
    if (processesByUser[index].Tipo_Processo == 'EM-FCL') {
      EMFCLCount += processesByUser[index].Quantidade;
    }
    if (processesByUser[index].Tipo_Processo == 'EM-LCL') {
      EMLCLCount += processesByUser[index].Quantidade;
    }
  }
  modalData = [IACourierCount, IANormalCount, IMFCLCount, IMLCLCount, EACourierCount, EANormalCount, EMFCLCount, EMLCLCount]
  modalLabel = ['IA-Courier', 'IA-Normal', 'IM-FCL', 'IM-LCL', 'EA-Courier', 'EA-Normal', 'EM-FCL', 'EM-LCL']
  createProcessesChart(processesArray, processesUserArray);
  createProcessesPercentChart(modalData, modalLabel);
}
function createProcessesChart(processesArray, processesUserArray) {
  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'Processos Abertos - Total',
      data: processesArray
    }, {
      name: 'Processos Abertos - Individual',
      data: processesUserArray
    }],
    chart: {
      height: 250,
      width: 910,
      type: "bar",
      stacked: true,
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
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: false,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const seriesAValue = series[0][dataPointIndex];
        const seriesBValue = series[1][dataPointIndex];
        const percentage = ((seriesBValue / seriesAValue) * 100).toFixed(2);
        return `
          <div style="padding: 10px; font-size: 12px; border-radius: 5px; background: rgba(0, 0, 0, 0.7); color: #fff;">
            <strong>${w.globals.labels[dataPointIndex]}</strong><br>
            Processos Abertos - Total: ${seriesAValue}<br>
            Processos Abertos - Individual: ${seriesBValue}<br>
            Porcentagem de Participação - ${percentage}%<br>
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
    legend: {
      show: false,
    },
    yaxis: {
      show: false,
    }
  };

  var processesChart = new ApexCharts(document.querySelector('#processes-chart'), chartData);
  processesChart.render();
}
function createProcessesPercentChart(modalData, modalLabel) {

  var options = {
    series: modalData,
    chart: {
      width: 400,
      type: 'pie',
    },
    labels: modalLabel,
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " processos"
        }
      }
    },
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'right'
    },
    responsive: [{
      options: {
        chart: {
          toolbar: {
            show: false,
          }
        }
      }
    }],
  };

  let processesPercentChart = new ApexCharts(document.querySelector("#processesPercent-chart"), options);
  processesPercentChart.render();
}
async function createTeusProfitArray() {
  let teusArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let teusUserArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let profitArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let profitUserArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let totalEACourier = 0;
  let totalIACourier = 0;
  let totalEANormal = 0;
  let totalIANormal = 0;
  let totalIMFCL = 0;
  let totalIMLCL = 0;
  let totalEMFCL = 0;
  let totalEMLCL = 0;
  let IM20 = 0;
  let IM40 = 0;
  let EM20 = 0;
  let EM40 = 0;
  let teusAndProfit = await makeRequest(`/api/commercial-main/teusAndProfit`);
  let dataByUser = getInfosLogin();
  let userId = dataByUser.system_id_headcargo;
  let teusAndProfitByUser = await makeRequest(`/api/commercial-main/teusAndProfitByUser`, 'POST', {userId})

  for (let index = 0; index < teusAndProfit.length; index++) {
    teusArray[teusAndProfit[index].Mes-1] += teusAndProfit[index].Total_TEUS;
    profitArray[teusAndProfit[index].Mes-1] += teusAndProfit[index].Lucro_Estimado;
  }
  for (let index = 0; index < teusAndProfitByUser.length; index++) {
    teusUserArray[teusAndProfitByUser[index].Mes-1] += teusAndProfitByUser[index].Total_TEUS;
    profitUserArray[teusAndProfitByUser[index].Mes-1] += teusAndProfitByUser[index].Lucro_Estimado;
    if (teusAndProfitByUser[index].Tipo_Processo == 'IA-COURIER') {
      totalIACourier += teusAndProfitByUser[index].Lucro_Estimado;
    }
    if (teusAndProfitByUser[index].Tipo_Processo == 'IA-NORMAL') {
      totalIANormal += teusAndProfitByUser[index].Lucro_Estimado;
    }
    if (teusAndProfitByUser[index].Tipo_Processo == 'IM-FCL') {
      totalIMFCL += teusAndProfitByUser[index].Lucro_Estimado;
      IM20 += teusAndProfitByUser[index].Total_Container_20;
      IM40 += teusAndProfitByUser[index].Total_Container_40;
    }
    if (teusAndProfitByUser[index].Tipo_Processo == 'IM-LCL') {
      totalIMLCL += teusAndProfitByUser[index].Lucro_Estimado;
    }
    if (teusAndProfitByUser[index].Tipo_Processo == 'EA-COURIER') {
      totalEACourier += teusAndProfitByUser[index].Lucro_Estimado;
    }
    if (teusAndProfitByUser[index].Tipo_Processo == 'EA-NORMAL') {
      totalEANormal += teusAndProfitByUser[index].Lucro_Estimado;
    }
    if (teusAndProfitByUser[index].Tipo_Processo == 'EM-FCL') {
      totalEMFCL += teusAndProfitByUser[index].Lucro_Estimado;
      EM20 += teusAndProfitByUser[index].Total_Container_20;
      EM40 += teusAndProfitByUser[index].Total_Container_40;
    }
    if (teusAndProfitByUser[index].Tipo_Processo == 'EM-LCL') {
      totalEMLCL += teusAndProfitByUser[index].Lucro_Estimado;
    }
  }

  totalEACourier = totalEACourier.toFixed(2);
  totalIACourier = totalIACourier.toFixed(2);
  totalEANormal = totalEANormal.toFixed(2);
  totalIANormal = totalIANormal.toFixed(2);
  totalIMFCL = totalIMFCL.toFixed(2);
  totalIMLCL = totalIMLCL.toFixed(2);
  totalEMFCL = totalEMFCL.toFixed(2);
  totalEMLCL = totalEMLCL.toFixed(2);

  modalData = [totalIACourier, totalIANormal, totalIMFCL, totalIMLCL, totalEACourier, totalEANormal, totalEMFCL, totalEMLCL]
  modalData = modalData.map(s => parseFloat(s.replace(",", ".")));
  modalLabel = ['IA-Courier', 'IA-Normal', 'IM-FCL', 'IM-LCL', 'EA-Courier', 'EA-Normal', 'EM-FCL', 'EM-LCL']
  containerData = [IM20, EM20, IM40, EM40];
  containerLabel = [`20' - IM`, `20' - EM`, `40' - IM`, `40' - EM`];
  createTEUsChart(teusArray, teusUserArray);
  createProfitChart(profitArray, profitUserArray);
  createProfitPercentChart(modalData, modalLabel);
  createContainerPercentChart(containerData, containerLabel);
}
function createTEUsChart(teusArray, teusUserArray) {
  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'TEUs - Total',
      data: teusArray
    }, {
      name: 'TEUs - Individual',
      data: teusUserArray
    }],
    chart: {
      height: 250,
      width: 910,
      type: "bar",
      stacked: true,
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
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: false,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const seriesAValue = series[0][dataPointIndex];
        const seriesBValue = series[1][dataPointIndex];
        const percentage = ((seriesBValue / seriesAValue) * 100).toFixed(2);
        return `
          <div style="padding: 10px; font-size: 12px; border-radius: 5px; background: rgba(0, 0, 0, 0.7); color: #fff;">
            <strong>${w.globals.labels[dataPointIndex]}</strong><br>
            TEUs - Total: ${seriesAValue}<br>
            TEUs - Individual: ${seriesBValue}<br>
            Porcentagem de Participação - ${percentage}%<br>
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
    legend: {
      show: false,
    },
    yaxis: {
      show: false,
    }
  };

  var teusChart = new ApexCharts(document.querySelector('#teus-chart'), chartData);
  teusChart.render();
}
function createProfitChart(profitArray, profitUserArray) {
  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'Lucro Estimado - Total',
      data: profitArray
    }, {
      name: 'Lucro Estimado - Individual',
      data: profitUserArray
    }],
    chart: {
      height: 250,
      width: 910,
      type: "bar",
      stacked: true,
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
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: false,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const seriesAValue = series[0][dataPointIndex].toFixed(2);
        const seriesBValue = series[1][dataPointIndex].toFixed(2);
        const percentage = ((seriesBValue / seriesAValue) * 100).toFixed(2);
        return `
          <div style="padding: 10px; font-size: 12px; border-radius: 5px; background: rgba(0, 0, 0, 0.7); color: #fff;">
            <strong>${w.globals.labels[dataPointIndex]}</strong><br>
            Lucro Estimado - Total: R$ ${seriesAValue}<br>
            Lucro Estimado - Individual: R$ ${seriesBValue}<br>
            Porcentagem de Participação - ${percentage}%<br>
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
    legend: {
      show: false,
    },
    yaxis: {
      show: false,
    }
  };

  var profitChart = new ApexCharts(document.querySelector('#profit-chart'), chartData);
  profitChart.render();
}
function createProfitPercentChart(modalData, modalLabel) {

  var options = {
    series: modalData,
    chart: {
      width: 400,
      type: 'pie',
    },
    labels: modalLabel,
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    tooltip: {
      y: {
        formatter: function (val) {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(val);
        }
      }
    },    
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'right'
    },
    responsive: [{
      options: {
        chart: {
          toolbar: {
            show: false,
          }
        }
      }
    }],
  };

  let profitPercentChart = new ApexCharts(document.querySelector("#profitPercent-chart"), options);
  profitPercentChart.render();
}
function createContainerPercentChart(containerData, containerLabel) {

  var options = {
    series: containerData,
    chart: {
      width: 390,
      type: 'pie',
    },
    labels: containerLabel,
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " containers"
        }
      }
    },    
    fill: {
      type: 'gradient',
      opacity: 0.85,
    },
    legend: {
      show: true,
      position: 'right'
    },
    responsive: [{
      options: {
        chart: {
          toolbar: {
            show: false,
          }
        }
      }
    }],
  };

  let teusPercentChart = new ApexCharts(document.querySelector("#teusPercent-chart"), options);
  teusPercentChart.render();
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  await createTables();
  await createActivityArray();
  await createNewClientsArray();
  await createProcessesArray();
  await createTeusProfitArray();

  document.querySelector('#loader2').classList.add('d-none')
});