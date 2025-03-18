let teusChart, billingChart, processesChart, assertivityChart;

function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
}

async function reloadCharts(id_headcargo) {
  document.querySelector('#loader2').classList.remove('d-none');
  document.querySelector('#salesMenu').classList.add('d-none');
  await createTEUsArrays(id_headcargo);
  await createProfitArray(id_headcargo);
  await createProcessesArrays(id_headcargo);
  await createAssertivityArrays(id_headcargo);
  document.querySelector('#loader2').classList.add('d-none');
}

function openSalesList() {
  document.querySelector('#salesMenu').classList.remove('d-none');
}

async function createFilters() {
  let divCommercialList = document.getElementById('commercialList');
  let getCommercials = await makeRequest(`/api/commercial-adm/getCommercials`);

  let printCommercialList = ''

  console.time('timer')
  for (let index = 0; index < getCommercials.length; index++) {

    let userId = getCommercials[index].id_headcargo;
    let getByCommercial = await makeRequest(`/api/commercial-adm/getByCommercial`, 'POST', {userId});

    let value = getByCommercial[0].Total_Valor;
    value = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let assertiveness = 0;
    if ((getByCommercial[0].Total_Aprovada + getByCommercial[0].Total_Reprovada + getByCommercial[0].Total_Pendente) > 0) {
      assertiveness = getByCommercial[0].Total_Aprovada / (getByCommercial[0].Total_Reprovada + getByCommercial[0].Total_Pendente) * 100;
    }
    assertiveness = assertiveness.toFixed(2);

    printCommercialList += `
      <div class="col-xl-3 d-flex" id="${getCommercials[index].id_headcargo}" onclick="reloadCharts(this.id);">
          <div class="card custom-card flex-fill">
              <div class="card-header justify-content-between">
                  <div class="d-flex row" style="width: 100%;">
                    <div class="col-2">
                      <span class="avatar avatar-rounded btnSelectTI" data-headcargoid="${getCommercials[index].id_headcargo}">
                        <img src="https://cdn.conlinebr.com.br/colaboradores/${getCommercials[index].id_headcargo}" alt="img">
                      </span>
                    </div>
                    <div class="col-10 d-flex" style="flex-direction: column;">
                      <h6>${getCommercials[index].name} ${getCommercials[index].family_name}</h6>
                      <label>${getByCommercial[0].Quantidade} Processos no ano</label>
                    </div>
                  </div>
              </div>
              <div class="card-body row d-flex" style="justify-content: space-evenly;">
                  <div class="col-4 details">
                      <div>Faturamento</div>
                      <div>${value}</div>
                  </div>
                  <div class="col-4 details">
                      <div>TEUs</div>
                      <div>${getByCommercial[0].Teus}</div>
                  </div>
                  <div class="col-4 details">
                      <div>Assertividade</div>
                      <div>${assertiveness}%</div>
                  </div>
              </div>
          </div>
      </div>`
  }
  console.timeEnd('timer')
  divCommercialList.innerHTML = printCommercialList;
}

async function createArrays(item) {
  document.querySelector('#loader2').classList.remove('d-none')
  await createTEUsArrays(item.id_headcargo);
  await createProfitArray(item.id_headcargo);
  await createProcessesArrays(item.id_headcargo);
  await createAssertivityArrays(item.id_headcargo);
  document.querySelector('#loader2').classList.add('d-none')
}

async function createTEUsArrays(userId) {

  let processes = await makeRequest(`/api/commercial-adm/listAllProcesses`, 'POST', {userId});
  let teusArray = [];
  let actualMonth = new Date().getMonth();

  for (let index = 0; index <= actualMonth; index++) {
    teusArray[index] = 0;
  }

  for (let index = 0; index < processes.length; index++) {
    if (!teusArray[processes[index].Mes - 1]) {
      teusArray[processes[index].Mes - 1] = 0.0;
    }
    teusArray[processes[index].Mes - 1] += processes[index].Teus;
  }
  createTEUsChart(teusArray);
}

