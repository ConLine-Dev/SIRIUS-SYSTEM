// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {
   // Verifica o localStorage para alterar a mensagem de boas vindas
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   if (!localStorage.getItem('StorageGoogle')) {
       window.location.href = '/app/login';
   } else {
       document.querySelector('body').style.display = 'block'
   }



   const loginTime = localStorage.getItem('loginTime');

   if (loginTime) {
       const currentTime = new Date().getTime();
       const elapsedTime = currentTime - parseInt(loginTime);
   
       // 24 horas em milissegundos
       const twentyFourHours = 1000;

       if (elapsedTime >= twentyFourHours) {
           // Limpa os dados do usuário e redireciona para a página de login
           localStorage.removeItem('StorageGoogle');
           localStorage.removeItem('loginTime');
           window.location.href = '/app/login';
       }
   }
}

// Verifica o localStorage para setar informações
async function getInfosLogin() {
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   return StorageGoogle;
}

// Verifica o localStorage para setar informações
async function setInfosLogin(StorageGoogle) {
   document.querySelectorAll('.imgUser').forEach(element => {
       element.src = StorageGoogle.picture ? StorageGoogle.picture : StorageGoogle.system_image
   });

   document.querySelectorAll('.UserName').forEach(element => {
       element.textContent = StorageGoogle.given_name.replace(/[^a-zA-Z\s]/g, '');
   });

   document.querySelectorAll('.buttonLogout').forEach(element => {
       element.addEventListener('click', function (e) {
               e.preventDefault()
       
               localStorage.removeItem('StorageGoogle');
               localStorage.removeItem('loginTime');
       
               window.location.href = '/app/login'
       })

   });


}

// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
let startDateGlobal, endDateGlobal;

// Função para calcular o valor total dos cards
async function totalCard(dataOperation, dataAdm) {
   const totalRevenue = document.querySelector('.total-revenue')
   const totalExpenses = document.querySelector('.total-expenses')
   const totalExpensesAdm = document.querySelector('.total-expenses-adm')
   const totalProfit = document.querySelector('.total-profit')

   let reveneu = 0;
   let expenses = 0;
   let expensesAdm = 0;
   let profit = 0;

   for (let i = 0; i < dataOperation.length; i++) {
      const item = dataOperation[i];

      reveneu += item.Total_Recebimento_Estimado;
      expenses += item.Total_Pagamento_Estimado;
      profit += item.Lucro_Estimado;
   }

   for (let i = 0; i < dataAdm.length; i++) {
      const item = dataAdm[i];

      expensesAdm += item.Total_Pagamento_Estimado;
   }

   profit = reveneu - expenses - expensesAdm; // Calcula o profit, que seria tudo o que recebemos, menos as despesas de processo, menos as despesas adm

   reveneu = reveneu.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
   expenses = expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
   expensesAdm = expensesAdm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
   profit = profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

   totalRevenue.textContent = reveneu;
   totalExpenses.textContent = expenses;
   totalExpensesAdm.textContent = expensesAdm;
   totalProfit.textContent = profit;
};

// Função para calcular os valores do recibo por mês no gráfico
async function received_for_month(data) {
   const sum_for_month = [];

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const [year, month] = item.Data_Abertura_Processo.split('-').map(Number);
      const received = item.Total_Recebimento_Estimado;

      const existing_month_year = sum_for_month.find(ma => ma.YEAR === year && ma.MONTH === month); // Encontra o mês e ano na consulta do banco e salva na variável

      if (existing_month_year) {
         existing_month_year.RECEIVED += received; // Se o mês e o ano existirem na variável, ele concatena o novo valor localizado
      } else {
         sum_for_month.push({
            YEAR: year,
            MONTH: month,
            RECEIVED: received
         });
      }
   }

   sum_for_month.sort((a, b) => a.YEAR - b.YEAR || a.MONTH - b.MONTH); // Ordena os meses e anos em ordem crescente
   return sum_for_month;
};

