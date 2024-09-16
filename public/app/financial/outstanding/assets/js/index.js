// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
async function invoicesTable(situacao = 1) {
    // Fazer a requisição à API
    const totalInvoices = await makeRequest(`/api/financial-indicators/totalInvoices`, 'POST', {situacao: situacao});
    console.log(totalInvoices)
    const divlistInvoices = document.getElementById('listInvoices');
    
    let printlistInvoices = '';

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
        }
        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
    
      

        const date = await formattedDateTime(totalInvoices[index].Data);
        const clientName = totalInvoices[index].Pessoa

        printlistInvoices += `
            <a href="javascript:void(0);" class="border-0">
                <div class="list-group-item border-0">
                   <div class="d-flex align-items-start"> <span class="bg-primary" style="background-color: ${color}!important"></span>
                        <div class="w-100">
                            <div class="d-flex align-items-top justify-content-between">
                                <div class="mt-0">
                                    <p class="mb-0 fw-semibold"><span class="fs-13 me-3">${clientName}</span>
                                    </p><span class="mb-0 fs-13 text-muted">${totalInvoices[index].Numero_Processo}</span>
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
    
}

async function financialSummary() {
    const financialSummary = await makeRequest(`/api/financial-indicators/financial-summary`);
    console.log(financialSummary)

    document.querySelector('.total-invoicing').textContent = financialSummary.invoicing.value
    document.querySelector('.percentage-invoicing').textContent = financialSummary.invoicing.percentage

    document.querySelector('.total-billingReleased').textContent = financialSummary.billingReleased.value
    document.querySelector('.percentage-billingReleased').textContent = financialSummary.billingReleased.percentage

    document.querySelector('.total-invoiceLosers').textContent = financialSummary.invoiceLosers.value
    document.querySelector('.percentage-invoiceLosers').textContent = financialSummary.invoiceLosers.percentage

    document.querySelector('.total-totalPaid').textContent = financialSummary.totalPaid.value
    document.querySelector('.percentage-totalPaid').textContent = financialSummary.totalPaid.percentage

    document.querySelector('.total-totalReceived').textContent = financialSummary.totalReceived.value
    document.querySelector('.percentage-totalReceived').textContent = financialSummary.totalReceived.percentage
}

async function tableFinancialExpenses() {
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/financial-indicators/financial-expenses`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_despesasFIN')) {
        $('#table_despesasFIN').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#table_despesasFIN').DataTable({
        dom: 'Bfrtip',
        pageLength: 15,
        order: [[0, 'desc']],
        data: dados.data,
        columns: [
            { data: 'Data_Vencimento' },
            { data: 'Situacao' },
            { data: 'Historico_Resumo' },
            { data: 'Pessoa' },
            { data: 'Tipo_Transacao' },
            { data: 'Valor' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        },
    });
}

async function formattedDateTime(time) {
    const date = new Date(time);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
}

async function limitByCharacter(text, limit) {
    if (text.length > limit) {
        return text.substring(0, limit) + "...";
    }
    return text;
}

async function totalCard(data, idtext) {
    const total = data.reduce((acumulator, element) => {
       return acumulator + element.Valor_Total
    }, 0);
 
    const text = document.querySelector(idtext);
    text.textContent = `${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}`
 
    return total;
};

async function received_for_month(data) {
    const sum_for_month = [];
 
    for (let i = 0; i < data.length; i++) {
       const item = data[i];
       const [year, month] = item.Data.split('-').map(Number);
       const received = item.Valor_Total;
 
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

async function paid_for_month(data) {
    const sum_for_month = [];
 
    for (let i = 0; i < data.length; i++) {
       const item = data[i];
       const [year, month] = item.Data.split('-').map(Number);
       const paid = item.Valor_Total;
 
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

let chart
async function graphic_month(dataReceived, dataPaid) {
    const received = await received_for_month(dataReceived)
    const paid = await paid_for_month(dataPaid)

    const array_received = new Array(12).fill(0)
    const array_paid = new Array(12).fill(0)

    received.forEach(item => {
        array_received[item.MONTH -1] = Number(item.RECEIVED.toFixed(2))
    });

    paid.forEach(item => {
        array_paid[item.MONTH -1] = Number(item.PAID.toFixed(2))
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
        ],
  
        chart: {
           type: 'bar',
           height: 450,
           toolbar: {
              show: false,
           },
        },
  
        colors: ['#45cb86', '#f06548'],
  
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
        chart = new ApexCharts(document.querySelector("#invoice-chart"), options);
        chart.render();
     }
}


document.addEventListener("DOMContentLoaded", async () => {

    const invoiced = await makeRequest(`/api/financial-indicators/invoiced`, 'GET');
    const billingReleased = await makeRequest(`/api/financial-indicators/billingReleased`, 'GET');
    const losers = await makeRequest(`/api/financial-indicators/losers`, 'GET');
    const totalReceived = await makeRequest(`/api/financial-indicators/totalReceived`, 'GET');
    const totalPaid = await makeRequest(`/api/financial-indicators/totalPaid`, 'GET');
    const totalAdm = await makeRequest(`/api/financial-indicators/totalAdm`, 'GET');

    await totalCard(invoiced, '.total-invoicing');
    await totalCard(billingReleased, '.total-billingReleased');
    await totalCard(losers, '.total-invoiceLosers');
    await totalCard(totalReceived, '.total-totalPaid');
    await totalCard(totalAdm, '.total-totalReceived');

    await graphic_month(totalReceived, totalPaid)
    

    // Inicia a lista das faturas com a situação em aberta
    // await invoicesTable(1);
    // await financialSummary();
    // await tableFinancialExpenses();


    document.querySelector('#loader2').classList.add('d-none')
})