async function createProcessesArrays(userId) {

  let processes = await makeRequest(`/api/commercial-adm/countProcesses`, 'POST', { userId });
  let FCLArray = [];
  let LCLArray = [];
  let AirArray = [];
  let CourierArray = [];
  let actualMonth = new Date().getMonth();

  for (let index = 0; index <= actualMonth; index++) {
    FCLArray[index] = 0;
    LCLArray[index] = 0;
    AirArray[index] = 0;
    CourierArray[index] = 0;
  }

  for (let index = 0; index < processes.length; index++) {
    if (processes[index].Tipo_Processo == 'IA-COURIER') {
      if (!CourierArray[processes[index].Mes - 1]) {
        CourierArray[processes[index].Mes - 1] = 0;
      }
      CourierArray[processes[index].Mes - 1] += processes[index].Quantidade;
    }
    if (processes[index].Tipo_Processo == 'IA-NORMAL') {
      if (!AirArray[processes[index].Mes - 1]) {
        AirArray[processes[index].Mes - 1] = 0;
      }
      AirArray[processes[index].Mes - 1] += processes[index].Quantidade;
    }
    if (processes[index].Tipo_Processo == 'IM-FCL') {
      if (!FCLArray[processes[index].Mes - 1]) {
        FCLArray[processes[index].Mes - 1] = 0;
      }
      FCLArray[processes[index].Mes - 1] += processes[index].Quantidade;
    }
    if (processes[index].Tipo_Processo == 'IM-LCL') {
      if (!LCLArray[processes[index].Mes - 1]) {
        LCLArray[processes[index].Mes - 1] = 0;
      }
      LCLArray[processes[index].Mes - 1] += processes[index].Quantidade;
    }
  }
  createProcessesChart(CourierArray, AirArray, FCLArray, LCLArray);
}

async function createProfitArray(userId) {

  let profitByUser = await makeRequest(`/api/commercial-adm/profitByUser`, 'POST', {userId});
  let profitArray = [];
  let actualMonth = new Date().getMonth();

  for (let index = 0; index <= actualMonth; index++) {
    profitArray[index] = 0;
  }

  for (let index = 0; index < profitByUser.length; index++) {
    if (!profitArray[profitByUser[index].Mes-1]){
      profitArray[profitByUser[index].Mes-1] = 0;
    }
    profitArray[profitByUser[index].Mes-1] += profitByUser[index].Total_Valor;
  }

  createProfitChart(profitArray);
}

async function createAssertivityArrays(userId) {

  let offersByUser = await makeRequest(`/api/commercial-adm/getOffers`, 'POST', {userId});

  let LCLArray = [];
  let AirArray = [];
  let FCLArray = [];
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

  createAssertivityChart(AirArray, FCLArray, LCLArray);
}

function createTEUsChart(teusArray) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (teusChart) {
    teusChart.destroy();
  }

  var chartData = {

    series: [{
      name: 'TEUs',
      data: teusArray
    }],
    chart: {
      height: 400,
      width: 920,
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

  teusChart = new ApexCharts(document.querySelector('#teus-chart'), chartData);
  teusChart.render();
}

function createProfitChart(profitArray) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (billingChart) {
    billingChart.destroy();
  }

  var chartData = {
    series: [{
      name: 'Faturamento/Mês',
      data: profitArray
    }],
    chart: {
      height: 400,
      width: 920,
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

  billingChart = new ApexCharts(document.querySelector('#billing-chart'), chartData);
  billingChart.render();
}

function createProcessesChart(CourierArray, AirArray, FCLArray, LCLArray) {

  if (processesChart) {
    processesChart.destroy();
  }

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

  processesChart = new ApexCharts(document.querySelector("#processes-chart"), options);
  processesChart.render();
}

function createAssertivityChart(AirArray, FCLArray, LCLArray) {

  let months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (assertivityChart) {
    assertivityChart.destroy();
  }

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

  assertivityChart = new ApexCharts(document.querySelector("#assertiveness-chart"), options);
  assertivityChart.render();
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  await createFilters();
  await createTEUsArrays(0);
  await createProfitArray(0);
  await createProcessesArrays(0);
  await createAssertivityArrays(0);

  // document.querySelector('#salesMenu').classList.add('d-none')
  document.querySelector('#loader2').classList.add('d-none')
});