// Função para calcular os valores do recibo por mês no gráfico
async function paid_for_month(data) {
   const sum_for_month = [];

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const [year, month] = item.Data_Abertura_Processo.split('-').map(Number);
      const paid = item.Total_Pagamento_Estimado;

      const existing_month_year = sum_for_month.find(ma => ma.YEAR === year && ma.MONTH === month); // Encontra o mês e ano na consulta do banco e salva na variável

      if (existing_month_year) {
         existing_month_year.PAID += paid; // Se o mês e o ano existirem na variável, ele concatena o novo valor localizado
      } else {
         sum_for_month.push({
            YEAR: year,
            MONTH: month,
            PAID: paid
         });
      }
   }

   sum_for_month.sort((a, b) => a.YEAR - b.YEAR || a.MONTH - b.MONTH); // Ordena os meses e anos em ordem crescente
   return sum_for_month;
};

// Função para calcular os valores do recibo por mês no gráfico
async function paid_adm_for_month(data) {
   const sum_for_month = [];

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const [year, month] = item.Data.split('-').map(Number);
      const paid_adm = item.Total_Pagamento_Estimado;

      const existing_month_year = sum_for_month.find(ma => ma.YEAR === year && ma.MONTH === month); // Encontra o mês e ano na consulta do banco e salva na variável

      if (existing_month_year) {
         existing_month_year.PAID_ADM += paid_adm; // Se o mês e o ano existirem na variável, ele concatena o novo valor localizado
      } else {
         sum_for_month.push({
            YEAR: year,
            MONTH: month,
            PAID_ADM: paid_adm
         });
      }
   }

   sum_for_month.sort((a, b) => a.YEAR - b.YEAR || a.MONTH - b.MONTH); // Ordena os meses e anos em ordem crescente
   return sum_for_month;
};

// Retornar um array com o lucro de cada mês e ano
async function profit_for_month(dataOperation, dataAdm) {
   // Obter os arrays de pagamentos e recebimentos
   const received = await received_for_month(dataOperation);
   const paid = await paid_for_month(dataOperation);
   const paid_adm = await paid_adm_for_month(dataAdm);

   const profit = [];

   // Juntar os dados de pagamento e recebimento em um único array
   const combined_data = {};

   paid.forEach(item => {
      const key = `${item.YEAR}-${item.MONTH}`;
      if (!combined_data[key]) {
         combined_data[key] = { YEAR: item.YEAR, MONTH: item.MONTH, PAID: 0, PAID_ADM: 0, RECEIVED: 0 };
      }
      combined_data[key].PAID = item.PAID;
   });

   paid_adm.forEach(item => {
      const key = `${item.YEAR}-${item.MONTH}`;
      if (!combined_data[key]) {
         combined_data[key] = { YEAR: item.YEAR, MONTH: item.MONTH, PAID: 0, PAID_ADM: 0, RECEIVED: 0 };
      }
      combined_data[key].PAID_ADM = item.PAID_ADM;
   });

   received.forEach(item => {
      const key = `${item.YEAR}-${item.MONTH}`;
      if (!combined_data[key]) {
         combined_data[key] = { YEAR: item.YEAR, MONTH: item.MONTH, PAID: 0, PAID_ADM: 0, RECEIVED: 0 };
      }
      combined_data[key].RECEIVED = item.RECEIVED;
   });

   // Calcular o lucro para cada mês e ano
   for (const key in combined_data) {
      const { YEAR, MONTH, PAID, PAID_ADM, RECEIVED } = combined_data[key];
      profit.push({
         YEAR,
         MONTH,
         PROFIT: RECEIVED - PAID - PAID_ADM
      });
   }

   // Ordenar o resultado por ano e mês
   profit.sort((a, b) => a.YEAR - b.YEAR || a.MONTH - b.MONTH);

   return profit;
};

