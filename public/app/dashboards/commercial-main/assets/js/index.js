let teusArray = [];
let activityArray = [];
let FCLArray = [];
let LCLArray = [];
let AirArray = [];
let CourierArray = [];
let profitArray = [];
let AsFCLArray = [];
let AsLCLArray = [];
let AsAirArray = [];

function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

async function createTEUsArrays() {

  let userData = getInfosLogin();
  let userId = userData.system_id_headcargo;
  let processes = await makeRequest(`/api/commercial-main/listAllProcesses`, 'POST', {userId});

  for (let index = 0; index < processes.length; index++) {
    if (!teusArray[processes[index].Mes - 1]) {
      teusArray[processes[index].Mes - 1] = processes[index].Teus;
    } else {
      teusArray[processes[index].Mes - 1] += processes[index].Teus;
    }
  }
}

async function createActivityArray() {

  let userData = getInfosLogin();
  let userId = userData.system_id_headcargo;
  let activeClients = await makeRequest(`/api/commercial-main/listActiveClients`, 'POST', {userId});

  for (let index = 0; index < activeClients.length; index++) {
    if (!activityArray[activeClients[index].Mes - 1]) {
      activityArray[activeClients[index].Mes - 1] = activeClients[index].Total;
    } else {
      activityArray[activeClients[index].Mes - 1] += activeClients[index].Total;
    }
  }

  createActivityChart(activityArray);
}

async function createProcessesArrays() {

  let userData = getInfosLogin();
  let userId = userData.system_id_headcargo;
  let processes = await makeRequest(`/api/commercial-main/countProcesses`, 'POST', {userId});
  let PrLCL = []
  let PrFCL = []
  let PrAir = []
  let PrCourier = []

  const actualMonth = new Date().getMonth() + 1;

  for (let index = 0; index < actualMonth; index++) {
    PrLCL[index] = 0
    PrFCL[index] = 0
    PrAir[index] = 0
    PrCourier[index] = 0
  }

  for (let index = 0; index < processes.length; index++) {
    if (processes[index].Tipo_Processo == 'IA-COURIER') {
      if (!PrCourier[processes[index].Mes - 1]) {
        PrCourier[processes[index].Mes - 1] = 0;
      }
      PrCourier[processes[index].Mes - 1] += processes[index].Quantidade;
    }
    if (processes[index].Tipo_Processo == 'IA-NORMAL') {
      if (!PrAir[processes[index].Mes - 1]) {
        PrAir[processes[index].Mes - 1] = 0;
      }
      PrAir[processes[index].Mes - 1] += processes[index].Quantidade;
    }
    if (processes[index].Tipo_Processo == 'IM-FCL') {
      if (!PrFCL[processes[index].Mes - 1]) {
        PrFCL[processes[index].Mes - 1] = 0;
      }
      PrFCL[processes[index].Mes - 1] += processes[index].Quantidade;
    }
    if (processes[index].Tipo_Processo == 'IM-LCL') {
      if (!PrLCL[processes[index].Mes - 1]) {
        PrLCL[processes[index].Mes - 1] = 0;
      }
      PrLCL[processes[index].Mes - 1] += processes[index].Quantidade;
    }
  }

  createProcessesChart(PrLCL, PrFCL, PrAir, PrCourier);
}

async function createProfitArray() {

  let userData = getInfosLogin();
  let userId = userData.system_id_headcargo;
  let profitByUser = await makeRequest(`/api/commercial-main/profitByUser`, 'POST', {userId});

  for (let index = 0; index < profitByUser.length; index++) {
    if (!profitArray[profitByUser[index].Mes-1]){
      profitArray[profitByUser[index].Mes-1] = profitByUser[index].Total_Valor;
    } else {
      profitArray[profitByUser[index].Mes-1] += profitByUser[index].Total_Valor;
    }
  }
}

async function createAssertivityArrays() {

  let userData = getInfosLogin();
  let userId = userData.system_id_headcargo;
  let offersByUser = await makeRequest(`/api/commercial-main/getOffers`, 'POST', {userId});

  let actualMonth = new Date().getMonth();

  for (let index = 0; index < actualMonth.length; index++) {
    LCLArray[index] = 0;
    AirArray[index] = 0;
    FCLArray[index] = 0;
  }

  for (let index = 0; index < offersByUser.length; index++) {
    if (offersByUser[index].Tipo_Carga == 'FCL') {
      FCLArray[offersByUser[index].Mes - 1] = offersByUser[index].Total_Aprovada/(offersByUser[index].Total_Reprovada + offersByUser[index].Total_Pendente + offersByUser[index].Total_Aprovada)*100;
      FCLArray[offersByUser[index].Mes - 1] = FCLArray[offersByUser[index].Mes - 1].toFixed(2);
    }
    if (offersByUser[index].Tipo_Carga == 'LCL') {
      LCLArray[offersByUser[index].Mes - 1] = offersByUser[index].Total_Aprovada/(offersByUser[index].Total_Reprovada + offersByUser[index].Total_Pendente + offersByUser[index].Total_Aprovada)*100;
      LCLArray[offersByUser[index].Mes - 1] = LCLArray[offersByUser[index].Mes - 1].toFixed(2);
    }
    if (offersByUser[index].Tipo_Carga == 'Aéreo') {
      AirArray[offersByUser[index].Mes - 1] = offersByUser[index].Total_Aprovada/(offersByUser[index].Total_Reprovada + offersByUser[index].Total_Pendente + offersByUser[index].Total_Aprovada)*100;
      AirArray[offersByUser[index].Mes - 1] = AirArray[offersByUser[index].Mes - 1].toFixed(2);
    }
  }
}

