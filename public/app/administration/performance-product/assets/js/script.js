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


// Variaveis globais para receber as datas do filtro de datas
let startDateGlobal, endDateGlobal, filterType;

// Função que cria o select para selecionar o tipo de carga
let selectClient;
async function createSelectClient(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: `${element.IdPessoa}`,
         label: `${element.Nome}`,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectClient) {
      selectClient.destroy();
   }

   // renderiza o select com as opções formatadas
   selectClient = new Choices('#selectClient', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para pegar as opções selecionadas do Select Situacao Agenciamento
async function getSelectClient() {
   if (selectClient && selectClient.getValue(true).length === 0) {
      return undefined;
   } else {
      // Usar o método getValue() para pegar os valores selecionados
      const selectedValues = selectClient.getValue(true);
      // Transformar o array em uma string com os valores entre parênteses e separados por virgula
      const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
      return formattedValues;
   }
};

// Função que cria o select para selecionar a situacao do agenciamento
let selectAgencySituation;
async function createSelectAgencySituation() {
   // Defina os dados manualmente
   const data = [
      { id: 1, name: 'Processo aberto' },
      { id: 2, name: 'Em andamento' },
      { id: 3, name: 'Liberado faturamento' },
      { id: 4, name: 'Faturado' },
      { id: 5, name: 'Finalizado' },
      { id: 6, name: 'Auditado' },
      { id: 7, name: 'Cancelado' }
   ];

   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: `${element.id}`,
         label: `${element.name}`,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectAgencySituation) {
      selectAgencySituation.destroy();
   }

   // renderiza o select com as opções formatadas
   selectAgencySituation = new Choices('#selectAgencySituation', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para pegar as opções selecionadas do Select Situacao Agenciamento
async function getSelectAgencySituation() {
   if (selectAgencySituation && selectAgencySituation.getValue(true).length === 0) {
      return undefined;
   } else {
      // Usar o método getValue() para pegar os valores selecionados
      const selectedValues = selectAgencySituation.getValue(true);
      // Transformar o array em uma string com os valores entre parênteses e separados por virgula
      const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
      return formattedValues;
   }
};

// Função que cria o select para selecionar a modalidade
let selectModal;
async function createSelectModal() {
   // Defina os dados manualmente
   const data = [
      { id: "'IM'", name: 'Importação Marítima' },
      { id: "'EM'", name: 'Exportação Marítima' },
      { id: "'IA'", name: 'Importação Aérea' },
      { id: "'EA'", name: 'Exportação Aérea' },
      { id: "'OUTROS'", name: 'Outros' },
   ];

   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: `${element.id}`,
         label: `${element.name}`,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectModal) {
      selectModal.destroy();
   }

   // renderiza o select com as opções formatadas
   selectModal = new Choices('#selectModal', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para pegar as opções selecionadas do Select modal
async function getSelectModal() {
   if (selectModal && selectModal.getValue(true).length === 0) {
      return undefined;
   } else {
      // Usar o método getValue() para pegar os valores selecionados
      const selectedValues = selectModal.getValue(true);
      // Transformar o array em uma string com os valores entre parênteses e separados por virgula
      const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
      return formattedValues;
   }
};

// Função que cria o select para selecionar o tipo de carga
let selectTypeLoad;
async function createSelectTypeLoad() {
   // Defina os dados manualmente
   const data = [
      { id: 0, name: 'Não especificado' },
      { id: 1, name: 'Aéreo' },
      { id: 2, name: 'Break-Bulk' },
      { id: 3, name: 'FCL' },
      { id: 4, name: 'LCL' },
      { id: 5, name: 'RO-RO' },
      { id: 6, name: 'Rodoviário' },
   ];

   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: `${element.id}`,
         label: `${element.name}`,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectTypeLoad) {
      selectTypeLoad.destroy();
   }

   // renderiza o select com as opções formatadas
   selectTypeLoad = new Choices('#selectTypeLoad', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para pegar as opções selecionadas do Select tipo de carga
async function getSelectTypeLoad() {
   if (selectTypeLoad && selectTypeLoad.getValue(true).length === 0) {
      return undefined;
   } else {
      // Usar o método getValue() para pegar os valores selecionados
      const selectedValues = selectTypeLoad.getValue(true);
      // Transformar o array em uma string com os valores entre parênteses e separados por virgula
      const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
      return formattedValues;
   }
};

// Função para calcular o Lucro dos processos
async function profit(data) {
   const total_received = data.reduce((acumulator, element) => {
      return acumulator + element.Lucro_Estimado
   }, 0);

   const text_received = document.getElementById('text-profit');
   text_received.textContent = `${total_received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}`

   return total_received;
};

// Função para calcular o total de teus dos processos
async function total_teus(data) {
   const total_teus = data.reduce((acumulator, element) => {
      return acumulator + element.Total_Teus;
   }, 0);

   // Formata o número com separadores de milhar
   const formatted_teus = total_teus.toLocaleString('pt-BR');

   const text_total_teus = document.getElementById('text-total-teus');
   text_total_teus.textContent = formatted_teus;

   return text_total_teus;
};

// Função para calcular o total de toneladas dos processos
async function total_tons(data) {
   const total_tons = data.reduce((acumulator, element) => {
      return acumulator + element.Tons;
   }, 0);

   // Formata o número com separadores de milhar
   const formatted_tons = total_tons.toLocaleString('pt-BR');

   const text_total_tons = document.getElementById('text-total-tons');
   text_total_tons.textContent = formatted_tons;

   return text_total_tons;
};

// Função para calcular o total de processos
async function total_process(data) {
   const total_process = data.length;

   // Formata o número com separadores de milhar
   const formatted_process = total_process.toLocaleString('pt-BR');

   const text_total_process = document.getElementById('text-total-process');
   text_total_process.textContent = formatted_process;

   return text_total_process;
};

async function average_profit_process(data) {
   const total_received = data.reduce((acumulator, element) => {
      return acumulator + element.Lucro_Estimado
   }, 0);
   
   const total_process = data.length || 0;

   const average_profit = total_process > 0 ? (total_received / total_process) : 0;

   const text_average_profit = document.getElementById('text-profit-process');
   text_average_profit.textContent = `${average_profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}`;

   return average_profit;
}

// Retornar um array com o recebimento de cada mês e ano
async function received_for_month(data) {
   const sum_for_month = [];

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const [year, month] = (filterType === 1 ? item.Data_Abertura_Processo : item.Data_Abertura_Processo).split('-').map(Number);
      const received = item.Total_Recebimento;

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

// Retornar um array com o pagamento de cada mês e ano
async function paid_for_month(data) {
   const sum_for_month = [];

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const [year, month] = (filterType === 1 ? item.Data_Abertura_Processo : item.Data_Abertura_Processo).split('-').map(Number);
      const paid = item.Total_Pagamento;

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

// Retornar um array com o pagamento de cada mês e ano
async function profit_for_month(data) {
   const sum_for_month = [];

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const [year, month] = (filterType === 1 ? item.Data_Abertura_Processo : item.Data_Abertura_Processo).split('-').map(Number);
      const profit = item.Lucro_Estimado;

      const existing_month_year = sum_for_month.find(ma => ma.YEAR === year && ma.MONTH === month); // Encontra o mês e ano na consulta do banco e salva na variável

      if (existing_month_year) {
         existing_month_year.PROFIT += profit; // Se o mês e o ano existirem na variável, ele concatena o novo valor localizado
      } else {
         sum_for_month.push({
            YEAR: year,
            MONTH: month,
            PROFIT: profit
         });
      }
   }

   sum_for_month.sort((a, b) => a.YEAR - b.YEAR || a.MONTH - b.MONTH); // Ordena os meses e anos em ordem crescente
   return sum_for_month;
};

// Função para exportar dados para XLS
function exportToXLS(data) {
   // Cria uma nova planilha
   const worksheet = XLSX.utils.aoa_to_sheet(data);

   // Aplica formatação de moeda às colunas B, C e D (Receita, Despesas e Lucro)
   const range = XLSX.utils.decode_range(worksheet['!ref']);
   for (let C = 1; C <= 3; ++C) {
      for (let R = 1; R <= range.e.r; ++R) {
         const cell_address = { c: C, r: R };
         const cell_ref = XLSX.utils.encode_cell(cell_address);
         if (!worksheet[cell_ref]) continue;
         worksheet[cell_ref].z = '#,##0.00';
      }
   }

   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

   // Converte o livro em um arquivo binário
   const binaryData = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

   // Cria um Blob a partir do arquivo binário
   const blob = new Blob([s2ab(binaryData)], { type: "application/octet-stream" });

   // Faz o download do arquivo
   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = 'Performance por Produto.xlsx';
   link.click();
};
// Função auxiliar para converter a string binária em array buffer
function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
};
function prepareAndExportData(received, paid, profit) {
   var data = [
      ['Mês', 'Receita', 'Despesas', 'Lucro'],
      ['Jan', received[0], -paid[0], profit[0]],
      ['Fev', received[1], -paid[1], profit[1]],
      ['Mar', received[2], -paid[2], profit[2]],
      ['Abr', received[3], -paid[3], profit[3]],
      ['Mai', received[4], -paid[4], profit[4]],
      ['Jun', received[5], -paid[5], profit[5]],
      ['Jul', received[6], -paid[6], profit[6]],
      ['Ago', received[7], -paid[7], profit[7]],
      ['Set', received[8], -paid[8], profit[8]],
      ['Out', received[9], -paid[9], profit[9]],
      ['Nov', received[10], -paid[10], profit[10]],
      ['Dez', received[11], -paid[11], profit[11]]
   ];

   exportToXLS(data);
};

// Função para criar o gráfico
let chart = null;
let exportButtonHandler = null;
async function graphic_months(data) {
   const received = await received_for_month(data);
   const paid = await paid_for_month(data);
   const profit = await profit_for_month(data);

   const array_received = new Array(12).fill(0); // Inicializa o array com zeros para 12 meses
   const array_paid = new Array(12).fill(0); // Inicializa o array com zeros para 12 meses
   const array_profit = new Array(12).fill(0); // Inicializa o array com zeros para 12 meses

   // Filtra os dados do ano atual e preenche o array de received
   received.forEach(item => {
      array_received[item.MONTH - 1] = Number(item.RECEIVED.toFixed(2)); // Subtrai 1 do mês para ajustar o índice do array (Janeiro = 0, Fevereiro = 1, etc.)
   });

   // Filtra os dados do ano atual e preenche o array de paid
   paid.forEach(item => {
      array_paid[item.MONTH - 1] = Number(item.PAID.toFixed(2)); // Subtrai 1 do mês para ajustar o índice do array (Janeiro = 0, Fevereiro = 1, etc.)
   });

   // Filtra os dados do ano atual e preenche o array de profit
   profit.forEach(item => {
      array_profit[item.MONTH - 1] = Number(item.PROFIT.toFixed(2)); // Subtrai 1 do mês para ajustar o índice do array (Janeiro = 0, Fevereiro = 1, etc.)
   });

   var options = {
      series: [
         {
            name: 'Receita',
            data: array_received
         },
         {
            name: 'Despesas',
            data: array_paid
         },
         {
            name: 'Lucro',
            data: array_profit
         }
      ],

      chart: {
         type: 'bar',
         height: 400,
         toolbar: {
            show: false,
         },
      },

      colors: ['#45cb86', '#f06548', '#403098'],

      plotOptions: {
         bar: {
            borderRadius: 3,
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
      chart = new ApexCharts(document.querySelector("#profit-month-by-month"), options);
      chart.render();
   }

   // Adiciona o novo ouvinte de evento ao botão de exportação
   const export_button = document.getElementById('exportButton');
   
   // Remove o ouvinte de evento anterior, se existir
   if (exportButtonHandler) {
      export_button.removeEventListener('click', exportButtonHandler);
   }

   // Define um novo manipulador de eventos para o botão de exportação
   exportButtonHandler = function () {
      prepareAndExportData(array_received, array_paid, array_profit);
   };

   export_button.addEventListener('click', exportButtonHandler);
};

// Função que soma o lucro por modal
async function sumProfitByModal(data) {
   // Objeto para armazenar os lucros por modalidade
   let profit_by_modal = {};

   // Itera sobre os dados e soma o lucro por modalidade
   for (let i = 0; i < data.length; i++) {
      const element = data[i];
      const modal = element.Modalidade;
      const profit = element.Lucro_Estimado || 0; // Tratar os nulos como 0

      if(profit_by_modal[modal]) {
         profit_by_modal[modal] += profit;
      } else {
         profit_by_modal[modal] = profit;
      }
   }

   // Converte o objeto em um array para o ApexCharts
   const chart_data = Object.keys(profit_by_modal).map(modal => {
      return {
         name: modal,
         y :profit_by_modal[modal]
      };
   });

   return chart_data;
};

let update_profit_modal_chart;
async function profitModalChart(data) {
   const profit_by_modal = await sumProfitByModal(data);

   let series = profit_by_modal.map(item => item.y); // valores
   let labels = profit_by_modal.map(item => item.name); // modalidades

   let options = {
      chart: {
         type: 'pie',
         width: "123%",
      },
      legend: {
         show: true,
         position: "bottom",
      },
      series: series,
      labels: labels,

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
   };

   // Verifique se o gráfico já existe
   if (update_profit_modal_chart) {
      // Se existir, atualize os dados e renderize novamente
      update_profit_modal_chart.updateOptions(options);
   } else {
      // Se não existir, crie um novo gráfico
      update_profit_modal_chart = new ApexCharts(document.querySelector("#profit-by-modal"), options);
      update_profit_modal_chart.render();
   }
}

// Função que soma o lucro por modal
async function sumProfitByTypeLoad(data) {
   // Objeto para armazenar os lucros por modalidade
   let profit_by_type_load = {};

   // Itera sobre os dados e soma o lucro por modalidade
   for (let i = 0; i < data.length; i++) {
      const element = data[i];
      const type_load = element.Tipo_Carga;
      const profit = element.Lucro_Estimado || 0; // Tratar os nulos como 0

      if(profit_by_type_load[type_load]) {
         profit_by_type_load[type_load] += profit;
      } else {
         profit_by_type_load[type_load] = profit;
      }
   }

   // Converte o objeto em um array para o ApexCharts
   const chart_data = Object.keys(profit_by_type_load).map(type_load => {
      return {
         name: type_load,
         y :profit_by_type_load[type_load]
      };
   });

   return chart_data;
};

let update_profit_type_load_chart;
async function profitTypeLoadChart(data) {
   const profit_by_type_load = await sumProfitByTypeLoad(data);

   let series = profit_by_type_load.map(item => item.y); // valores
   let legenda = profit_by_type_load.map(item => item.name); // modalidades

   let options = {
      chart: {
         width: "123%",
         type: 'pie',
      },
      series: series,
      labels: legenda,
      legend: {
         show: true,
         position: "bottom",
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
   };

   // Verifique se o gráfico já existe
   if (update_profit_type_load_chart) {
      // Se existir, atualize os dados e renderize novamente
      update_profit_type_load_chart.updateOptions(options);
   } else {
      // Se não existir, crie um novo gráfico
      update_profit_type_load_chart = new ApexCharts(document.querySelector("#profit-by-type_load"), options);
      update_profit_type_load_chart.render();
   }
};

// Função que soma o lucro medio por modal
async function averageProfitByModal(data) {
   // Objeto para armazenar os lucros e contagens por modalidade
   let profit_by_modal = {};
   let count_by_modal = {};

   // Itera sobre os dados e soma o lucro e conta entradas por modalidade
   for (let i = 0; i < data.length; i++) {
      const element = data[i];
      const modal = element.Modalidade;
      const profit = element.Lucro_Estimado || 0; // Tratar os nulos como 0

      if (profit_by_modal[modal]) {
         profit_by_modal[modal] += profit;
         count_by_modal[modal] += 1;
      } else {
         profit_by_modal[modal] = profit;
         count_by_modal[modal] = 1;
      }
   }

   // Converte o objeto em um array para o ApexCharts
   const chart_data = Object.keys(profit_by_modal).map(modal => {
      return {
         name: modal,
         y: profit_by_modal[modal] / count_by_modal[modal] // Calcula a média
      };
   });

   return chart_data;
};

let update_average_by_modal;
async function avaregaProfitModalChart(data) {
   const profit_by_modal = await averageProfitByModal(data);

   let series = profit_by_modal.map(item => item.y); // valores
   let labels = profit_by_modal.map(item => item.name); // modalidades

   let options = {
      chart: {
         type: 'pie',
         width: "123%",
      },
      legend: {
         show: true,
         position: "bottom",
      },
      series: series,
      labels: labels,

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
   };

   // Verifique se o gráfico já existe
   if (update_average_by_modal) {
      // Se existir, atualize os dados e renderize novamente
      update_average_by_modal.updateOptions(options);
   } else {
      // Se não existir, crie um novo gráfico
      update_average_by_modal = new ApexCharts(document.querySelector("#average-profit-by-modal"), options);
      update_average_by_modal.render();
   }
};

// Função onde vai conter todos os cliques da
async function eventClick() {
   // ========== BOTAO DE FILTRO ========== // 
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

      const selectAgencySituation = await getSelectAgencySituation(); // Armazena todas as situacao de agenciamento Selecionadas
      const selectModal = await getSelectModal(); // Armazena todos os modais Selecionadas
      const selectTypeLoad = await getSelectTypeLoad(); // Armazena todos os tipos de carga Selecionadas
      const selectClients = await getSelectClient(); // Armazena todos os tipos de carga Selecionadas

      // Pegar o filtro de tipo pessoa, se é PJ ou PF
      const yesCourier = document.getElementById('yesCourier').checked ? 1 : 0;
      const noCourier = document.getElementById('noCourier').checked ? 1 : 0;
      // No banco de dados esse campo é um boolean. O IF ELSE abaixo é feito para informar o banco se o filtro esta sendo feito para Com Courier e Sem Courier
      // Boolean = 0 PJ   Boolean = 1 PF
      const courier = yesCourier == 1 && noCourier == 1 ? '(1,1)' : yesCourier == 1 && noCourier == 0 ? '(1,0)' : yesCourier == 0 && noCourier == 1 ? '(0,1)' : '(1,1)'

      // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
      document.querySelector('#loader2').classList.remove('d-none')

      const getResults = await makeRequest('/api/performance-products/listResults', 'POST', {startDate: startDateGlobal, endDate: endDateGlobal, selectAgencySituation: selectAgencySituation, selectModal: selectModal, selectTypeLoad: selectTypeLoad, courier: courier, selectClients: selectClients});

      // CHAMA AS FUNÇÕES
      await profit(getResults);
      await total_teus(getResults);
      await total_tons(getResults);
      await total_process(getResults);
      await average_profit_process(getResults);
      await graphic_months(getResults);
      await profitModalChart(getResults);
      await profitTypeLoadChart(getResults);
      await avaregaProfitModalChart(getResults);

      // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
      document.querySelector('#loader2').classList.add('d-none')
   });
   // ========== / BOTAO DE FILTRO ========== // 
};

// Inicializa o seletor de data
async function initializeDatePicker() {
   flatpickr("#inputDateFilter", {
       mode: "range",
       dateFormat: "d M Y",
   });
};

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   await checkLoginExpiration()

   setInterval(async () => {
       await checkLoginExpiration()
   }, 1000);

   const StorageGoogle = await getInfosLogin();
   await setInfosLogin(StorageGoogle)
   
   const getClients = await makeRequest('/api/performance-products/listClients', 'POST');
   const getResults = await makeRequest('/api/performance-products/listResults', 'POST');

   await createSelectAgencySituation();
   await createSelectModal();
   await createSelectTypeLoad();

   await profit(getResults);
   await total_teus(getResults);
   await total_tons(getResults);
   await total_process(getResults);
   await average_profit_process(getResults);
   await graphic_months(getResults);
   await profitModalChart(getResults);
   await profitTypeLoadChart(getResults);
   await avaregaProfitModalChart(getResults);
   await createSelectClient(getClients);

   await eventClick();
   await initializeDatePicker();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})