// Função para gerar o gráfico
let chart
async function graphic_month(dataOperation, dataAdm) {
   const received = await received_for_month(dataOperation)
   const paid = await paid_for_month(dataOperation)
   const paid_adm = await paid_adm_for_month(dataAdm)
   const profit = await profit_for_month(dataOperation, dataAdm)

   const array_received = new Array(12).fill(0)
   const array_paid = new Array(12).fill(0)
   const array_paid_adm = new Array(12).fill(0)
   const array_profit = new Array(12).fill(0)

   received.forEach(item => {
      array_received[item.MONTH -1] = Number(item.RECEIVED.toFixed(2))
   });

   paid.forEach(item => {
      array_paid[item.MONTH -1] = Number(item.PAID.toFixed(2))
   });

   paid_adm.forEach(item => {
      array_paid_adm[item.MONTH -1] = Number(item.PAID_ADM.toFixed(2))
   });

   profit.forEach(item => {
      array_profit[item.MONTH -1] = Number(item.PROFIT.toFixed(2))
   });

   var options = {
      series: [
         {
            name: 'Receita Op',
            group: 'receita',
            data: array_received
         },
         {
            name: 'Despesas Op',
            group: 'despesas',
            data: array_paid
         },
         {
            name: 'Despesas Adm',
            group: 'despesas',
            data: array_paid_adm
         },
         {
            name: 'Lucro',
            group: 'profit',
            data: array_profit
         },
      ],

      chart: {
         type: 'bar',
         height: 555,
         stacked: true,
         toolbar: {
            show: false,
         },
      },

      colors: ['#26bf94','#f5b849','#f9423a','#8920ad'],

      plotOptions: {
         bar: {
            borderRadius: 3,
            columnWidth: '85%',
            horizontal: false,
            dataLabels: {
               position: 'top',
            },
         }
      },

      dataLabels: {
         enabled: false,
      },

      stroke: {
         show: true,
         width: 1,
         colors: ['#fff']
      },

      tooltip: {
         shared: true,
         enabled: true,
         intersect: false,
         y: {
            formatter: function (val) {
               return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
         }
      },

      xaxis: {
         categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
         labels: {
            show: true,
         }
      },

      yaxis: {
         show: false,
      },
   };

   // Verifique se o gráfico já existe
   if (chart) {
      // Se existir, atualize os dados e renderize novamente
      chart.updateOptions(options);
   } else {
      // Se não existir, crie um novo gráfico
      chart = new ApexCharts(document.querySelector("#cash-flow-chart"), options);
      chart.render();
   }
};

async function total_for_categories(data) {
   const results_for_categories = {};

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      const id_categorie = item.IdCategoria_Financeira;
      const categorie = item.Categoria;
      const paid = item.Total_Pagamento_Estimado;

      if (results_for_categories[id_categorie]) {
         results_for_categories[id_categorie].paid += paid;
      } else {
         results_for_categories[id_categorie] = {
            id_categorie: id_categorie,
            categorie: categorie,
            paid: paid
         }
      }
   }

   const array_categories = Object.values(results_for_categories)

   array_categories.sort((a, b) => b.paid - a.paid)

   // Fazer a requisição à API
   const divlistInvoices = document.getElementById('listInvoices');
   let printlistInvoices = '';

   for (let i = 0; i < array_categories.length; i++) {       

      const formattedValue = array_categories[i].paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

      printlistInvoices += `
         <a href="javascript:void(0);" class="border-0">
            <div class="list-group-item border-0 categories" style="padding: 0.5rem 0.75rem !important;">
               <div class="d-flex align-items-start">
                     <div class="w-100">
                        <div class="d-flex align-items-top justify-content-between">
                              <div class="mt-0">
                                 <p class="mb-0 fw-semibold"><span class="fs-13 me-3">${array_categories[i].categorie}</span>
                              </div>
                              <div class="text-muted fs-20 text-center"></div> 
                              <span class="ms-auto"> 
                                 <span class="text-end text-danger d-block fs-15">${formattedValue}</span> 
                              </span>
                        </div>
                     </div>
                  </div>
            </div>
         </a>`
     
   }

   divlistInvoices.innerHTML = printlistInvoices
};

// Função para formatar a data (dia, mês, ano) no gráfico
async function formattedDateTime(time) {
   const date = new Date(time);

   const year = date.getUTCFullYear();
   const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
   const day = String(date.getUTCDate()).padStart(2, '0');

   return `${day}/${month}/${year}`;
};

