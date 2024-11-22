let choicesInstance, choicesInstanceEdit, SCategories, SEditing_Categories;
// Função principal executada ao carregar o DOM
document.addEventListener("DOMContentLoaded", async () => {

    await listCategories();
    await getReport();
    await listMenssages();

    introMain();
    document.querySelector('#loader2').classList.add('d-none')
});

const statusProjets = {
    'completed-tasks-draggable': '<span class="badge bg-success-transparent"> Concluído </span>',
    'inreview-tasks-draggable': 'Em revisão',
    'inprogress-tasks-draggable': '<span class="badge bg-primary-transparent"> Em andamento </span>',
    'todo-tasks-draggable': ' <span class="badge bg-warning-transparent"> Em análise </span>',
    'new-tasks-draggable': ' <span class="badge bg-info-transparent"> Novo </span>'
}

async function getReport() {
    const projects = await makeRequest('/api/called/tickets/listAll');
    console.log(projects)
    await listAllMembers(projects);
    const totalProjects = projects.length;

    const completedProjects = projects.filter(project => project.status == 'completed-tasks-draggable');
    const inReviewProjects = projects.filter(project => project.status == 'inreview-tasks-draggable');
    const inProgressProjects = projects.filter(project => project.status == 'inprogress-tasks-draggable');
    const analiseProjects = projects.filter(project => project.status == 'todo-tasks-draggable');
    const newProjects = projects.filter(project => project.status == 'new-tasks-draggable');
    const currentDate = new Date();

    const filteredDates = projects.filter(project => {
        if(project.end_forecast == null) return false;
        const projectDate = new Date(project.end_forecast);
        const isDateValid = projectDate < currentDate;
        const isStatusValid = project.status !== 'completed-tasks-draggable' && project.status !== 'inreview-tasks-draggable' && project.status !== 'new-tasks-draggable';
        return isDateValid && isStatusValid;
    });

    // Exibe os valores brutos
    document.querySelector('#newProjects').innerHTML = newProjects.length;
    document.querySelector('#totalProjects').innerHTML = totalProjects;
    document.querySelector('#completedProjects').innerHTML = completedProjects.length;
    document.querySelector('#inProgressProjects').innerHTML = inProgressProjects.length;
    document.querySelector('#inReviewProjects').innerHTML = inReviewProjects.length;
    document.querySelector('#analiseProjects').innerHTML = analiseProjects.length;

    // Calcula as porcentagens
    const newProjectsPercentage = (newProjects.length / totalProjects * 100).toFixed(2);
    const completedProjectsPercentage = (completedProjects.length / totalProjects * 100).toFixed(2);
    const inProgressProjectsPercentage = (inProgressProjects.length / totalProjects * 100).toFixed(2);
    const inReviewProjectsPercentage = (inReviewProjects.length / totalProjects * 100).toFixed(2);
    const analiseProjectsPercentage = (analiseProjects.length / totalProjects * 100).toFixed(2);

    // Exibe as porcentagens
    document.querySelector('#newProjectsPercentage').innerHTML = `${newProjectsPercentage}%`;
    document.querySelector('#completedProjectsPercentage').innerHTML = `${completedProjectsPercentage}%`;
    document.querySelector('#inProgressProjectsPercentage').innerHTML = `${inProgressProjectsPercentage}%`;
    document.querySelector('#inReviewProjectsPercentage').innerHTML = `${inReviewProjectsPercentage}%`;
    document.querySelector('#analiseProjectsPercentage').innerHTML = `${analiseProjectsPercentage}%`;

   

    const projectsMaintask = document.querySelector('.projects-maintask-card');
    projectsMaintask.innerHTML = '';
    let html = '';
    for (let index = 0; index < filteredDates.length; index++) {
        const element = filteredDates[index];

        const imgAtribued = element.atribuido.map(item => `<span class="avatar avatar-xs avatar-rounded"> <img title="${item.name} ${item.family_name}" src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="img"> </span>`).join('')
        
        html += `<li onclick="editTask(${element.id})" style="padding: 0px 1px !important;">
                        <div class="d-flex align-items-top">
                            <div class="d-flex align-items-top flex-fill"> 
                           
                                <div class="flex-fill"> <span> ${element.title}</span> <span class="d-block mt-1"> 
                                <span class="avatar-list-stacked"> 
                                 ${imgAtribued}                                        
                                    </span>
                                </div>
                            </div>
                            <div> ${statusProjets[element.status]} </div>
                            
                        </div>
                    </li>`
    }

    projectsMaintask.innerHTML = html;


    new DataTable('#table-resumo-projetos', {
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: '440px',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        searchable: true,
        sortable: true,
        order: [[0, 'desc']],
        data: projects,
        columns: [
            { data: 'id'},
            {
                data: 'title',
                render: function(data, type, row) {
                    const maxLength = 40; // Defina o número máximo de caracteres desejado
                    if (data.length > maxLength) {
                        return data.substring(0, maxLength) + '...'; // Retorna o título truncado com reticências
                    }
                    return data;
                }
            },
            { 
                data: 'atribuido',
                render: function(data) {
                    const formattedData = data.map(item => `<span class="avatar avatar-xs avatar-rounded"> <img title="${item.name} ${item.family_name}" src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt="img"> </span>`).join('');
                    return formattedData;
                }
            },
            { data: 'responsible', 
                render: function(data, type, row){
                    return row.responsible_name+' '+row.responsible_family_name
                }
            },
            { data: 'status', 
                render: function(data, type, row){
                    return ''
                }
            },
            { data: 'status', 
                render: function(data, type, row){
                    return statusProjets[data]
                }
            },
            { data: 'responsible', 
                render: function(data, type, row){
                    return ''
                }
            },
            { data: 'start_forecast', 
                render: function(data, type, row){
                    return data ? formatDateBR(data) : ''
                }
            },
            { data: 'end_forecast', 
                render: function(data, type, row){
                    return data ? formatDateBR(data) : ''
                }
            },
            { data: 'finished_at', 
                render: function(data, type, row){
                    return data ? formatDateBR(data) : ''
                }
            },
            { data: 'approved_at', 
                render: function(data, type, row){
                    return data ? formatDateBR(data) : ''
                }
            },
            // { id: 'categorieID', label: 'Categoria' },
        ]
    });

    // new-tasks nvoos 
    // todo-tasks em analise
    // inprogress-tasks em andamento
    // inreview-tasks em revisão
    // completed-tasks concluídos
    generateChart(projects)
}

