// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
let startDateGlobal, endDateGlobal;

// Função para listar todos os cards de Teus, m3 e peso
async function totalContainers(data) {
    // Seleciona as divs onde os valores serão exibidos
    const divTotalTeus = document.querySelector('.total_teus')
    const divTotalCntr = document.querySelector('.total_cntr')
    const divTotalCntr20 = document.querySelector('.total_cntr20')
    const divTotalCntr40 = document.querySelector('.total_cntr40')
    const divTotalVolume = document.querySelector('.total_volume')
    const divTotalPeso = document.querySelector('.total_peso')

    // Inicializa as variáveis que armazenarão os totais
    let totalTeus = 0;
    let totalCntr = 0;
    let totalCntr20 = 0;
    let totalCntr40 = 0;
    let totalVolume = 0;
    let totalPeso = 0;

    // Percorre cada item do array de dados
    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.TEUS) {
            totalTeus += item.TEUS
        }

        if (item.Total_Containers) {
            totalCntr += item.Total_Containers;
        }

        if (item.Qnt_Container_20) {
            totalCntr20 += item.Qnt_Container_20; 
        }

        if (item.Qnt_Container_40) {
            totalCntr40 += item.Qnt_Container_40;
        }

        if (item.Metragem_Cubica) {
            totalVolume += item.Metragem_Cubica;
        }

        if (item.Peso_Bruto) {
            totalPeso += item.Peso_Bruto;
        }
  
    }

    // Formatando os valores para exibir com separadores de milhar e casas decimais
    totalVolume = totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(',', '.');
    totalPeso = totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(',', '.');

     // Exibe os valores totais nas divs
     divTotalTeus.textContent = totalTeus;
     divTotalCntr.textContent = totalCntr;
     divTotalCntr20.textContent = totalCntr20;
     divTotalCntr40.textContent = totalCntr40;
     divTotalVolume.textContent = totalVolume;
     divTotalPeso.textContent = totalPeso;
}

async function customerRanking(data) {
    const divTotalProcesses = document.querySelector('.total_processes')

    let totalProcesses = 0;

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.Numero_Processo) {
            totalProcesses += item.Numero_Processo;
            
        }
        
    }

    divTotalProcesses.textContent = totalProcesses;
    
}




async function fetchProcessData() {
    // Aqui você fará a chamada à sua API ou banco de dados
    // Para fins de exemplo, estamos simulando os dados retornados
    return [
        { "Mes": "JANEIRO", "TotalProcessos2024": 100, "TotalProcessos2023": 5 },
        { "Mes": "FEVEREIRO", "TotalProcessos2024": 15, "TotalProcessos2023": 7 },
        { "Mes": "MARÇO", "TotalProcessos2024": 20, "TotalProcessos2023": 10 },
        { "Mes": "ABRIL", "TotalProcessos2024": 25, "TotalProcessos2023": 15 },
        { "Mes": "MAIO", "TotalProcessos2024": 30, "TotalProcessos2023": 20 },
        { "Mes": "JUNHO", "TotalProcessos2024": 35, "TotalProcessos2023": 25 },
        { "Mes": "JULHO", "TotalProcessos2024": 40, "TotalProcessos2023": 30 },
        { "Mes": "AGOSTO", "TotalProcessos2024": 45, "TotalProcessos2023": 35 },
        { "Mes": "SETEMBRO", "TotalProcessos2024": 50, "TotalProcessos2023": 40 },
        { "Mes": "OUTUBRO", "TotalProcessos2024": 55, "TotalProcessos2023": 45 },
        { "Mes": "NOVEMBRO", "TotalProcessos2024": 60, "TotalProcessos2023": 50 },
        { "Mes": "DEZEMBRO", "TotalProcessos2024": 65, "TotalProcessos2023": 55 }
    ];
}

// Função para gerar o gráfico
async function generateProcessChart(startDate,endDate) {
    const processosData = await fetchProcessData();

    // Cria os arrays para os dados do gráfico
    const array_2023 = [];
    const array_2024 = [];

    processosData.forEach(item => {
        array_2023.push(item.TotalProcessos2023);
        array_2024.push(item.TotalProcessos2024);
    });

    // Configurações do gráfico
    const options = {
        series: [
            {
                name: '2023',
                data: array_2023
            },
            {
                name: '2024',
                data: array_2024
            },
        ],
        chart: {
            type: 'bar',
            height: 450,
            toolbar: {
                show: false,
            },
        },
        colors: ['#1E90FF', '#8A2BE2'],
        plotOptions: {
            bar: {
                borderRadius: 3,
                columnWidth: '70%',
                horizontal: false,
                dataLabels: {
                    position: 'top',
                },
            }
        },
        dataLabels: {
            enabled: true,
            position: 'top'
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
                    return val.toLocaleString('pt-BR'); // Exibe o número formatado em português
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
            show: true,
        },
    };

    // Criação do gráfico
    const chart = new ApexCharts(document.querySelector("#process-chart"), options);
    chart.render();
}



// Função para listar as propostas
async function totalOffers(data) {
    const divTotalApproved = document.querySelector('.total_approved');
    const divTotalPendent = document.querySelector('.total_pendent');
    const divTotalDisapprove = document.querySelector('.total_disapprove');

    let approved = 0;
    let pendent = 0;
    let disapprove = 0;

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.Status && item.Status === 'Aprovada') {
            approved += item.Qnt_Proposta;
        } else if (item.Status && item.Status === 'Aguardando Aprovação') {
            pendent += item.Qnt_Proposta;
        } else if (item.Status && item.Status === 'Reprovada') {
            disapprove += item.Qnt_Proposta;
        }

    divTotalApproved.textContent = approved;
    divTotalPendent.textContent = pendent;
    divTotalDisapprove.textContent = disapprove;
}

}




document.addEventListener("DOMContentLoaded", async () => {

    const totalOffersProcesses = await makeRequest(`/api/report-pricing/totalOffersProcesses`, 'POST');
    const graphicProcesses = await makeRequest(`/api/report-pricing/graphicProcesses`, 'POST');
    const managementPricing = await makeRequest(`/api/report-pricing/managementPricing`, 'POST');


    
    await totalOffers(totalOffersProcesses);
    await totalContainers(managementPricing);
    await customerRanking(managementPricing);




    // Chama a função para gerar o gráfico
    generateProcessChart(graphicProcesses);

   

    document.querySelector('#loader2').classList.add('d-none')
})