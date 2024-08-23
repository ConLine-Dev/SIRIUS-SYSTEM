
// Conecta-se ao servidor Socket.io
const socket = io();

 // Evento para receber mensagens do servidor
 socket.on('att-non-compliance', async (msg) => {
    // document.querySelector('#loader2').classList.remove('d-none')
    // await listPendingOccurrences();
    // await listAllOccurrences();
    // await listAllActions()
    // document.querySelector('#loader2').classList.add('d-none')
});



async function listPendingOccurrences(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/getPendingOccurrences`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#pending_occurrences_table')) {
        $('#pending_occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#pending_occurrences_table').DataTable({
        dom: 'frtip',
        scrollY: '270px',  // Altura fixa com rolagem
        scrollCollapse: false, // Permite a tabela colapsar caso tenha menos dados
        paging: false, // Desativar paginação para usar rolagem
        order: [[0, 'desc']],
        data: dados,
        pageInfo: false,
        bInfo: false,
        columns: [
            { data: 'reference' },
            { data: 'title' },
            { data: 'type' },
            { data: 'responsibles' },
            { data: 'status' },
            { data: 'date_occurrence' },
            // { data: 'action' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf'
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
        },
        "rowCallback": function(row, data, index) {
            // Adiciona um atributo id a cada linha
            $(row).attr('occurrence-id', data.id);
        },
        initComplete: function () {
            requestAnimationFrame(async () => {
                await dblClickOnOccurrence('#pending_occurrences_table')
            });
        },
    });

    
}

async function OccurrencePerUnit(){
    // carrega as unidades cadastradas (filiais)
    const Units = await makeRequest(`/api/non-compliance/AllUnit`);
     // Fazer a requisição à API
     const data = await makeRequest(`/api/non-compliance/AllOccurrence`);
   
     // Dados para preencher os elementos
     const occurrencesByUnit = await Promise.all(Units.map(async (unit) => {
        // Filtra as ocorrências para a unidade atual
        const unitOccurrences = data.filter(item => item.company_id === unit.id);
        const total = unitOccurrences.length.toString().padStart(4, '0');
        
        // Retorna um objeto com os dados da unidade
        return {
            city: unit.city,
            country: unit.country,
            total: total
        };
    }));

    // Preenche os elementos de ocorrências por unidade
    const occurrencesContainer = document.querySelector('.bodyOccurrencePerUnit');
    occurrencesContainer.innerHTML = '';
    occurrencesByUnit.forEach(unit => {
        const unitElement = `
            <div class="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-12">
                <div class="d-flex align-items-top">
                    <div class="me-3"> <span class="avatar text-primary"> <i class="ti ti-files fs-18"></i> </span> </div>
                    <div> <span class="d-block mb-1 text-muted">${unit.city} | ${unit.country}</span>
                        <h6 class="fw-semibold mb-0">${unit.total}</h6> </div>
                </div>
            </div>
        `;
        occurrencesContainer.insertAdjacentHTML('beforeend', unitElement);
    }); 
}   

async function CollabPerUnit(){
    // carrega as unidades cadastradas (filiais)
    const Units = await makeRequest(`/api/non-compliance/AllUnit`);
     // Fazer a requisição à API
     const data = await makeRequest(`/api/collaborators-management/collaborators`);

   
     // Dados para preencher os elementos
     const occurrencesByUnit = await Promise.all(Units.map(async (unit) => {
        // Filtra as ocorrências para a unidade atual
        const unitOccurrences = data.filter(item => item.companie_id === unit.id && item.resignation_date != '');
        const total = unitOccurrences.length.toString().padStart(4, '0');
        
        // Retorna um objeto com os dados da unidade
        return {
            city: unit.city,
            country: unit.country,
            total: total
        };
    }));

    // Preenche os elementos de ocorrências por unidade
    const occurrencesContainer = document.querySelector('.bodyCollabPerUnit');
    occurrencesContainer.innerHTML = '';
    occurrencesByUnit.forEach(unit => {
        const unitElement = `
            <div class="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-12">
                <div class="d-flex align-items-top">
                    <div class="me-3"> <span class="avatar text-primary"> <i class="ti ti-files fs-18"></i> </span> </div>
                    <div> <span class="d-block mb-1 text-muted">${unit.city} | ${unit.country}</span>
                        <h6 class="fw-semibold mb-0">${unit.total}</h6> </div>
                </div>
            </div>
        `;
        occurrencesContainer.insertAdjacentHTML('beforeend', unitElement);
    }); 




    const totalColabsActive = data.filter(item => item.resignation_date != '').length.toString().padStart(4, '0');
    const totalColabs = data.length.toString().padStart(4, '0');

    document.querySelector('.totalColabsActive').textContent = totalColabsActive
    document.querySelector('.totalCollabs').textContent = totalColabs

    const turnoverGeneral = await makeRequest(`/api/collaborators-management/turnoverGeneral`);


    document.querySelector('.turnoverGeneral').textContent = parseFloat(turnoverGeneral)+'%'


}   

async function table_despesasADM() {
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/launches_adm/getAllLaunches/`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_despesasADM')) {
        $('#table_despesasADM').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#table_despesasADM').DataTable({
        dom: 'frtip',
        pageLength: 10,
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

async function CollaboratorBirthDate(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/collaborators-management/collaborators-birth-date`);

    let actonsHTML = '';
    for (let index = 0; index < dados.length; index++) {
        const element = dados[index];
        actonsHTML += `<li class="list-group-item border-top-0 border-start-0 border-end-0">
                            <a href="javascript:void(0);">
                                <div class="d-flex align-items-center">
                                    <div class="me-2 lh-1"> 
                                        <span title="${element.name} ${element.family_name}" class="avatar avatar-md avatar-rounded bg-primary-transparent"> 
                                            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> 
                                        </span> 
                                    </div>
                                    <div class="flex-fill">
                                        <p class="mb-0 fw-semibold" style="display: flex;">${element.name} ${element.family_name}&#8287;&#8287;</p>
                                        <p class="fs-12 text-muted mb-0">${element.email_business}</p>
                                    </div>
                                    <div class="text-end">
                                        <p class="mb-0 fs-12">Data</p>
                                        <span class=" bg-primary-transparent">${element.birthday_formated}</span>
                                        
                                        
                                    </div>
                                </div>
                            </a>
                        </li>`
    }


    document.querySelector('.CollaboratorBirthDate').innerHTML = actonsHTML

}

async function CollaboratorAdmissionDate(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/collaborators-management/collaborators-admission-date`);

    let actonsHTML = '';
    for (let index = 0; index < dados.length; index++) {
        const element = dados[index];
        actonsHTML += `<li class="list-group-item border-top-0 border-start-0 border-end-0">
                            <a href="javascript:void(0);">
                                <div class="d-flex align-items-center">
                                    <div class="me-2 lh-1"> 
                                        <span title="${element.name} ${element.family_name}" class="avatar avatar-md avatar-rounded bg-primary-transparent"> 
                                            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> 
                                        </span> 
                                    </div>
                                    <div class="flex-fill">
                                        <p class="mb-0 fw-semibold" style="display: flex;">${element.name} ${element.family_name}&#8287;&#8287;</p>
                                        <p class="fs-12 text-muted mb-0">${element.tempo_de_empresa}</p>
                                    </div>
                                    <div class="text-end">
                                        <p class="mb-0 fs-12">Data</p>
                                        <span class=" bg-primary-transparent">${element.admission_anniversary}</span>
                                        
                                        
                                    </div>
                                </div>
                            </a>
                        </li>`
    }


    document.querySelector('.CollaboratorAdmissionDate').innerHTML = actonsHTML

}