async function createGoalsArrays() {

  let data = getInfosLogin();
  let totalProcesses = await makeRequest(`/api/commercial-main/totalProcesses`);
  let filteredProcesses = await makeRequest(`/api/commercial-main/filteredProcesses`, 'POST', {userId: data.system_id_headcargo});

  let LCLTotal = []
  let FCLTotal = []
  let AirTotal = []
  let CourierTotal = []
  let LCLPart = []
  let FCLPart = []
  let AirPart = []
  let CourierPart = []

  for (let index = 0; index < totalProcesses.length; index++) {
    if (totalProcesses[index].Tipo_Processo == 'IM-FCL') {
      if (!FCLTotal[totalProcesses[index].Mes - 1]) {
        FCLTotal[totalProcesses[index].Mes - 1] = 0;
      }
      FCLTotal[totalProcesses[index].Mes - 1] = totalProcesses[index].Total_TEUS;
    }
    if (totalProcesses[index].Tipo_Processo == 'IM-LCL') {
      if (!LCLTotal[totalProcesses[index].Mes - 1]) {
        LCLTotal[totalProcesses[index].Mes - 1] = 0;
      }
      LCLTotal[totalProcesses[index].Mes - 1] = totalProcesses[index].Quantidade_Processos;
    }
    if (totalProcesses[index].Tipo_Processo == 'IA-COURIER') {
      if (!CourierTotal[totalProcesses[index].Mes - 1]) {
        CourierTotal[totalProcesses[index].Mes - 1] = 0;
      }
      CourierTotal[totalProcesses[index].Mes - 1] = totalProcesses[index].Quantidade_Processos;
    }
    if (totalProcesses[index].Tipo_Processo == 'IA-NORMAL') {
      if (!AirTotal[totalProcesses[index].Mes - 1]) {
        AirTotal[totalProcesses[index].Mes - 1] = 0;
      }
      AirTotal[totalProcesses[index].Mes - 1] = totalProcesses[index].Quantidade_Processos;
    }
  }

  for (let index = 0; index < filteredProcesses.length; index++) {
    if (filteredProcesses[index].Tipo_Processo == 'IM-FCL') {
      if (!FCLPart[filteredProcesses[index].Mes - 1]) {
        FCLPart[filteredProcesses[index].Mes - 1] = 0;
      }
      FCLPart[filteredProcesses[index].Mes - 1] = filteredProcesses[index].Total_TEUS;
    }
    if (filteredProcesses[index].Tipo_Processo == 'IM-LCL') {
      if (!LCLPart[filteredProcesses[index].Mes - 1]) {
        LCLPart[filteredProcesses[index].Mes - 1] = 0;
      }
      LCLPart[filteredProcesses[index].Mes - 1] = filteredProcesses[index].Quantidade_Processos;
    }
    if (filteredProcesses[index].Tipo_Processo == 'IA-COURIER') {
      if (!CourierPart[filteredProcesses[index].Mes - 1]) {
        CourierPart[filteredProcesses[index].Mes - 1] = 0;
      }
      CourierPart[filteredProcesses[index].Mes - 1] = filteredProcesses[index].Quantidade_Processos;
    }
    if (filteredProcesses[index].Tipo_Processo == 'IA-NORMAL') {
      if (!AirPart[filteredProcesses[index].Mes - 1]) {
        AirPart[filteredProcesses[index].Mes - 1] = 0;
      }
      AirPart[filteredProcesses[index].Mes - 1] = filteredProcesses[index].Quantidade_Processos;
    }
  }
  createIMChart(FCLTotal, FCLPart, LCLTotal, LCLPart);
  createIAChart(AirTotal, AirPart, CourierTotal, CourierPart);

}

function createTEUsChart() {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'TEUs',
      data: teusArray
    }],
    chart: {
      height: 400,
      width: 600,
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

  var chart = new ApexCharts(document.querySelector('#teus-chart'), chartData);
  chart.render();
}

function createActivityChart(activityArray) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'Clientes Ativos',
      data: activityArray
    }],
    chart: {
      height: 400,
      width: 600,
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

  var chart = new ApexCharts(document.querySelector('#activity-chart'), chartData);
  chart.render();
}

