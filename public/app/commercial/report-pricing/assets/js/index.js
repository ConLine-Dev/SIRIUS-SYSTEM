// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
let startDateGlobal, endDateGlobal;

// Função para listar todos os cards de Teus, m3 e peso
async function totalContainers(data) {
    const divTotalTeus = document.querySelector('.total_teus');
    const divTotalCntr = document.querySelector('.total_cntr');
    const divTotalCntr20 = document.querySelector('.total_cntr20');
    const divTotalCntr40 = document.querySelector('.total_cntr40');
    const divTotalVolume = document.querySelector('.total_volume');
    const divTotalPeso = document.querySelector('.total_peso');
    const divTotalProcesses = document.querySelector('.total_processes');

    let totalTeus = 0;
    let totalCntr = 0;
    let totalCntr20 = 0;
    let totalCntr40 = 0;
    let totalVolume = 0;
    let totalPeso = 0;
    let totalProcesses = 0;

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.TEUS) totalTeus += item.TEUS;
        if (item.Total_Containers) totalCntr += item.Total_Containers;
        if (item.Qnt_Container_20) totalCntr20 += item.Qnt_Container_20;
        if (item.Qnt_Container_40) totalCntr40 += item.Qnt_Container_40;
        if (item.Metragem_Cubica) totalVolume += item.Metragem_Cubica;
        if (item.Peso_Bruto) totalPeso += item.Peso_Bruto;
        if (item.Numero_Processo) totalProcesses += item.Numero_Processo;
    }

    // Converte o peso total para toneladas
    totalPeso = totalPeso / 1000;

    // Formatação dos valores para exibir com separadores de milhar e casas decimais
    totalVolume = totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(',', '.');
    totalPeso = totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(',', '.');

    divTotalTeus.textContent = totalTeus;
    divTotalCntr.textContent = totalCntr;
    divTotalCntr20.textContent = totalCntr20;
    divTotalCntr40.textContent = totalCntr40;
    divTotalVolume.textContent = totalVolume;
    divTotalPeso.textContent = totalPeso;
    divTotalProcesses.textContent = totalProcesses;
}


// Função para listar o total de processos e top 5 clientes
async function totalClient() {
    const customerRanking = await makeRequest(`/api/report-pricing/customerRanking`, 'POST');
    const divTotalClient = document.querySelector('.total_client_processes');

    divTotalClient.innerHTML = '';

    let html = '';

    const color = ['warning', 'purple', 'success', 'info', 'primary']

    for (let i = 0; i < customerRanking.length; i++) {
        const item = customerRanking[i];
        // Limite de caracteres do cliente
        const nomeCliente = item.Cliente.length > 30 ? item.Cliente.slice(0, 30) + '...' : item.Cliente;

        html += `<li class="${color[i]}">
                    <div class="d-flex align-items-center justify-content-between total_client">
                        <div>${nomeCliente}</div>
                        <div class="fs-12 text-muted total_processes_client">${item.Quantidade_Processos} Processos </div>
                    </div>
                </li>`;
    }

    divTotalClient.innerHTML = html;
}

// Funcao para listar o total de processos por armadores
async function totalCarrier() {
    const carrierRanking = await makeRequest(`/api/report-pricing/carrierRanking`, 'POST'); 
    const divCarrierTotalProcesses = document.querySelector('.carrier_total_processes');

    divCarrierTotalProcesses.innerHTML = '';

    let html = '';

    for (let i = 0; i < carrierRanking.length; i++) {
        const item = carrierRanking[i];
        // Limite de caracteres do cliente
        const nomeArmador = item.Cia_Transporte.length > 30 ? item.Cia_Transporte.slice(0, 30) + '...' : item.Cia_Transporte;

        html += `<tr>
                    <td>
                        <div class="d-flex align-items-center"> 
                            <div>${nomeArmador}</div>
                        </div>
                    </td>
                    <td> <span><i class="me-4 text-success align-middle fs-18"></i>${item.Quantidade_Processos}</span> </td>
                </tr>`;
        
    }

    divCarrierTotalProcesses.innerHTML = html;
    
}

// Funcao para listar o total de processos por produtos/mercadorias
async function totalProduct() {
    const productRanking = await makeRequest(`/api/report-pricing/productRanking`, 'POST'); 
    const divProductTotalProcesses = document.querySelector('.product_total_processes');

    // Filtra os itens que têm 'Mercadoria' diferente de null
    const filteredProductRanking = productRanking.filter(item => item.Mercadoria !== null);

    divProductTotalProcesses.innerHTML = '';

    let html = '';
    const color = ['warning', 'info', 'success', 'info', 'primary', 'warning', 'success', 'primary', 'info'];

    for (let i = 0; i < filteredProductRanking.length; i++) {
        const item = filteredProductRanking[i];

        html += `<li class="list-group-item">${item.Mercadoria}<span class="badge float-end bg-${color[i]}-transparent">${item.Quantidade_Processos} Processos</span> </li>`;
    }

    divProductTotalProcesses.innerHTML = html;
}