async function generateChart(projects) {

    const allMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const chartSeries = [
        { name: 'Novos', data: [] },
        { name: 'Em análise', data: [] },
        { name: 'Em andamento', data: [] },
        { name: 'Em revisão', data: [] },
        { name: 'Concluídos', data: [] }
    ];

    const totalCalls = []; // Para armazenar o total de chamados por mês
    const activeMonths = []; // Para armazenar os meses que têm chamados

    for (let index = 0; index < 12; index++) {
        let hasCallsInMonth = false;
        let monthlyTotal = 0;
        const monthData = [0, 0, 0, 0, 0]; // Para armazenar os dados de cada status em um mês

        for (const project of projects) {
            const created_at = new Date(project.created_at);
            const projectMonth = created_at.getMonth();
            if (projectMonth === index) {
                hasCallsInMonth = true;

                switch (project.status) {
                    case 'new-tasks-draggable':
                        monthData[0]++;
                        break;
                    case 'todo-tasks-draggable':
                        monthData[1]++;
                        break;
                    case 'inprogress-tasks-draggable':
                        monthData[2]++;
                        break;
                    case 'inreview-tasks-draggable':
                        monthData[3]++;
                        break;
                    case 'completed-tasks-draggable':
                        monthData[4]++;
                        break;
                }

                monthlyTotal++; // Incrementa o total de chamados no mês
            }
        }

        if (hasCallsInMonth) {
            // Apenas adiciona o mês se houver chamados nele
            activeMonths.push(allMonths[index]);
            chartSeries[0].data.push(monthData[0]);
            chartSeries[1].data.push(monthData[1]);
            chartSeries[2].data.push(monthData[2]);
            chartSeries[3].data.push(monthData[3]);
            chartSeries[4].data.push(monthData[4]);
            totalCalls.push(monthlyTotal); // Armazena o total de chamados do mês
        }
    }

    // Adiciona a série da linha de total de chamados por mês
    chartSeries.push({
        name: 'Total por Mês',
        type: 'line', // Tipo linha para o total por mês
        data: totalCalls, // Usa os totais mensais
        stroke: {
            curve: 'smooth'
        },
        marker: {
            size: 10,
            hover: {
                sizeOffset: 6
            }
        }
    });

    // Configurações do gráfico
    const chartOptions = {
        series: chartSeries,
        chart: {
            toolbar: {
                show: false
            },
            height: 300,
            type: 'bar',
            stacked: false,
            fontFamily: 'Poppins, Arial, sans-serif',
        },
        grid: {
            borderColor: '#f5f4f4',
            strokeDashArray: 3
        },
        dataLabels: {
            enabled: false
        },
        title: {
            text: undefined,
        },
        xaxis: {
            categories: activeMonths // Usa apenas os meses ativos com chamados
        },
        yaxis: {
            show: true,
            axisTicks: {
                show: true,
            },
            axisBorder: {
                show: false,
                color: '#4eb6d0'
            },
            labels: {
                style: {
                    colors: '#4eb6d0',
                }
            },
            title: {
                text: undefined,
            },
            tooltip: {
                enabled: true
            }
        },
        tooltip: {
            enabled: true,
        },
        legend: {
            show: true,
            position: 'top',
            offsetX: 40,
            fontSize: '13px',
            fontWeight: 'normal',
            labels: {
                colors: '#acb1b1',
            },
            markers: {
                width: 10,
                height: 10,
            },
        },
        stroke: {
            width: [0, 0, 0, 2], // Aumenta a espessura da linha de total por mês
            curve: 'smooth', // Curva suave para a linha de total por mês
        },
        plotOptions: {
            bar: {
               borderRadius: 3,
            //    columnWidth: '%',
               horizontal: false,
               dataLabels: {
                  position: 'top',
               },
            }
         },
        colors: ["rgb(132, 90, 223)", "#ededed", "#23b7e5", "#00E396", "#FF4560", "#775DD0"] // Adiciona uma cor para a linha de total
    };

    // Renderiza o gráfico
    document.querySelector("#chart-container").innerHTML = " ";
    var chart1 = new ApexCharts(document.querySelector("#chart-container"), chartOptions);
    chart1.render();
}

