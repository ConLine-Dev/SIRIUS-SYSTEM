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

// Função para receber o id da categoria que esta sendo aberta nesta janela
async function getUrlData() {
   const queryString = window.location.search;
   const urlParams = new URLSearchParams(queryString);
   const id = urlParams.get('id');
   const startDate = urlParams.get('startDate');
   const endDate = urlParams.get('endDate');
   
   return {id, startDate, endDate};
};

// Função Lista de faturas
async function invoicesTable(dataInvoices) {
   // Fazer a requisição à API
   const divlistInvoices = document.getElementById('listInvoices');
   
   let printlistInvoices = '';

   if (dataInvoices.length === 0) {
      // Caso não tenha faturas, exibir uma mensagem ou limpar o conteúdo
      divlistInvoices.innerHTML = '<center>Nenhuma fatura encontrada.</center>';
      return; // Encerra a execução da função
   }

   dataInvoices.sort((a, b) => b.Total_Pagamento_Estimado - a.Total_Pagamento_Estimado)

   for (let i = 0; i < dataInvoices.length; i++) {
      const invoices = dataInvoices[i]     

      const formattedValue = invoices.Total_Pagamento_Estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })       

      const date = await formattedDateTime(invoices.Data);
      const clientName = invoices.Cliente

      printlistInvoices += `
         <a href="javascript:void(0);" class="border-0">
            <div class="list-group-item border-0">
               <div class="d-flex align-items-start">
                     <div class="w-100">
                        <div class="d-flex align-items-top justify-content-between">
                              <div class="mt-0">
                                 <p class="mb-0 fw-semibold"><span class="fs-13 me-3">${clientName}</span>
                                 </p><span class="mb-0 fs-13 text-muted">${invoices.Historico_Resumo} - ${invoices.Situacao_Fatura}</span>
                              </div>
                              <div class="text-muted fs-20 text-center"></div> 
                              <span class="ms-auto"> 
                                 <span class="text-end text-danger d-block fs-15">${formattedValue}</span> 
                                 <span class="text-end text-muted d-block fs-13">${date}</span> 
                              </span>
                        </div>
                     </div>
                  </div>
            </div>
         </a>`
     
   }

   divlistInvoices.innerHTML = printlistInvoices

   const titleCategorie = document.getElementById('title-categorie');
   titleCategorie.textContent = `Categoria: ${dataInvoices[0].Categoria}`;
};

// Função para formatar a data (dia, mês, ano) no gráfico
async function formattedDateTime(time) {
   const date = new Date(time);

   const year = date.getUTCFullYear();
   const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
   const day = String(date.getUTCDate()).padStart(2, '0');

   return `${day}/${month}/${year}`;
};

// Função para calcular os valores do recibo por mês no gráfico
async function paid_for_month(data) {
   const sum_for_month = [];

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const [year, month] = item.Data.split('-').map(Number);
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

// Função para gerar o gráfico
let chart
async function graphic_month(dataAdm) {
   const paid = await paid_for_month(dataAdm)

   const array_paid = new Array(12).fill(0)

   paid.forEach(item => {
      array_paid[item.MONTH -1] = Number(item.PAID.toFixed(2))
   });

   var options = {
      series: [
         {
            name: 'Despesas Adm',
            data: array_paid
         },
      ],

      chart: {
         type: 'bar',
         height: 520,
         stacked: true,
         toolbar: {
            show: false,
         },
      },

      colors: ['#f9423a'],

      plotOptions: {
         bar: {
            borderRadius: 5,
            columnWidth: '60%',
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

async function eventClick() {
   
   //====== FILTRO DE FATURA ======//
      const infoFilter = await getUrlData(); // Pega as informações da URL para fazer o filtro
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
            const listInvoicesByCategorie = await makeRequest(`/api/cash-flow/listInvoiceByCategorie`, 'POST', {startDateGlobal: infoFilter.startDate, endDateGlobal: infoFilter.endDate, situacao: Invoice, idCategorie: infoFilter.id});
            await invoicesTable(listInvoicesByCategorie);
            await graphic_month(listInvoicesByCategorie);

            document.querySelector('#loader1').classList.add('d-none')
         })
         
      });
   //====== / FILTRO DE FATURA ======//
}

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   await checkLoginExpiration()

   setInterval(async () => {
       await checkLoginExpiration()
   }, 1000);

   const StorageGoogle = await getInfosLogin();
   await setInfosLogin(StorageGoogle)

   const infoFilter = await getUrlData(); // Pega as informações da URL para fazer o filtro
   const listInvoicesByCategorie = await makeRequest(`/api/cash-flow/listInvoiceByCategorie`, 'POST', {startDateGlobal: infoFilter.startDate, endDateGlobal: infoFilter.endDate, idCategorie: infoFilter.id});

   await invoicesTable(listInvoicesByCategorie);
   await graphic_month(listInvoicesByCategorie);
   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})