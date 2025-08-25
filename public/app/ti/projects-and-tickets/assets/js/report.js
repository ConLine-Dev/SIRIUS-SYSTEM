let choicesInstance, choicesInstanceEdit, SCategories, SEditing_Categories;
// Função principal executada ao carregar o DOM
document.addEventListener("DOMContentLoaded", async () => {

    await listCategories();
    await getReport();
    await listMenssages();
    await getAverageCompletionTime();
    
    // Carregar anos disponíveis e depois os gráficos
    const currentYear = await loadAvailableYears();
    
    // Definir mês atual como selecionado por padrão
    const currentMonth = new Date().getMonth() + 1;
    const monthSelector = document.querySelector('#on-time-month-selector');
    if (monthSelector) {
        monthSelector.value = currentMonth;
    }
    
    await loadCompletionTimeChart(currentYear);
    await loadProjectsAnalysisChart(currentYear);
    await loadTargetVsActualChart(currentYear);
    await loadOnTimeChart(currentYear);

    introMain();
    document.querySelector('#loader2').classList.add('d-none')
    
    // Event listeners
    document.querySelector('#export-details-btn').addEventListener('click', exportDetailsToExcel);
    document.querySelector('#export-chart-data-btn').addEventListener('click', exportChartData);
    document.querySelector('#export-projects-data-btn').addEventListener('click', exportProjectsData);
    document.querySelector('#export-target-data-btn').addEventListener('click', exportTargetData);
    document.querySelector('#chart-year-selector').addEventListener('change', function() {
        loadCompletionTimeChart(this.value);
    });
    document.querySelector('#projects-year-selector').addEventListener('change', function() {
        loadProjectsAnalysisChart(this.value);
    });
    document.querySelector('#target-year-selector').addEventListener('change', function() {
        loadTargetVsActualChart(this.value);
    });
    document.querySelector('#on-time-year-selector').addEventListener('change', function() {
        loadOnTimeChart(this.value);
    });
    document.querySelector('#on-time-month-selector').addEventListener('change', function() {
        const year = document.querySelector('#on-time-year-selector').value;
        loadOnTimeChart(year);
    });
    document.querySelector('#export-on-time-data-btn').addEventListener('click', exportOnTimeData);
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
    // O gráfico agora é carregado dinamicamente com loadProjectsAnalysisChart()
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

    // Buscar dados de tempo médio por categoria
    const averageTimeData = await makeRequest('/api/called/tickets/average-completion-time');

    for (let index = 0; index < listusers.length; index++) {
        const element = listusers[index];
        const memberProjects = projects.filter(project => project.atribuido.some(item => item.collaborator_id === element.collab_id));
        const projectCount = memberProjects.length;

        // Agrupar projetos por categoria (seguindo a mesma lógica do backend)
        const projectsByCategory = {};
        memberProjects.forEach(project => {
            const category = project.category || 'Sem Categoria';
            if (!projectsByCategory[category]) {
                projectsByCategory[category] = {
                    totalTickets: 0,
                    completedTickets: 0,
                    totalTime: 0,
                    completedProjectsWithTime: 0
                };
            }
            
            // Contar todos os tickets da categoria
            projectsByCategory[category].totalTickets++;
            
            // Se o ticket está concluído, aplicar a mesma lógica do backend
            if (project.status === 'completed-tasks-draggable') {
                projectsByCategory[category].completedTickets++;
                
                let timeDiff = 0;
                if (project.start_forecast && project.end_forecast) {
                    const startDate = new Date(project.start_forecast);
                    const endDate = new Date(project.end_forecast);
                    timeDiff = (endDate - startDate) / (1000 * 60 * 60); // em horas
                } else {
                    // 10 minutos (0.167 horas) para tickets sem previsão
                    timeDiff = 0.167;
                }
                
                projectsByCategory[category].totalTime += timeDiff;
                projectsByCategory[category].completedProjectsWithTime++;
            }
        });

        // Calcular estatísticas gerais do membro (apenas tickets concluídos)
        let memberTotalTime = 0;
        let memberCompletedProjectsWithTime = 0;
        Object.values(projectsByCategory).forEach(cat => {
            memberTotalTime += cat.totalTime;
            memberCompletedProjectsWithTime += cat.completedProjectsWithTime;
        });

        const memberAvgTime = memberCompletedProjectsWithTime > 0 ? (memberTotalTime / memberCompletedProjectsWithTime) : 0;
        const memberTimeText = formatTimeText(memberAvgTime);
        const memberTimeClass = getTimeClass(memberAvgTime);

        // Criar HTML das categorias (apenas categorias com tickets concluídos)
        let categoriesHTML = '';
        let hasCompletedCategories = false;
        
        Object.entries(projectsByCategory).forEach(([category, data]) => {
            // Só mostrar categorias que têm tickets concluídos
            if (data.completedTickets > 0) {
                hasCompletedCategories = true;
                const avgTime = data.completedProjectsWithTime > 0 ? (data.totalTime / data.completedProjectsWithTime) : 0;
                const timeText = formatTimeText(avgTime);
                const timeClass = getTimeClass(avgTime);
                
                categoriesHTML += `
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${category}</small>
                        <div class="d-flex gap-1">
                            <span class="badge bg-secondary-transparent fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Tickets concluídos nesta categoria">${data.completedTickets}</span>
                            <span class="badge ${timeClass} fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Tempo médio baseado na previsão">${timeText}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        // Se não há categorias com tickets concluídos, mostrar mensagem
        if (!hasCompletedCategories) {
            categoriesHTML = `
                <div class="text-center text-muted">
                    <small>Nenhum projeto concluído ainda</small>
                </div>
            `;
        }
       

        teamMembers.innerHTML += `<li class="member-item" data-member-id="${element.collab_id}">
            <div class="d-flex align-items-center justify-content-between p-2">
                <div class="d-flex align-items-center flex-grow-1"> 
                    <span class="avatar avatar-sm lh-1 me-2"> 
                        <img src="https://cdn.conlinebr.com.br/colaboradores/${element.id_headcargo}" alt=""> 
                    </span>
                    <div class="flex-grow-1"> 
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="fw-semibold fs-13">${element.username} ${element.familyName}</span> 
                                <span class="d-block fs-11 text-muted">${element.jobPosition}</span> 
                            </div>
                            <div class="text-end me-2">
                                <div class="d-flex align-items-center gap-1">
                                    <span class="badge bg-primary-transparent fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Total de projetos atribuídos">${projectCount}</span>
                                    <span class="badge ${memberTimeClass} fs-10" data-bs-toggle="tooltip" data-bs-placement="top" title="Tempo médio de finalização (apenas projetos concluídos)">${memberTimeText}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Detalhes por categoria (expandível) -->
                        <div class="categories-details mt-2" style="display: none;">
                            <small class="text-muted d-block mb-1">Detalhes por categoria:</small>
                            ${categoriesHTML}
                        </div>
                    </div>
                </div>
                <div class="ms-2">
                    <button class="btn btn-sm btn-outline-primary btn-toggle-details" data-bs-toggle="tooltip" data-bs-placement="left" title="Ver detalhes por categoria">
                        <i class="bi bi-chevron-down"></i>
                    </button>
                </div>
            </div>
        </li>`;
    }
    
    // Adicionar eventos para expandir/colapsar detalhes
    teamMembers.querySelectorAll('.btn-toggle-details').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const memberItem = this.closest('.member-item');
            const detailsDiv = memberItem.querySelector('.categories-details');
            const icon = this.querySelector('i');
            
            if (detailsDiv.style.display === 'none') {
                detailsDiv.style.display = 'block';
                icon.className = 'bi bi-chevron-up';
                this.setAttribute('data-bs-title', 'Ocultar detalhes por categoria');
            } else {
                detailsDiv.style.display = 'none';
                icon.className = 'bi bi-chevron-down';
                this.setAttribute('data-bs-title', 'Ver detalhes por categoria');
            }
            
            // Atualizar tooltip
            const tooltip = bootstrap.Tooltip.getInstance(this);
            if (tooltip) {
                tooltip.dispose();
                new bootstrap.Tooltip(this);
            }
        });
    });
    
    // Inicializar tooltips dos membros
    const tooltipTriggerList = teamMembers.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// Função para carregar anos disponíveis dinamicamente
async function loadAvailableYears() {
    try {
        const chartSelector = document.querySelector('#chart-year-selector');
        const projectsSelector = document.querySelector('#projects-year-selector');
        const targetSelector = document.querySelector('#target-year-selector');
        const onTimeSelector = document.querySelector('#on-time-year-selector');
        
        // Mostrar loading em todos os seletores
        chartSelector.innerHTML = '<option>Carregando...</option>';
        projectsSelector.innerHTML = '<option>Carregando...</option>';
        targetSelector.innerHTML = '<option>Carregando...</option>';
        onTimeSelector.innerHTML = '<option>Carregando...</option>';
        chartSelector.disabled = true;
        projectsSelector.disabled = true;
        targetSelector.disabled = true;
        onTimeSelector.disabled = true;
        
        const years = await makeRequest('/api/called/tickets/available-years');
        
        if (years && years.length > 0) {
            // Limpar opções existentes em todos os seletores
            chartSelector.innerHTML = '';
            projectsSelector.innerHTML = '';
            targetSelector.innerHTML = '';
            onTimeSelector.innerHTML = '';
            
            // Adicionar anos disponíveis (mais recente primeiro) em todos os seletores
            years.forEach(year => {
                const option1 = document.createElement('option');
                option1.value = year;
                option1.textContent = year;
                chartSelector.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = year;
                option2.textContent = year;
                projectsSelector.appendChild(option2);
                
                const option3 = document.createElement('option');
                option3.value = year;
                option3.textContent = year;
                targetSelector.appendChild(option3);
                
                const option4 = document.createElement('option');
                option4.value = year;
                option4.textContent = year;
                onTimeSelector.appendChild(option4);
            });
            
            // Selecionar o ano mais recente por padrão em todos
            chartSelector.value = years[0];
            projectsSelector.value = years[0];
            targetSelector.value = years[0];
            onTimeSelector.value = years[0];
            chartSelector.disabled = false;
            projectsSelector.disabled = false;
            targetSelector.disabled = false;
            onTimeSelector.disabled = false;
            
            return years[0]; // Retorna o ano mais recente
        } else {
            // Fallback se não houver dados
            chartSelector.innerHTML = '<option value="2024">2024</option>';
            projectsSelector.innerHTML = '<option value="2024">2024</option>';
            targetSelector.innerHTML = '<option value="2024">2024</option>';
            onTimeSelector.innerHTML = '<option value="2024">2024</option>';
            chartSelector.disabled = false;
            projectsSelector.disabled = false;
            targetSelector.disabled = false;
            onTimeSelector.disabled = false;
            return 2024;
        }
    } catch (error) {
        console.error('Erro ao carregar anos disponíveis:', error);
        
        // Fallback em caso de erro
        const chartSelector = document.querySelector('#chart-year-selector');
        const projectsSelector = document.querySelector('#projects-year-selector');
        const targetSelector = document.querySelector('#target-year-selector');
        const onTimeSelector = document.querySelector('#on-time-year-selector');
        chartSelector.innerHTML = '<option value="2024">2024</option>';
        projectsSelector.innerHTML = '<option value="2024">2024</option>';
        targetSelector.innerHTML = '<option value="2024">2024</option>';
        onTimeSelector.innerHTML = '<option value="2024">2024</option>';
        chartSelector.disabled = false;
        projectsSelector.disabled = false;
        targetSelector.disabled = false;
        onTimeSelector.disabled = false;
        
        return 2024;
    }
}

// Função para carregar e exibir o gráfico de análise de projetos
async function loadProjectsAnalysisChart(year = 2024) {
    try {
        const data = await makeRequest(`/api/called/tickets/projects-analysis-by-year?year=${year}`);
        const container = document.querySelector('#chart-container');
        
        if (!data.monthlyData || data.monthlyData.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-info-circle fs-3"></i>
                    <p class="mt-2">Nenhum dado disponível para ${year}</p>
                </div>
            `;
            return;
        }

        // Preparar dados para o gráfico - quantidade de chamados abertos por mês
        const chartData = data.monthlyData.map(item => item.totalTickets);
        const categories = data.monthlyData.map(item => item.monthName);
        
        // Preparar dados detalhados por categoria para tooltips
        const detailedData = data.monthlyData.map(item => ({
            month: item.monthName,
            total: item.totalTickets,
            categories: item.categories
        }));

        // Configurações do gráfico
        const chartOptions = {
            series: [{
                name: 'Quantidade de Chamados',
                data: chartData
            }],
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                }
            },
            colors: ["#3B82F6"],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '70%',
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return val;
                },
                style: {
                    fontSize: '12px',
                    colors: ["#304758"]
                }
            },
            xaxis: {
                categories: categories,
                title: {
                    text: 'Mês'
                },
                labels: {
                    style: {
                        fontSize: '12px',
                        fontFamily: 'Arial, sans-serif'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Número de Chamados'
                },
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const data = detailedData[dataPointIndex];
                    let html = `
                        <div class="custom-tooltip">
                            <div class="tooltip-header">
                                <strong>${data.month} ${year}</strong>
                            </div>
                            <div class="tooltip-content">
                                <div class="tooltip-total">
                                    <strong>Total: ${data.total} chamados</strong>
                                </div>
                                <div class="tooltip-categories">
                                    <strong>Por categoria:</strong>
                    `;
                    
                    // Adicionar detalhes por categoria
                    Object.entries(data.categories).forEach(([category, count]) => {
                        html += `<div>• ${category}: ${count}</div>`;
                    });
                    
                    html += `
                                </div>
                            </div>
                        </div>
                    `;
                    
                    return html;
                }
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            },
            responsive: [{
                breakpoint: 600,
                options: {
                    chart: {
                        height: 300
                    },
                    dataLabels: {
                        enabled: false
                    }
                }
            }]
        };

        // Renderizar o gráfico
        container.innerHTML = '';
        const chart = new ApexCharts(container, chartOptions);
        chart.render();

    } catch (error) {
        console.error('Erro ao carregar gráfico de análise de projetos:', error);
        const container = document.querySelector('#chart-container');
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="bi bi-exclamation-triangle fs-3"></i>
                <p class="mt-2">Erro ao carregar dados do gráfico</p>
            </div>
        `;
    }
}

// Função para exportar dados de análise de projetos
async function exportProjectsData() {
    try {
        const year = document.querySelector('#projects-year-selector').value;
        const btn = document.querySelector('#export-projects-data-btn');
        btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Exportando...';
        btn.disabled = true;

        const data = await makeRequest(`/api/called/tickets/projects-analysis-by-year?year=${year}`);
        
        if (!data.monthlyData || data.monthlyData.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhum dado encontrado',
                text: `Não há dados para exportar em ${year}.`
            });
            return;
        }

        // Criar workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Chamados por Mês');

        // Definir colunas
        worksheet.columns = [
            { header: 'Mês', key: 'month', width: 15 },
            { header: 'Total de Chamados', key: 'total', width: 20 }
        ];

        // Adicionar colunas dinâmicas para categorias
        data.categories.forEach(category => {
            worksheet.columns.push({
                header: category,
                key: category.toLowerCase().replace(/\s+/g, '_'),
                width: 20
            });
        });

        // Adicionar dados
        data.monthlyData.forEach(item => {
            const rowData = {
                month: item.monthName,
                total: item.totalTickets
            };
            
            // Adicionar dados por categoria
            data.categories.forEach(category => {
                const key = category.toLowerCase().replace(/\s+/g, '_');
                rowData[key] = item.categories[category] || 0;
            });
            
            worksheet.addRow(rowData);
        });

        // Estilizar cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Gerar arquivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chamados_abertos_por_mes_${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Sucesso
        Swal.fire({
            icon: 'success',
            title: 'Exportação concluída!',
            text: `Arquivo exportado com dados de ${year}.`
        });

    } catch (error) {
        console.error('Erro ao exportar dados de análise de projetos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro na exportação',
            text: 'Ocorreu um erro ao exportar os dados.'
        });
    } finally {
        // Restaurar botão
        const btn = document.querySelector('#export-projects-data-btn');
        btn.innerHTML = '<i class="bi bi-download me-1"></i>Exportar Dados';
        btn.disabled = false;
    }
}

// Função para carregar e exibir o gráfico de meta vs realizado
async function loadTargetVsActualChart(year = 2024) {
    try {
        const data = await makeRequest(`/api/called/tickets/completion-time-target-by-category?year=${year}`);
        const container = document.querySelector('#target-vs-actual-chart-container');
        
        if (!data.monthlyData || data.monthlyData.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-info-circle fs-3"></i>
                    <p class="mt-2">Nenhum dado disponível para ${year}</p>
                </div>
            `;
            return;
        }

        // Preparar dados para o gráfico
        const chartData = [
            {
                name: 'Tempo Médio de Conclusão',
                type: 'bar',
                data: data.monthlyData.map(item => item.actualHours)
            },
            {
                name: 'Meta Geral',
                type: 'line',
                data: data.monthlyData.map(item => item.targetHours)
            }
        ];
        
        const months = data.monthlyData.map(item => item.monthName);

        // Configurações do gráfico
        const chartOptions = {
            series: chartData,
            chart: {
                height: 350,
                type: 'bar',
                stacked: false,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                }
            },
            colors: ['#3B82F6', '#FF4560'],
            stroke: {
                width: [0, 4], // 0 para barras, 4 para linha
                curve: 'smooth',
                dashArray: [0, 8] // 0 para barras, 8 para linha tracejada
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '60%',
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            dataLabels: {
                enabled: true,
                enabledOnSeries: [0], // Apenas nas barras
                formatter: function (val) {
                    return val > 0 ? val.toFixed(1) : '';
                },
                style: {
                    fontSize: '10px',
                    colors: ["#304758"]
                }
            },
            xaxis: {
                categories: months,
                title: {
                    text: 'Mês'
                },
                labels: {
                    style: {
                        fontSize: '12px',
                        fontFamily: 'Arial, sans-serif'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Tempo (Horas)'
                },
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            tooltip: {
                shared: false,
                intersect: true,
                enabled: true,
                followCursor: false,
                hideEmptySeries: false,
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const monthData = data.monthlyData[dataPointIndex];
                    const isTarget = seriesIndex === 1; // A segunda série é a meta
                    
                    if (isTarget) {
                        return `
                            <div class="custom-tooltip">
                                <div class="tooltip-header">
                                    <strong>Meta Adaptativa Geral</strong>
                                </div>
                                <div class="tooltip-content">
                                    <div class="tooltip-target">
                                        <strong>Meta Final: ${monthData.targetHours.toFixed(1)}h</strong>
                                    </div>
                                    <div class="tooltip-breakdown">
                                        <div class="tooltip-item">
                                            <span class="tooltip-label">Média Histórica:</span>
                                            <span class="tooltip-value">${monthData.avgHours ? monthData.avgHours.toFixed(1) : '0.0'}h</span>
                                        </div>
                                        <div class="tooltip-item">
                                            <span class="tooltip-label">Fator Crescimento:</span>
                                            <span class="tooltip-value ${monthData.growthFactor > 0 ? 'text-success' : monthData.growthFactor < 0 ? 'text-danger' : 'text-muted'}">
                                                ${monthData.growthFactor > 0 ? '+' : ''}${(monthData.growthFactor * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div class="tooltip-item">
                                            <span class="tooltip-label">Tickets Anteriores:</span>
                                            <span class="tooltip-value">${monthData.totalTickets || 0}</span>
                                        </div>
                                        ${monthData.currentMonthTickets > 0 ? `
                                        <div class="tooltip-item">
                                            <span class="tooltip-label">Tickets Atuais:</span>
                                            <span class="tooltip-value">${monthData.currentMonthTickets}</span>
                                        </div>
                                        <div class="tooltip-item">
                                            <span class="tooltip-label">Média/Mês:</span>
                                            <span class="tooltip-value">${monthData.avgTicketsPerMonth ? monthData.avgTicketsPerMonth.toFixed(1) : '0.0'}</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                    <div class="tooltip-formula">
                                        <small>Fórmula: ${monthData.avgHours ? monthData.avgHours.toFixed(1) : '0.0'}h × (1 + ${(monthData.growthFactor * 100).toFixed(1)}%) = ${monthData.targetHours.toFixed(1)}h</small>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        let categoriesHtml = '';
                        if (monthData.categories && Object.keys(monthData.categories).length > 0) {
                            categoriesHtml = `
                                <div class="tooltip-categories">
                                    <strong>Detalhes por categoria:</strong>
                            `;
                            
                            // Ordenar categorias por quantidade de tickets (maior primeiro)
                            const sortedCategories = Object.entries(monthData.categories)
                                .sort(([,a], [,b]) => b.tickets - a.tickets);
                            
                            // Mostrar todas as categorias (sem limite)
                            const categoriesToShow = sortedCategories; // Mostrar todas as categorias
                            const hasMoreCategories = false; // Sempre mostrar todas
                            
                            categoriesToShow.forEach(([category, details]) => {
                                const categoryTarget = details.targetHours || monthData.targetHours;
                                const performance = details.hours <= categoryTarget ? '✅' : '❌';
                                const categoryGrowthFactor = details.growthFactor || 0;
                                const categoryAvgHours = details.avgHours || 0;
                                
                                categoriesHtml += `
                                    <div class="tooltip-category-item">
                                        <span class="tooltip-category-name">• ${category}:</span>
                                        <span class="tooltip-category-details">
                                            ${details.hours.toFixed(1)}h (${details.tickets} tickets)
                                        </span>
                                        <span class="tooltip-category-target">
                                            Meta: ${categoryTarget.toFixed(1)}h ${performance}
                                        </span>
                                        <span class="tooltip-category-breakdown">
                                            <small>
                                                Média: ${categoryAvgHours.toFixed(1)}h | 
                                                Crescimento: <span class="${categoryGrowthFactor > 0 ? 'text-success' : categoryGrowthFactor < 0 ? 'text-danger' : 'text-muted'}">
                                                    ${categoryGrowthFactor > 0 ? '+' : ''}${(categoryGrowthFactor * 100).toFixed(1)}%
                                                </span>
                                            </small>
                                        </span>
                                    </div>
                                `;
                            });
                            
                            if (hasMoreCategories) {
                                const remainingCount = sortedCategories.length - maxCategories;
                                categoriesHtml += `
                                    <div class="tooltip-category-more">
                                        <em>... e mais ${remainingCount} categoria(s)</em>
                                    </div>
                                `;
                            }
                            
                            categoriesHtml += '</div>';
                        }
                        
                        return `
                            <div class="custom-tooltip">
                                <div class="tooltip-header">
                                    <strong>${monthData.monthName} ${year}</strong>
                                </div>
                                <div class="tooltip-content">
                                    <div class="tooltip-summary">
                                        <div class="tooltip-summary-main">
                                            <div class="tooltip-actual">
                                                <strong>Geral: ${monthData.actualHours.toFixed(1)}h</strong>
                                            </div>
                                            <div class="tooltip-target">
                                                <strong>Meta: ${monthData.targetHours.toFixed(1)}h</strong>
                                            </div>
                                            <div class="tooltip-tickets">
                                                <strong>(${monthData.completedTickets} tickets)</strong>
                                            </div>
                                            <div class="tooltip-performance">
                                                ${monthData.actualHours <= monthData.targetHours ? '✅' : '❌'}
                                            </div>
                                        </div>
                                        <div class="tooltip-growth">
                                            <small>
                                                <strong>Crescimento Geral:</strong> 
                                                <span class="${monthData.growthFactor > 0 ? 'text-success' : monthData.growthFactor < 0 ? 'text-danger' : 'text-muted'}">
                                                    ${monthData.growthFactor > 0 ? '+' : ''}${(monthData.growthFactor * 100).toFixed(1)}%
                                                </span>
                                            </small>
                                        </div>
                                        <div class="tooltip-total-calls">
                                            <small>
                                                <strong>Total de Chamados:</strong> 
                                                ${monthData.totalTickets || 0} tickets (até mês anterior)
                                            </small>
                                        </div>
                                    </div>
                                    ${categoriesHtml}
                                </div>
                            </div>
                        `;
                    }
                }
            },
            markers: {
                size: [0, 6], // 0 para barras, 6 para linha
                colors: ['#3B82F6', '#FF4560'],
                strokeColors: ['#3B82F6', '#FF4560'],
                strokeWidth: [0, 2]
            },
            legend: {
                show: true,
                position: 'top',
                fontSize: '12px',
                markers: {
                    width: 12,
                    height: 12
                }
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            },
            responsive: [{
                breakpoint: 600,
                options: {
                    chart: {
                        height: 300
                    },
                    dataLabels: {
                        enabled: false
                    }
                }
            }]
        };

        // Renderizar o gráfico
        container.innerHTML = '';
        const chart = new ApexCharts(container, chartOptions);
        chart.render();

    } catch (error) {
        console.error('Erro ao carregar gráfico de meta vs realizado:', error);
        const container = document.querySelector('#target-vs-actual-chart-container');
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="bi bi-exclamation-triangle fs-3"></i>
                <p class="mt-2">Erro ao carregar dados do gráfico</p>
            </div>
        `;
    }
}

// Função para exportar dados de meta vs realizado
async function exportTargetData() {
    try {
        const year = document.querySelector('#target-year-selector').value;
        const btn = document.querySelector('#export-target-data-btn');
        btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Exportando...';
        btn.disabled = true;

        const data = await makeRequest(`/api/called/tickets/completion-time-target-by-category?year=${year}`);
        
        if (!data.monthlyData || data.monthlyData.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhum dado encontrado',
                text: `Não há dados para exportar em ${year}.`
            });
            return;
        }

        // Criar workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Meta vs Realizado');

        // Definir colunas
        worksheet.columns = [
            { header: 'Mês', key: 'month', width: 15 },
            { header: 'Meta (Horas)', key: 'target', width: 15 },
            { header: 'Realizado (Horas)', key: 'actual', width: 15 },
            { header: 'Diferença', key: 'difference', width: 15 },
            { header: 'Performance', key: 'performance', width: 15 },
            { header: 'Tickets Concluídos', key: 'tickets', width: 20 },
            { header: 'Categoria', key: 'category', width: 25 },
            { header: 'Tempo Categoria (Horas)', key: 'category_hours', width: 20 },
            { header: 'Tickets Categoria', key: 'category_tickets', width: 20 },
            { header: 'Performance Categoria', key: 'category_performance', width: 20 }
        ];

        // Adicionar dados
        data.monthlyData.forEach(monthData => {
            const target = monthData.targetHours;
            const actual = monthData.actualHours;
            const difference = actual - target;
            const performance = actual <= target ? 'Dentro da Meta' : 'Acima da Meta';
            
            // Dados gerais do mês
            worksheet.addRow({
                month: monthData.monthName,
                target: target.toFixed(1),
                actual: actual.toFixed(1),
                difference: difference.toFixed(1),
                performance: performance,
                tickets: monthData.completedTickets,
                category: 'GERAL',
                category_hours: actual.toFixed(1),
                category_tickets: monthData.completedTickets,
                category_performance: performance
            });
            
            // Dados por categoria
            if (monthData.categories) {
                Object.entries(monthData.categories).forEach(([category, details]) => {
                    const categoryTarget = details.targetHours || target;
                    const categoryPerformance = details.hours <= categoryTarget ? 'Dentro da Meta' : 'Acima da Meta';
                    worksheet.addRow({
                        month: '',
                        target: '',
                        actual: '',
                        difference: '',
                        performance: '',
                        tickets: '',
                        category: category,
                        category_hours: details.hours.toFixed(1),
                        category_tickets: details.tickets,
                        category_performance: categoryPerformance
                    });
                });
            }
        });

        // Estilizar cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Gerar arquivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meta_vs_realizado_${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Sucesso
        Swal.fire({
            icon: 'success',
            title: 'Exportação concluída!',
            text: `Arquivo exportado com dados de ${year}.`
        });

    } catch (error) {
        console.error('Erro ao exportar dados de meta vs realizado:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro na exportação',
            text: 'Ocorreu um erro ao exportar os dados.'
        });
    } finally {
        // Restaurar botão
        const btn = document.querySelector('#export-target-data-btn');
        btn.innerHTML = '<i class="bi bi-download me-1"></i>Exportar Dados';
        btn.disabled = false;
    }
}

// Função para carregar e exibir o gráfico de tempo médio por mês e categoria
async function loadCompletionTimeChart(year = 2024) {
    try {
        const data = await makeRequest(`/api/called/tickets/completion-time-by-month-category?year=${year}`);
        const container = document.querySelector('#completion-time-chart-container');
        
        if (!data.monthlyData || data.monthlyData.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-info-circle fs-3"></i>
                    <p class="mt-2">Nenhum dado disponível para ${year}</p>
                </div>
            `;
            return;
        }

        // Preparar dados para o gráfico
        const chartData = [];
        const categories = data.categories;
        
        // Para cada categoria, criar uma série de dados
        categories.forEach(category => {
            const seriesData = [];
            
            data.monthlyData.forEach(monthData => {
                const categoryData = monthData.categories[category];
                if (categoryData) {
                    seriesData.push(categoryData.avgCompletionHours);
                } else {
                    seriesData.push(0);
                }
            });
            
            chartData.push({
                name: category,
                data: seriesData
            });
        });

        // Configurações do gráfico
        const chartOptions = {
            series: chartData,
            chart: {
                type: 'line',
                height: 350,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                }
            },
            colors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"],
            stroke: {
                curve: 'smooth',
                width: 3
            },
            markers: {
                size: 5,
                hover: {
                    size: 7
                }
            },
            xaxis: {
                categories: data.monthlyData.map(item => item.monthName),
                title: {
                    text: 'Mês'
                },
                labels: {
                    style: {
                        fontSize: '12px',
                        fontFamily: 'Arial, sans-serif'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Tempo Médio (Horas)'
                },
                labels: {
                    formatter: function(value) {
                        if (value < 1) {
                            return `${Math.round(value * 60)}min`;
                        } else if (value < 24) {
                            return `${value.toFixed(1)}h`;
                        } else {
                            return `${(value / 24).toFixed(1)}d`;
                        }
                    }
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function(value) {
                        if (value < 1) {
                            return `${Math.round(value * 60)} minutos`;
                        } else if (value < 24) {
                            return `${value.toFixed(1)} horas`;
                        } else {
                            return `${(value / 24).toFixed(1)} dias`;
                        }
                    }
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'left',
                fontSize: '14px'
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            },
            responsive: [{
                breakpoint: 600,
                options: {
                    chart: {
                        height: 300
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        // Renderizar o gráfico
        container.innerHTML = '';
        const chart = new ApexCharts(container, chartOptions);
        chart.render();

    } catch (error) {
        console.error('Erro ao carregar gráfico de tempo médio:', error);
        const container = document.querySelector('#completion-time-chart-container');
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="bi bi-exclamation-triangle fs-3"></i>
                <p class="mt-2">Erro ao carregar dados do gráfico</p>
            </div>
        `;
    }
}

// Função para exportar dados do gráfico
async function exportChartData() {
    try {
        const year = document.querySelector('#chart-year-selector').value;
        const btn = document.querySelector('#export-chart-data-btn');
        btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Exportando...';
        btn.disabled = true;

        const data = await makeRequest(`/api/called/tickets/export-completion-time-chart-data?year=${year}`);
        
        if (!data || data.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhum dado encontrado',
                text: `Não há dados para exportar em ${year}.`
            });
            return;
        }

        // Criar workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tempo Médio por Mês e Categoria');

        // Definir colunas
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Título', key: 'title', width: 40 },
            { header: 'Categoria', key: 'category', width: 25 },
            { header: 'Mês', key: 'month', width: 15 },
            { header: 'Nome do Mês', key: 'monthName', width: 20 },
            { header: 'Previsão Início', key: 'startForecast', width: 20 },
            { header: 'Previsão Fim', key: 'endForecast', width: 20 },
            { header: 'Criado em', key: 'createdAt', width: 20 },
            { header: 'Finalizado em', key: 'finishedAt', width: 20 },
            { header: 'Tem Previsão', key: 'hasForecast', width: 15 },
            { header: 'Tempo (Horas)', key: 'completionHours', width: 15 },
            { header: 'Tempo (Dias)', key: 'completionDays', width: 15 }
        ];

        // Adicionar dados
        data.forEach(item => {
            worksheet.addRow({
                id: item.id,
                title: item.title,
                category: item.category,
                month: item.month,
                monthName: item.monthName,
                startForecast: item.startForecast ? formatDateBR(item.startForecast) : 'N/A',
                endForecast: item.endForecast ? formatDateBR(item.endForecast) : 'N/A',
                createdAt: formatDateBR(item.createdAt),
                finishedAt: formatDateBR(item.finishedAt),
                hasForecast: item.hasForecast,
                completionHours: item.completionHours,
                completionDays: item.completionDays
            });
        });

        // Estilizar cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Gerar arquivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tempo_medio_mes_categoria_${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Sucesso
        Swal.fire({
            icon: 'success',
            title: 'Exportação concluída!',
            text: `Arquivo exportado com ${data.length} registros de ${year}.`
        });

    } catch (error) {
        console.error('Erro ao exportar dados do gráfico:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro na exportação',
            text: 'Ocorreu um erro ao exportar os dados do gráfico.'
        });
    } finally {
        // Restaurar botão
        const btn = document.querySelector('#export-chart-data-btn');
        btn.innerHTML = '<i class="bi bi-download me-1"></i>Exportar Dados';
        btn.disabled = false;
    }
}

// Função auxiliar para formatar texto de tempo
function formatTimeText(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)}min`;
    } else if (hours < 24) {
        return `${hours.toFixed(1)}h`;
    } else {
        return `${(hours / 24).toFixed(1)}d`;
    }
}

// Função auxiliar para determinar classe de cor baseada no tempo
function getTimeClass(hours) {
    if (hours < 12) {
        return 'bg-success-transparent';
    } else if (hours < 24) {
        return 'bg-warning-transparent';
    } else if (hours < 168) {
        return 'bg-info-transparent';
    } else {
        return 'bg-danger-transparent';
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

// Função para carregar e exibir o tempo médio de finalização por categoria
async function getAverageCompletionTime() {
    try {
        const data = await makeRequest('/api/called/tickets/average-completion-time');
        const container = document.querySelector('#average-completion-time');
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-info-circle fs-3"></i>
                    <p class="mt-2">Nenhum dado disponível</p>
                </div>
            `;
            return;
        }

        let html = '';
        data.forEach((item, index) => {
            // Determina a cor do badge baseado no tempo médio
            let badgeClass = 'bg-success-transparent';
            let timeText = '';
            
            // Lógica para exibir o tempo de forma apropriada
            if (item.avgCompletionHours < 1) {
                // Menos de 1 hora - exibe em minutos
                const minutes = Math.round(item.avgCompletionHours * 60);
                timeText = `${minutes}min`;
                badgeClass = 'bg-success-transparent';
            } else if (item.avgCompletionHours >= 1 && item.avgCompletionHours < 24) {
                // Entre 1 hora e 1 dia - exibe em horas
                timeText = `${item.avgCompletionHours.toFixed(1)}h`;
                if (item.avgCompletionHours > 12) {
                    badgeClass = 'bg-warning-transparent';
                } else {
                    badgeClass = 'bg-success-transparent';
                }
            } else if (item.avgCompletionHours >= 24 && item.avgCompletionHours < 168) {
                // Entre 1 dia e 7 dias
                timeText = `${item.avgCompletionDays.toFixed(1)}d`;
                badgeClass = 'bg-info-transparent';
            } else {
                // Mais de 7 dias
                timeText = `${item.avgCompletionDays.toFixed(1)}d`;
                badgeClass = 'bg-danger-transparent';
            }

            html += `
                <div class="d-flex align-items-center justify-content-between mb-2 ${index < data.length - 1 ? 'border-bottom pb-2' : ''}">
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm bg-primary-transparent rounded-circle me-2">
                            <i class="bi bi-clock fs-12"></i>
                        </div>
                        <div>
                            <h6 class="mb-0 fs-13">${item.category}</h6>
                            <small class="text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="Quantidade de tickets concluídos nesta categoria">${item.completedTickets} concluídos</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge ${badgeClass} fs-11" data-bs-toggle="tooltip" data-bs-placement="top" title="Tempo médio de finalização baseado na previsão de início e fim">${timeText}</span>
                        <div class="small text-muted" data-bs-toggle="tooltip" data-bs-placement="top" title="Porcentagem de tickets concluídos em relação ao total da categoria">${item.completionRate}% taxa</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        
        // Inicializar tooltips
        const tooltipTriggerList = container.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    } catch (error) {
        console.error('Erro ao carregar tempo médio de finalização:', error);
        const container = document.querySelector('#average-completion-time');
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="bi bi-exclamation-triangle fs-3"></i>
                <p class="mt-2">Erro ao carregar dados</p>
            </div>
        `;
    }
}

// Função para exportar detalhes para Excel
async function exportDetailsToExcel() {
    try {
        // Mostrar loading no botão
        const btn = document.querySelector('#export-details-btn');
        btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Exportando...';
        btn.disabled = true;

        // Buscar dados da API
        const data = await makeRequest('/api/called/tickets/export-average-completion-details');
        
        if (!data || data.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhum dado encontrado',
                text: 'Não há dados para exportar.'
            });
            return;
        }

        // Criar workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Detalhes Tempo Médio');

        // Definir colunas
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Título', key: 'title', width: 40 },
            { header: 'Categoria', key: 'category', width: 25 },
            { header: 'Previsão Início', key: 'startForecast', width: 20 },
            { header: 'Previsão Fim', key: 'endForecast', width: 20 },
            { header: 'Criado em', key: 'createdAt', width: 20 },
            { header: 'Finalizado em', key: 'finishedAt', width: 20 },
            { header: 'Tem Previsão', key: 'hasForecast', width: 15 },
            { header: 'Tempo (Horas)', key: 'completionHours', width: 15 },
            { header: 'Tempo (Dias)', key: 'completionDays', width: 15 }
        ];

        // Adicionar dados
        data.forEach(item => {
            worksheet.addRow({
                id: item.id,
                title: item.title,
                category: item.category,
                startForecast: item.startForecast ? formatDateBR(item.startForecast) : 'N/A',
                endForecast: item.endForecast ? formatDateBR(item.endForecast) : 'N/A',
                createdAt: formatDateBR(item.createdAt),
                finishedAt: item.finishedAt ? formatDateBR(item.finishedAt) : 'N/A',
                hasForecast: item.hasForecast,
                completionHours: item.completionHours,
                completionDays: item.completionDays
            });
        });

        // Estilizar cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Gerar arquivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tempo_medio_finalizacao_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Sucesso
        Swal.fire({
            icon: 'success',
            title: 'Exportação concluída!',
            text: `Arquivo exportado com ${data.length} registros.`
        });

    } catch (error) {
        console.error('Erro ao exportar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro na exportação',
            text: 'Ocorreu um erro ao exportar os dados.'
        });
    } finally {
        // Restaurar botão
        const btn = document.querySelector('#export-details-btn');
        btn.innerHTML = '<i class="bi bi-download me-1"></i>Exportar Detalhes';
        btn.disabled = false;
    }
}

// Função para exportar dados do gráfico de chamados dentro do prazo
async function exportOnTimeData() {
    try {
        // Mostrar loading no botão
        const btn = document.querySelector('#export-on-time-data-btn');
        btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Exportando...';
        btn.disabled = true;

        const year = document.querySelector('#on-time-year-selector').value;
        const month = document.querySelector('#on-time-month-selector').value;
        
        // Buscar dados da API
        const data = await makeRequest(`/api/called/tickets/on-time-completion-rate?year=${year}&month=${month}`);
        
        if (!data || !data.details || data.details.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhum dado encontrado',
                text: 'Não há dados para exportar.'
            });
            return;
        }

        // Criar workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Chamados Dentro do Prazo');

        // Definir colunas
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Título', key: 'title', width: 40 },
            { header: 'Categoria', key: 'category', width: 25 },
            { header: 'Previsão Início', key: 'startForecast', width: 20 },
            { header: 'Previsão Fim', key: 'endForecast', width: 20 },
            { header: 'Finalizado em', key: 'finishedAt', width: 20 },
            { header: 'Tempo Previsto (h)', key: 'forecastHours', width: 20 },
            { header: 'Tempo Real (h)', key: 'actualHours', width: 20 },
            { header: 'Dentro do Prazo', key: 'isOnTime', width: 15 }
        ];

        // Adicionar dados
        data.details.forEach(item => {
            worksheet.addRow({
                id: item.id,
                title: item.title,
                category: item.category,
                startForecast: item.startForecast ? formatDateBR(item.startForecast) : 'N/A',
                endForecast: item.endForecast ? formatDateBR(item.endForecast) : 'N/A',
                finishedAt: formatDateBR(item.finishedAt),
                forecastHours: item.forecastHours,
                actualHours: item.actualHours,
                isOnTime: item.isOnTime ? 'Sim' : 'Não'
            });
        });

        // Estilizar cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Gerar arquivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chamados_dentro_prazo_${year}_${month}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Sucesso
        Swal.fire({
            icon: 'success',
            title: 'Exportação concluída!',
            text: `Arquivo exportado com ${data.details.length} registros.`
        });

    } catch (error) {
        console.error('Erro ao exportar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro na exportação',
            text: 'Ocorreu um erro ao exportar os dados.'
        });
    } finally {
        // Restaurar botão
        const btn = document.querySelector('#export-on-time-data-btn');
        btn.innerHTML = '<i class="bi bi-download me-1"></i>Exportar Dados';
        btn.disabled = false;
    }
}

// Função para carregar o gráfico de chamados dentro do prazo
async function loadOnTimeChart(year = new Date().getFullYear()) {
    try {
        const monthSelector = document.querySelector('#on-time-month-selector');
        const month = monthSelector ? parseInt(monthSelector.value) : new Date().getMonth() + 1;
        
        const data = await makeRequest(`/api/called/tickets/on-time-completion-rate?year=${year}&month=${month}`);
        const container = document.querySelector('#on-time-chart-container');
        
        if (!data || !data.categories || data.categories.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-info-circle fs-3"></i>
                    <p class="mt-2">Nenhum dado disponível para ${data?.monthName || 'este período'}</p>
                </div>
            `;
            return;
        }

        // Preparar dados para o gráfico
        const chartData = data.categories.map(item => item.percentage);
        const categories = data.categories.map(item => item.category);
        const colors = data.categories.map(item => {
            if (item.percentage >= 80) return '#28a745'; // Verde
            if (item.percentage >= 60) return '#ffc107'; // Amarelo
            return '#dc3545'; // Vermelho
        });

        // Configurações do gráfico
        const chartOptions = {
            series: [{
                name: 'Dentro do Prazo (%)',
                data: chartData
            }],
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '70%',
                    borderRadius: 4,
                    colors: {
                        ranges: [{
                            from: 0,
                            to: 59,
                            color: '#dc3545'
                        }, {
                            from: 60,
                            to: 79,
                            color: '#ffc107'
                        }, {
                            from: 80,
                            to: 100,
                            color: '#28a745'
                        }]
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function(val) {
                    return val.toFixed(1) + '%';
                },
                style: {
                    fontSize: '12px',
                    colors: ['#fff']
                }
            },
            xaxis: {
                categories: categories,
                labels: {
                    style: {
                        fontSize: '11px'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Porcentagem (%)',
                    style: {
                        fontSize: '12px'
                    }
                },
                min: 0,
                max: 100,
                labels: {
                    formatter: function(val) {
                        return val.toFixed(0) + '%';
                    }
                }
            },
            colors: colors,
            tooltip: {
                shared: false,
                intersect: true,
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const category = data.categories[dataPointIndex];
                    const percentage = category.percentage;
                    const onTime = category.onTime;
                    const total = category.total;
                    
                    let colorClass = 'text-success';
                    if (percentage < 60) colorClass = 'text-danger';
                    else if (percentage < 80) colorClass = 'text-warning';
                    
                    // Buscar tickets desta categoria para mostrar colaboradores
                    const categoryTickets = data.details.filter(ticket => ticket.category === category.category);
                    
                    // Agrupar colaboradores com performance completa (dentro e fora do prazo)
                    const collaboratorStats = {};
                    categoryTickets.forEach(ticket => {
                        ticket.assignedCollaborators.forEach(collab => {
                            if (!collaboratorStats[collab.name]) {
                                collaboratorStats[collab.name] = {
                                    onTime: 0,
                                    late: 0,
                                    idHeadcargo: collab.idHeadcargo
                                };
                            }
                            if (ticket.isOnTime) {
                                collaboratorStats[collab.name].onTime++;
                            } else {
                                collaboratorStats[collab.name].late++;
                            }
                        });
                    });
                    
                    // Calcular performance e ordenar colaboradores
                    const sortedCollaborators = Object.entries(collaboratorStats)
                        .map(([name, stats]) => {
                            const total = stats.onTime + stats.late;
                            const performance = total > 0 ? (stats.onTime / total * 100) : 0;
                            return {
                                name,
                                stats,
                                total,
                                performance
                            };
                        })
                        .filter(collab => collab.total > 0) // Apenas colaboradores com tickets
                        .sort((a, b) => b.performance - a.performance) // Ordenar por performance
                        .slice(0, 5); // Mostrar apenas os top 5
                    
                    let collaboratorsHtml = '';
                    if (sortedCollaborators.length > 0) {
                        collaboratorsHtml = `
                            <div class="tooltip-collaborators">
                                <small class="text-muted">Performance por colaborador:</small>
                                ${sortedCollaborators.map(collab => {
                                    const performanceClass = collab.performance >= 80 ? 'text-success' : 
                                                           collab.performance >= 60 ? 'text-warning' : 'text-danger';
                                    return `
                                        <div class="tooltip-collaborator">
                                            <span class="avatar avatar-xs me-1">
                                                <img src="https://cdn.conlinebr.com.br/colaboradores/${collab.stats.idHeadcargo}" alt="${collab.name}">
                                            </span>
                                            <span class="tooltip-collaborator-name">${collab.name}</span>
                                            <div class="tooltip-collaborator-stats">
                                                <span class="tooltip-collaborator-on-time text-success">✅ ${collab.stats.onTime}</span>
                                                <span class="tooltip-collaborator-late text-danger">❌ ${collab.stats.late}</span>
                                                <span class="tooltip-collaborator-performance ${performanceClass}">
                                                    (${collab.performance.toFixed(0)}%)
                                                </span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    }
                    
                    return `
                        <div class="custom-tooltip">
                            <div class="tooltip-header">
                                <strong>${category.category}</strong>
                            </div>
                            <div class="tooltip-content">
                                <div class="tooltip-summary">
                                    <div class="tooltip-actual">
                                        <strong class="${colorClass}">${percentage.toFixed(1)}% dentro do prazo</strong>
                                    </div>
                                    <div class="tooltip-tickets">
                                        <strong>${onTime} de ${total} tickets</strong>
                                    </div>
                                </div>
                                ${collaboratorsHtml}
                            </div>
                        </div>
                    `;
                }
            },
            legend: {
                show: false
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            },
            responsive: [{
                breakpoint: 600,
                options: {
                    chart: {
                        height: 300
                    },
                    dataLabels: {
                        enabled: false
                    }
                }
            }]
        };

        // Renderizar o gráfico
        container.innerHTML = '';
        const chart = new ApexCharts(container, chartOptions);
        chart.render();

    } catch (error) {
        console.error('Erro ao carregar gráfico de chamados dentro do prazo:', error);
        const container = document.querySelector('#on-time-chart-container');
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="bi bi-exclamation-triangle fs-3"></i>
                <p class="mt-2">Erro ao carregar dados do gráfico</p>
            </div>
        `;
    }
}