// Função para listar todos os membros e a quantidade de projetos atribuídos a cada um
async function listAllMembers(projects) {
    const listusers = await makeRequest('/api/users/ListUserByDep/7');
    const teamMembers = document.querySelector('.team-members-card');
    teamMembers.innerHTML = '';

    for (let index = 0; index < listusers.length; index++) {
        const element = listusers[index];
        const memberProjects = projects.filter(project => project.atribuido.some(item => item.collaborator_id === element.collab_id));
        const projectCount = memberProjects.length;

        teamMembers.innerHTML += `<li>
            <a href="javascript:void(0)">
                <div class="d-flex align-items-center justify-content-between" style="padding: 1px; !important">
                    <div class="d-flex align-items-top"> 
                        <span class="avatar avatar-sm lh-1"> 
                            <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> 
                        </span>
                        <div class="ms-3 lh-1"> 
                            <span class="fw-semibold">${element.username} ${element.familyName}</span> 
                            <span class="d-block fs-11 text-muted mt-2">Developer</span> 
                        </div>
                    </div>
                    <div>
                        <span class="badge bg-primary">${projectCount}</span>
                    </div>
                </div>
            </a>
        </li>`;
    }
    
}

// Função que envia para a proxima janela o id do membro
async function openMember(id) {
    const body = {
        url: `/app/ti/projects-and-tickets/view?id=${id}`,
        resizable: false,
        alwaysOnTop: true
    }
    window.ipcRenderer.invoke('open-exWindow', body);
}

async function listMenssages(){
    const messages = await makeRequest('/api/called/tickets/listAllMessage', 'POST');
    const teamMembers = document.querySelector('.project-transactions-card');
    teamMembers.innerHTML = '';
    let html = '';
    for (let index = 0; index < 30; index++) {
        const element = messages[index];
        
        html += `<li>
                                    <div class="d-flex align-items-top">
                                        <div class="me-3"> <span class="avatar avatar-rounded fw-bold avatar-md bg-primary-transparent"> <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> </span> </div>
                                        <div class="flex-fill"> <span class="d-block fw-semibold">
                                        ${element.name} ${element.family_name} <span style="cursor:pointer;" class="bg-primary-transparent" onclick="editTask(${element.ticket_id})" > #${element.ticket_id} </span>
                                        </span> <span class="d-block text-muted fs-11">${element.body}</span> </div>
                                        <div>
                                           </div>
                                    </div>
                                </li>`
    }

    teamMembers.innerHTML = html
}

// Formata a data no estilo "DD/MM/YYYY HH:mm"
function formatDate(value) {
    const dataAtual = value ? new Date(value) : new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');

    return `${ano}-${mes}-${dia} ${horas}:${minutos}`;
}