// Inicializa o seletor de data (Filtro)
async function initializeDatePicker() {
   const today = new Date();
   const startOfYear = new Date(today.getFullYear(), 0, 1); // 1° de Janeiro do ano atual

   flatpickr("#inputDateFilter", {
       mode: "range",
       dateFormat: "d M Y",
       defaultDate: [startOfYear, today], // Defini o intervalo de data
   });
};

// Função do Filtro
async function eventClick() {
   //====== BOTÃO DE FILTRO ======//
      const inputDateFilter = document.getElementById('inputDateFilter');
      const btn_filter = document.getElementById('btn-filter');
      btn_filter.addEventListener('click', async function (e) {
         e.preventDefault();
         // Obtém o valor do input
         const dateRange = inputDateFilter.value;
         // Divide o valor em duas data separadas
         const [startDateStr, endDateStr] = dateRange.split(' até ');
         // Função para converter uma data "01 jan 2024" para "2024-01-01"
         const formatDate = (dateStr) => {
            if (!dateStr) {
                  return false
            } else {
                  const [day, month, year] = dateStr.split(' ');
                  const month_map = {
                     'Jan': '01',
                     'Fev': '02',
                     'Mar': '03',
                     'Abr': '04',
                     'Mai': '05',
                     'Jun': '06',
                     'Jul': '07',
                     'Ago': '08',
                     'Set': '09',
                     'Out': '10',
                     'Nov': '11',
                     'Dez': '12',
                  };

                  return `${year}-${month_map[month]}-${day.padStart(2, 0)}`
            }
         };

         startDateGlobal = formatDate(startDateStr);
         endDateGlobal = formatDate(endDateStr);
         const invoiceActive = document.querySelector('.InvoiceActive').getAttribute('invoicesTable');

         // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
         document.querySelector('#loader2').classList.remove('d-none')

         const totalOperation = await makeRequest(`/api/cash-flow/totalOperation`, 'POST', {startDateGlobal, endDateGlobal});
         const totalAdm = await makeRequest(`/api/cash-flow/totalAdm`, 'POST', {startDateGlobal, endDateGlobal, situacao: invoiceActive});
         
         await totalCard(totalOperation, totalAdm);
         await profit_for_month(totalOperation, totalAdm);
         await graphic_month(totalOperation, totalAdm);
         await invoicesTable(totalAdm);

         // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
         document.querySelector('#loader2').classList.add('d-none')
      })
   //====== / BOTÃO DE FILTRO ======//


   //====== FILTRO DE FATURA ======//
      const nameInvoices = document.querySelectorAll('[invoicesTable]')
      nameInvoices.forEach(item => {
         item.addEventListener('click', async function(e){
            e.preventDefault()

            // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
            document.querySelector('#loader1').classList.remove('d-none')

            const invoiceActive = document.querySelector('.invoiceActive')
            invoiceActive.classList.remove('invoiceActive')
            this.classList.add('invoiceActive')
            const Invoice = this.getAttribute('invoicesTable')
            const totalInvoices = await makeRequest(`/api/cash-flow/totalAdm`, 'POST', {startDateGlobal, endDateGlobal, situacao: Invoice});
            await invoicesTable(totalInvoices);

            document.querySelector('#loader1').classList.add('d-none')
         })
         
      });
   //====== / FILTRO DE FATURA ======//
};

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   await checkLoginExpiration()

   setInterval(async () => {
       await checkLoginExpiration()
   }, 1000);

   const StorageGoogle = await getInfosLogin();
   await setInfosLogin(StorageGoogle)

   const totalOperation = await makeRequest(`/api/cash-flow/totalOperation`, 'POST');
   const totalAdm = await makeRequest(`/api/cash-flow/totalAdm`, 'POST');
   
   await totalCard(totalOperation, totalAdm);
   await profit_for_month(totalOperation, totalAdm);
   await graphic_month(totalOperation, totalAdm);
   await total_for_categories(totalAdm);

   await initializeDatePicker();
   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})