// Função para gerar o gráfico de processos por mes
async function generateProcessChart(startDate, endDate) {
    const processosData = await makeRequest(`/api/report-pricing/graphicProcesses`, 'POST'); 

    const array_2023 = Array(12).fill(0); // Preenche com zeros para cada mês
    const array_2024 = Array(12).fill(0);

    processosData.forEach(item => {
        const mesIndex = item.Mes - 1; // Índice do mês (0 = Jan, 11 = Dez)
        if (item.Ano === 2023) {
            array_2023[mesIndex] = item.Quantidade_Processos;
        } else if (item.Ano === 2024) {
            array_2024[mesIndex] = item.Quantidade_Processos;
        }
    });

    const options = {
        series: [
            { name: '2023', data: array_2023 },
            { name: '2024', data: array_2024 },
        ],
        chart: { type: 'bar', height: 450, toolbar: { show: false } },
        colors: ['#2ecc71', '#e74c3c'],
        plotOptions: {
            bar: {
                borderRadius: 3, columnWidth: '70%', horizontal: false,
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: { enabled: true, position: 'top' },
        stroke: { show: true, width: 1, colors: ['#fff'] },
        tooltip: {
            shared: true, enabled: true, intersect: false,
            y: { formatter: val => val.toLocaleString('pt-BR') }
        },
        xaxis: {
            categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            labels: { show: true }
        },
        yaxis: { show: true },
    };

    const chart = new ApexCharts(document.querySelector("#process-chart"), options);
    chart.render();
}

// Função para gerar o gráfico de tipos de container
async function generateContainerChart(processos) {
    const equipamentoCounts = processos.reduce((acc, processo) => {
        const tipo = processo.Equipamentos;

        if (tipo != null) {
            acc[tipo] = (acc[tipo] || 0) + 1;
        }
        return acc;
    }, {});

    // Extrair os dados para o gráfico
    const labels = Object.keys(equipamentoCounts);
    const data = Object.values(equipamentoCounts);

    // Configuração do gráfico ApexCharts
    const options = {
        series: [
            { name: 'Processos', data: data }
        ],
        chart: { type: 'bar', height: 350 },
        colors: ['#1E90FF', '#f2901f', '#32a852', '#ffc107', '#8e44ad', '#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6'],
        plotOptions: {
            bar: {
                horizontal: true
            }
        },
        dataLabels: {
            enabled: true
        },
        xaxis: {
            categories: labels,
            labels: { show: true }
        },
        title: {
            text: ''
        }
    };

    // Renderizar o gráfico
    const chart = new ApexCharts(document.querySelector("#chart_container"), options);
    chart.render();
}


// Função para listar as propostas nos cards
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

// Função para listar o Relatorio Pricing
async function listPricing(dados) {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_ListPricing')) {
        $('#table_ListPricing').DataTable().destroy();
    }
    
    $('#table_ListPricing').DataTable({
        dom: 'Bfrtip',
        pageLength: 10,
        order: [[0, 'desc']],
        data: dados.data,

        columns: [
            { data: 'Pricing' },
            { data: 'Data_Proposta' },
            { data: 'Cliente' },
            { data: 'Cia_Transporte' },
            { data: 'Incoterm' },
            { data: 'Numero_Proposta' },
            { data: 'Numero_Processo' },
            { data: 'Situacao' },
            { data: 'POL' },
            { data: 'POD' },
            { data: 'Tipo_Carga' },
            { data: 'Equipamentos' },
            { data: 'TEUS' },
            { data: 'M3' },
            { data: 'Peso_Bruto' }

        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    
}

document.addEventListener("DOMContentLoaded", async () => {

    const totalOffersProcesses = await makeRequest(`/api/report-pricing/totalOffersProcesses`, 'POST');
    const graphicProcesses = await makeRequest(`/api/report-pricing/graphicProcesses`, 'POST');
    const managementPricing = await makeRequest(`/api/report-pricing/managementPricing`, 'POST');
    const listPricingReport = await makeRequest(`/api/report-pricing/listPricingReport`, 'POST');


    
    await totalOffers(totalOffersProcesses);
    await totalContainers(managementPricing);
    await generateProcessChart(graphicProcesses);
    await generateContainerChart(managementPricing);
    await listPricing(listPricingReport);
    await totalClient();
    totalCarrier();
    totalProduct();

    

   

    document.querySelector('#loader2').classList.add('d-none')
})