async function CollaboratorActive(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/collaborators-management/collaborators-active`);

    let actonsHTML = '';
    for (let index = 0; index < dados.length; index++) {
        const element = dados[index];
        console.log(element)
        actonsHTML += `<li class="list-group-item border-top-0 border-start-0 border-end-0">
                            <a href="javascript:void(0);">
                                <div class="d-flex align-items-center">
                                    <div class="me-2 lh-1"> 
                                        <span title="${element.name} ${element.family_name}" class="avatar avatar-md avatar-rounded bg-primary-transparent"> 
                                            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> 
                                        </span> 
                                    </div>
                                    <div class="flex-fill">
                                        <p class="mb-0 fw-semibold" style="display: flex;">${element.name} ${element.family_name}&#8287;&#8287;</p>
                                        <p class="fs-12 text-muted mb-0">${element.departments_names}</p>
                                    </div>
                                   
                                </div>
                            </a>
                        </li>`
    }


    document.querySelector('.CollaboratorActive').innerHTML = actonsHTML

}




async function chartTurnover() {
    // Suponha que você obteve os dados de um API ou banco de dados e os formatou assim:
    const monthlyData = await makeRequest(`/api/collaborators-management/turnover-month`);

    // Formate os dados para o formato esperado pelo ApexCharts
    const admissionsData = monthlyData.map(data => ({
        x: data.month,
        y: data.total_admissoes
    }));

    const terminationsData = monthlyData.map(data => ({
        x: data.month,
        y: data.total_desligamentos
    }));

    const turnoverData = monthlyData.map(data => ({
        x: data.month,
        y: data.turnover
    }));

    // Configuração do gráfico
    var options = {
        series: [
            {
                type: 'line',
                name: 'Admissões',
                data: admissionsData
            },
            {
                type: 'line',
                name: 'Desligamentos',
                data: terminationsData
            },
            {
                type: 'line',
                name: 'Turnover',
                data: turnoverData
            }
        ],
        chart: {
            height: 350,
            animations: {
                speed: 500
            },
            dropShadow: {
                enabled: true,
                enabledOnSeries: undefined,
                top: 8,
                left: 0,
                blur: 3,
                color: '#000',
                opacity: 0.1
            },
        },
        colors: ["#F9423A", "#3F2021", "#D0CFCD"],
        dataLabels: {
            enabled: false
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 3
        },
        stroke: {
            curve: 'smooth',
            width: [2, 2, 2],
            dashArray: [0, 5, 0],
        },
        xaxis: {
            categories: monthlyData.map(data => data.month),
            axisTicks: {
                show: false,
            },
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return value;
                }
            },
        },
        tooltip: {
            y: [{
                formatter: function(e) {
                    return void 0 !== e ? e.toFixed(0) : e;
                }
            }, {
                formatter: function(e) {
                    return void 0 !== e ? e.toFixed(0) : e;
                }
            }, {
                formatter: function(e) {
                    return e+'%'
                }
            }]
        },
        legend: {
            show: true,
            customLegendItems: ['Admissões', 'Desligamentos', 'Turnover'],
            inverseOrder: true
        },
        title: {
            text: 'Análise de Turnover, Admissões e Desligamentos por Mês',
            align: 'left',
            style: {
                fontSize: '.8125rem',
                fontWeight: 'semibold',
                color: '#8c9097'
            },
        },
        markers: {
            hover: {
                sizeOffset: 5
            }
        }
    };

    // Renderiza o gráfico
    document.getElementById('turnoverReport').innerHTML = '';
    var chart = new ApexCharts(document.querySelector("#turnoverReport"), options);
    chart.render();
}


function revenueAnalytics() {
    chart.updateOptions({
        colors: ["rgba(" + myVarVal + ", 1)", "rgba(35, 183, 229, 0.85)", "rgba(119, 119, 142, 0.05)"],
    });
}



window.addEventListener("load", async () => {
    // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.time(`A página "${document.title}" carregou em`)

    // await listPendingOccurrences();
    await OccurrencePerUnit()
    await CollabPerUnit()
    await table_despesasADM()
    await CollaboratorBirthDate();
    await CollaboratorAdmissionDate();
    await CollaboratorActive()
    await chartTurnover()



    


    document.querySelector('#loader2').classList.add('d-none')
    // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.timeEnd(`A página "${document.title}" carregou em`);
})

