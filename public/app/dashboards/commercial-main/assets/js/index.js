let teusArray = [];
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

async function createProcessesArrays() {

  let userData = getInfosLogin();
  let userId = userData.system_id_headcargo;
  let processes = await makeRequest(`/api/commercial-main/countProcesses`, 'POST', {userId});

  for (let index = 0; index < processes.length; index++) {
    if (processes[index].Tipo_Processo == 'IA-COURIER') {
      if (!CourierArray[processes[index].Mes - 1]) {
        CourierArray[processes[index].Mes - 1] = processes[index].Quantidade;
      } else {
        CourierArray[processes[index].Mes - 1] += processes[index].Quantidade;
      }
    }
    if (processes[index].Tipo_Processo == 'IA-NORMAL') {
      if (!AirArray[processes[index].Mes - 1]) {
        AirArray[processes[index].Mes - 1] = processes[index].Quantidade;
      } else {
        AirArray[processes[index].Mes - 1] += processes[index].Quantidade;
      }
    }
    if (processes[index].Tipo_Processo == 'IM-FCL') {
      if (!FCLArray[processes[index].Mes - 1]) {
        FCLArray[processes[index].Mes - 1] = processes[index].Quantidade;
      } else {
        FCLArray[processes[index].Mes - 1] += processes[index].Quantidade;
      }
    }
    if (processes[index].Tipo_Processo == 'IM-LCL') {
      if (!LCLArray[processes[index].Mes - 1]) {
        LCLArray[processes[index].Mes - 1] = processes[index].Quantidade;
      } else {
        LCLArray[processes[index].Mes - 1] += processes[index].Quantidade;
      }
    }
  }
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

async function createAssertivityArrays(userId) {

  let offersByUser = await makeRequest(`/api/commercial-main/getOffers`, 'POST', {userId});

  let actualMonth = new Date().getMonth();

  for (let index = 0; index < actualMonth.length; index++) {
    LCLArray[index] = 0;
    AirArray[index] = 0;
    FCLArray[index] = 0;
  }

  for (let index = 0; index < offersByUser.length; index++) {
    if (offersByUser[index].Tipo_Carga == 'FCL') {
      FCLArray[offersByUser[index].Mes - 1] = offersByUser[index].Total_Aprovada/(offersByUser[index].Total_Reprovada + offersByUser[index].Total_Pendente)*100;
      FCLArray[offersByUser[index].Mes - 1] = FCLArray[offersByUser[index].Mes - 1].toFixed(2);
    }
    if (offersByUser[index].Tipo_Carga == 'LCL') {
      LCLArray[offersByUser[index].Mes - 1] = offersByUser[index].Total_Aprovada/(offersByUser[index].Total_Reprovada + offersByUser[index].Total_Pendente)*100;
      LCLArray[offersByUser[index].Mes - 1] = LCLArray[offersByUser[index].Mes - 1].toFixed(2);
    }
    if (offersByUser[index].Tipo_Carga == 'Aéreo') {
      AirArray[offersByUser[index].Mes - 1] = offersByUser[index].Total_Aprovada/(offersByUser[index].Total_Reprovada + offersByUser[index].Total_Pendente)*100;
      AirArray[offersByUser[index].Mes - 1] = AirArray[offersByUser[index].Mes - 1].toFixed(2);
    }
  }
}

function createTEUsChart() {

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var chartData = {

    series: [{
      name: 'TEUs',
      data: teusArray
    }],
    chart: {
      height: 780,
      width: 425,
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

  var chart = new ApexCharts(document.querySelector('#teus-chart'), chartData);
  chart.render();
}

function createProfitChart() {

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  var chartData = {

    series: [{
      name: 'Faturamento/Mês',
      data: profitArray
    }],
    chart: {
      height: 780,
      width: 425,
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
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  var chart = new ApexCharts(document.querySelector('#billing-chart'), chartData);
  chart.render();
}

function createProcessesChart() {

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var options = {
    series: [{
    name: 'IA EXPRESSO',
    data: CourierArray
  }, {
    name: 'IA PADRÃO',
    data: AirArray
  }, {
    name: 'IM FCL',
    data: FCLArray
  }, {
    name: 'IM LCL',
    data: LCLArray
  }],
    chart: {
    type: 'bar',
    height: 780,
    stacked: true,
    stackType: '100%',
    toolbar: {
      show: false,
    }
  },
  colors: ["#F9423A", "#D0CFCD", "#781B17", "#AD6663"],
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  stroke: {
    width: 1,
    colors: ['#fff']
  },
  xaxis: {
    categories: months,
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return val + " processos"
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

  let chart = new ApexCharts(document.querySelector("#processes-chart"), options);
  chart.render();
}

function createAssertivityChart() {

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var options = {
    series: [{
    name: 'IA',
    data: AirArray
  }, {
    name: 'FCL',
    data: FCLArray
  }, {
    name: 'LCL',
    data: LCLArray
  }],
    chart: {
    type: 'bar',
    height: 780,
    stacked: true,
    toolbar: {
      show: false,
    }
  },
  colors: ["#F9423A", "#D0CFCD", "#781B17"],
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '12px',
      colors: ['#fff']
    },
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
    y: {
      formatter: function (val) {
        return val + "%"
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

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  getInfosLogin()
  await createTEUsArrays();
  await createProcessesArrays();
  await createProfitArray();
  await createAssertivityArrays();
  createTEUsChart();
  createProcessesChart();
  createProfitChart();
  createAssertivityChart();

  document.querySelector('#loader2').classList.add('d-none')
});