// Formata a data no estilo "DD/MM/YYYY HH:mm"
function formatDateBR(value) {
    const dataAtual = value ? new Date(value) : new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

async function listCategories() {
    const categories = await makeRequest('/api/called/categories');
    let categoryList = categories.map(category => ({
        customProperties: { id: category.id },
        value: category.id,
        label: `${category.name}`,
        id: category.id
    }));



    SEditing_Categories = new Choices('select[name="edit_categories"]', {
        choices: categoryList,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
    });


    const listusers = await makeRequest('/api/users/ListUserByDep/7');
    const optionsList = listusers.map(user => ({
        customProperties: { dataHead: user.id_headcargo },
        value: user.collab_id,
        label: `${user.username} ${user.familyName}`,
        id: user.collab_id
    }));

    choicesInstanceEdit = new Choices('select[name="edit_atribuido"]', {
        choices: optionsList,
        allowHTML: true,
        allowSearch: true,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
        noResultsText: 'Não há opções disponíveis',
    });


    const users = await makeRequest('/api/users/listAllUsers');
    const selectElement = document.querySelector(`select[name="edit_responsible"]`);
    selectElement.innerHTML = '';

    users.forEach(user => {
        selectElement.innerHTML += `<option data-headcargoID="${user.id_headcargo}" id="${user.id_colab}" value="${user.id_colab}">${user.username} ${user.familyName}</option>`;
    });
}

// Função para rolar até o final de um elemento específico
function scrollToBottom(selector) {
    const element = document.querySelector(selector);
    element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth' // Faz a rolagem ser suave
    });
}

// Edita uma tarefa existente
async function editTask(taskId) {
    try {
        let data = await makeRequest('/api/called/tickets/getById', 'POST', { id: taskId });
        console.log(data)
        data = data[0];

        // Preenche os campos do modal com os dados recebidos
        
        document.querySelector('.titleProjetct').textContent = data.title+' '+'#'+data.id; 
        document.querySelector('input[name="edit_title"]').value = data.title;
        document.querySelector('textarea[name="edit_description"]').value = data.description;
        document.querySelector('select[name="edit_categories"]').value = data.categorieID;
        document.querySelector('select[name="edit_responsible"]').value = data.responsible;

        $('select[name="edit_responsible"]').val(data.responsible).trigger('change');

        SEditing_Categories.setChoiceByValue(data.categorieID);
    
        // Limpa as seleções existentes e seleciona as opções corretas
        if (choicesInstanceEdit) {
            choicesInstanceEdit.removeActiveItems();
        }

        const selectedAtribuido = data.atribuido.map(item => item.collaborator_id);
        selectedAtribuido.forEach(id => choicesInstanceEdit.setChoiceByValue(id));

        document.querySelector('input[name="edit_timeInit"]').value = data.start_forecast ? formatDate(data.start_forecast) : '';
        document.querySelector('input[name="edit_timeEnd"]').value = data.end_forecast ? formatDate(data.end_forecast) : '';
        document.querySelector('input[name="edit_finished_at"]').value = data.finished_at ? formatDate(data.finished_at) : '';
        document.querySelector('input[name="edit_approved_at"]').value = data.approved_at ? formatDate(data.approved_at) : '';

        document.querySelector('#ButtonRemoveTicket').setAttribute('data-id', taskId)
        document.querySelector('#ButtonSaveTicket').setAttribute('data-id', taskId)

        let messages = await makeRequest('/api/called/tickets/listMessage', 'POST', { id: taskId });

        for (let index = 0; index < messages.length; index++) {
            const element = messages[index];

            const messageList = `<li class="chat-item-end">
                                <div class="chat-list-inner">
                                    <div class="ms-3"> 
                                    <span class="chatting-user-info chatnameperson"> 
                                        ${element.name} <span class="msg-sent-time" style="font-size: 9px;">${formatDate(element.create_at)}</span> 
                                    </span>
                                        <div class="main-chat-msg">
                                            <div style="width: 100%;">
                                                <p class="mb-0">${element.body}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>`

            document.querySelector(`.chat-ticket`).innerHTML += messageList
        }

        setTimeout(() => {
            scrollToBottom(`.cardScrollMessage`)
        }, 500);

        // Abre o modal de edição
        new bootstrap.Modal(document.getElementById('edit-task')).show();
    } catch (error) {
        console.error('Error:', error);
    }
}