function createProfitChart() {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {
    series: [{
      name: 'Faturamento/Mês',
      data: profitArray
    }],
    chart: {
      height: 400,
      width: 600,
      type: "bar",
      stacked: false,
      toolbar: { show: false },
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
      offsetX: -50,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      },
      formatter: function (value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (value) {
          return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
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
      width: [0, 0],
      curve: "smooth",
    },
    xaxis: {
      categories: months,
      position: "bottom",
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
  };

  var chart = new ApexCharts(document.querySelector('#billing-chart'), chartData);
  chart.render();
}

function createProcessesChart(LCLArray, FCLArray, AirArray, CourierArray) {

  let finalLCL = 0;
  let finalFCL = 0;
  let finalAir = 0;
  let finalCourier = 0;

  for (let index = 0; index < LCLArray.length; index++) {
    finalLCL += LCLArray[index];
  }

  for (let index = 0; index < FCLArray.length; index++) {
    finalFCL += FCLArray[index];
  }

  for (let index = 0; index < AirArray.length; index++) {
    finalAir += AirArray[index];
  }

  for (let index = 0; index < CourierArray.length; index++) {
    finalCourier += CourierArray[index];
  }

  var options = {
    series: [finalLCL, finalFCL, finalAir, finalCourier],
    chart: {
      width: 450,
      type: 'pie',
    },
    labels: ['IM LCL', 'IM FCL', 'IA Padrão', 'IA Expresso'],
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

  let chart = new ApexCharts(document.querySelector("#processes-chart"), options);
  chart.render();
}

function createAssertivityChart() {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var options = {
    series: [{
      name: 'LCL',
      data: LCLArray
    }, {
      name: 'FCL',
      data: FCLArray
    }, {
      name: 'IA',
      data: AirArray
    }],
    chart: {
      type: 'bar',
      height: 300,
      stacked: false,
      toolbar: {
        show: false,
      }
    },
    colors: ["#F9423A", "#D0CFCD", "#781B17"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
        columnWidth: "60%",
      }
    },
    dataLabels: {
      enabled: false,
      formatter: function (value) {
        return value + "%";
      }
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: months,
    },
    tooltip: {
      enabled: true,
      shared: true, // Ativar compartilhamento do tooltip entre todas as séries
      intersect: false, // Permite exibição ao passar sobre qualquer barra
      y: {
        formatter: function (val) {
          return val + "%";
        }
      }
    },
    fill: {
      opacity: 0.80
    },
    legend: {
      show: false
    }
  };

  let chart = new ApexCharts(document.querySelector("#assertiveness-chart"), options);
  chart.render();
}

function createIMChart(FCLTotal, FCLPart, LCLTotal, LCLPart) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var options = {
    series: [
      {
        name: 'FCL - TEUs',
        data: FCLTotal,
        group: 'Grupo 1'
      }, 
      {
        name: 'FCL - TEUs',
        data: FCLPart,
        group: 'Grupo 1'
      },
      {
        name: 'LCL - Processos',
        data: LCLTotal,
        group: 'Grupo 2'
      }, 
      {
        name: 'LCL - Processos',
        data: LCLPart,
        group: 'Grupo 2'
      }
    ],
    chart: {
      type: 'bar',
      height: 400,
      stacked: true,
      toolbar: {
        show: false,
      }
    },
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
        columnWidth: "50%",
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: months
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
    },
    fill: {
      opacity: 0.80
    },
    legend: {
      show: false
    }
  };

  let IMchart = new ApexCharts(document.querySelector("#im-chart"), options);
  IMchart.render();
}

function createIAChart(AirTotal, AirPart, CourierTotal, CourierPart) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var options = {
    series: [
      {
        name: 'Aéreo - TEUs',
        data: AirTotal,
        group: 'Grupo 1'
      }, 
      {
        name: 'Aéreo - TEUs',
        data: AirPart,
        group: 'Grupo 1'
      },
      {
        name: 'Courier - Processos',
        data: CourierTotal,
        group: 'Grupo 2'
      }, 
      {
        name: 'Courier - Processos',
        data: CourierPart,
        group: 'Grupo 2'
      }
    ],
    chart: {
      type: 'bar',
      height: 400,
      stacked: true,
      toolbar: {
        show: false,
      }
    },
    colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 5,
        columnWidth: "50%",
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: months
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
    },
    fill: {
      opacity: 0.80
    },
    legend: {
      show: false
    }
  };

  let IAchart = new ApexCharts(document.querySelector("#ia-chart"), options);
  IAchart.render();
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  await createTEUsArrays();
  await createProcessesArrays();
  await createProfitArray();
  await createAssertivityArrays();
  await createActivityArray();
  await createGoalsArrays();
  createTEUsChart();
  // createProfitChart();
  createAssertivityChart();

  document.querySelector('#loader2').classList.add('d-none')
});