// Aguarda o documento estar pronto
document.addEventListener('DOMContentLoaded', function() {
    // Remove o loader quando a página estiver carregada
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }

    // Inicializa os componentes
    initializeFormComponents();
    loadProcessData();
});

// Inicializa os componentes do formulário
function initializeFormComponents() {
    // Inicializa tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Inicializa selects com Choices.js
    document.querySelectorAll('select').forEach(select => {
        new Choices(select, {
            searchEnabled: false,
            itemSelectText: ''
        });
    });
}

// Formata data para exibição
function formatDate(dateString) {
    if (!dateString) return '-';
    return dateString;
}

// Obtém parâmetros da URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        ref: params.get('ref')
    };
}

// Carrega os dados do processo
async function loadProcessData() {
    try {
        const { ref } = getUrlParams();
        if (!ref) {
            showProcessoNaoEncontrado('Referência do processo não fornecida');
            return;
        }

        showLoading();
        
        // Busca detalhes do processo
        const response = await fetch(`/api/process-view/details/${ref}`);
        const data = await response.json();

        if (data.status === 'error' || !data.data || !data.data.processo) {
            showProcessoNaoEncontrado('Não foram encontradas informações para o processo informado');
            hideLoading();
            return;
        }

        // Preenche os dados do processo
        fillProcessData(data.data);
        
        await loadProcessFees(ref);
        
        // Carrega os acompanhamentos
        await loadProcessFollows(ref);

        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar dados do processo:', error);
        showProcessoNaoEncontrado('Erro ao carregar dados do processo');
        hideLoading();
    }
}

// Função auxiliar para definir texto em elemento
function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text || '-';
        // console.log(`Elemento ${elementId} encontrado Ihull`)
    }else{
        console.log(`Elemento ${elementId} nao encontrado`)
    }
}

// Função auxiliar para definir texto em elemento
function setElementValue(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = text || '-';
        // console.log(`Elemento ${elementId} encontrado Ihull`)
    }else{
        console.log(`Elemento ${elementId} nao encontrado`)
    }
}

// Função para listar volumes por pacote e formatar a saída
function listarVolumesPorPacote(containers) {
    let resultado = {};

    // Filtra apenas os itens com Quantidade e Tipo_Pacote não nulos
    const itensValidos = containers.filter(container => 
        container.Quantidade !== null && container.Tipo_Pacote !== null
    );

    // Se não houver itens válidos, retorna '-'
    if (itensValidos.length === 0) {
        return '-';
    }

    // Processa os itens válidos
    itensValidos.forEach(container => {
        const tipoPacote = container.Tipo_Pacote;
        const quantidade = container.Quantidade;

        if (!resultado[tipoPacote]) {
            resultado[tipoPacote] = 0;
        }

        resultado[tipoPacote] += quantidade;
    });

    // Formata a saída no formato desejado
    const formatado = Object.keys(resultado).map(tipo => {
        return `${resultado[tipo].toLocaleString('pt-BR')} ${tipo}`;
    }).join(' e ');

    return formatado;
}

// Função para listar equipamentos no formato desejado
function listarEquipamentos(containers) {
    let contagemEquipamentos = {};

    // Conta a quantidade de cada tipo de equipamento
    containers.forEach(container => {
        const equipamento = container.Equipamentos;
        if (!contagemEquipamentos[equipamento]) {
            contagemEquipamentos[equipamento] = 0;
        }
        contagemEquipamentos[equipamento]++;
    });

    // Formata a saída no formato desejado (ex: 1x40HC + 1x20DC)
    const formatado = Object.keys(contagemEquipamentos).map(equipamento => {
        return `${contagemEquipamentos[equipamento]}x${equipamento}`;
    }).join(' + ');

    return formatado;
}

// Função para retornar o menor Free_Time_House_Destino e o menor Free_Time_Master_Destino
function encontrarMenoresFreeTimes(containers) {
    let menorFreeTimeHouse = null;
    let menorFreeTimeMaster = null;

    containers.forEach(container => {
        const freeTimeHouse = container.Free_Time_House_Destino;
        const freeTimeMaster = container.Free_Time_Master_Destino;

        // Verifica e atualiza o menor Free_Time_House_Destino
        if (menorFreeTimeHouse === null || (freeTimeHouse !== null && freeTimeHouse < menorFreeTimeHouse)) {
            menorFreeTimeHouse = freeTimeHouse;
        }

        // Verifica e atualiza o menor Free_Time_Master_Destino
        if (menorFreeTimeMaster === null || (freeTimeMaster !== null && freeTimeMaster < menorFreeTimeMaster)) {
            menorFreeTimeMaster = freeTimeMaster;
        }
    });

    return {
        menorFreeTimeHouse: menorFreeTimeHouse !== null ? menorFreeTimeHouse+' dias' : '-',
        menorFreeTimeMaster: menorFreeTimeMaster !== null ? menorFreeTimeMaster+' dias' : '-'
    };
}


// Função para gerar as linhas da tabela com os containers
function gerarLinhasTabelaContainers(containers) {
    let linhasTabela = '';

    containers.forEach(container => {
        const numeroContainer = container.Container || '-';
        const tipoEquipamento = container.Equipamentos || '-';
        const freeTimeMaster = container.Free_Time_Master_Destino !== null ? `${container.Free_Time_Master_Destino} dias` : '-';
        const freeTimeHouse = container.Free_Time_House_Destino !== null ? `${container.Free_Time_House_Destino} dias` : '-';

        // Cria a linha da tabela
        linhasTabela += `
            <tr>
                <td>${numeroContainer}</td>
                <td>${tipoEquipamento}</td>
                <td>${freeTimeMaster}</td>
                <td>${freeTimeHouse}</td>
            </tr>
        `;
    });

    return linhasTabela;
}

// Função auxiliar para definir o HTML de um elemento
function setElementHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = html;
        // console.log(`Elemento ${elementId} encontrado. Ihull!`);
    } else {
        console.log(`Elemento ${elementId} não encontrado.`);
    }
}

// Função para gerar as linhas da tabela com as viagens
function gerarLinhasTabelaViagens(viagens) {
    let linhasTabela = '';

    viagens.forEach(viagem => {
        const tipoViagem = viagem.Tipo_Viagem || '-';
        const navio = viagem.Navio || '-';
        const viagemNumero = viagem.Viagem || '-';

        // Cria a linha da tabela
        linhasTabela += `
            <tr>
                <td>${tipoViagem}</td>
                <td>${navio}</td>
                <td>${viagemNumero}</td>
            </tr>
        `;
    });

    return linhasTabela;
}



// Preenche os dados do processo na interface
function fillProcessData(data) {
    if (!data) {
        console.error('Dados do processo não fornecidos');
        return;
    }

    console.log(data)

    const { processo, responsaveis, viagem, containers } = data;

    // Preenche informações básicas
    setElementValue('processo-numero', processo?.Numero_Processo);
    setElementText('processo-cliente', processo?.Cliente);
    setElementText('processo-exportador', processo?.Exportador);
    setElementText('processo-importador', processo?.Importador);
    setElementText('processo-despachante', processo?.Despachante_Aduaneiro);
    setElementText('processo-notify', processo?.Notify);
    setElementText('processo-agente-origem', processo?.Agente_Origem);
    setElementText('processo-cia-transporte', processo?.Companhia_Transporte);
    setElementValue('processo-status', processo?.Situacao_Embarque);


    setElementText('processo-origem', processo?.Origem);
    setElementText('processo-destino', processo?.Destino);

    const conhecimento = processo?.Numero_Master+' ('+processo?.Modalidade_Pagamento+')';
    setElementText('conhecimento', conhecimento);


    // Preenche datas
    setElementText('data-prev-embarque', formatDate(processo?.Data_Previsao_Embarque));
    setElementText('data-embarque', formatDate(processo?.Data_Embarque));
    setElementText('data-prev-chegada', formatDate(processo?.Data_Previsao_Desembarque));
    setElementText('data-chegada', formatDate(processo?.Data_Desembarque));



    // Preenche responsáveis
    const responsaveisContainer = document.getElementById('responsaveis-list');
    if (responsaveisContainer && responsaveis?.length > 0) {
        responsaveisContainer.innerHTML = responsaveis.map(resp => `
            <div class="d-flex align-items-center mb-3">
                <div class="me-2">
                    <span class="avatar avatar-sm bg-primary"><img src="https://cdn.conlinebr.com.br/colaboradores/${resp.IdPessoa}" alt="img"></span>
                </div>
                <div>
                    <p class="mb-0 fw-semibold">${resp.Responsavel || '-'}</p>
                    <p class="mb-0 text-muted fs-12">${resp.Papel || 'Não definido'}</p>
                </div>
            </div>
        `).join('');


        
    }

    const totalPeso = containers.reduce((total, container) => total + container.Peso_Bruto, 0);
    const totalMetros = containers.reduce((total, container) => total + container.Metros_Cubicos, 0);

    setElementText('peso-bruto', totalPeso);
    setElementText('metros', totalMetros);

    const volumesFormatados = listarVolumesPorPacote(containers);
    setElementText('qtde-volumes', volumesFormatados);

    const equipamentosFormatados = listarEquipamentos(containers);
    setElementText('total-equipamentos', equipamentosFormatados);

    const menoresFreeTimes = encontrarMenoresFreeTimes(containers);
    setElementText('menor-free-time-house', menoresFreeTimes.menorFreeTimeHouse);
    setElementText('menor-free-time-master', menoresFreeTimes.menorFreeTimeMaster);

    document.querySelector('#ncm').setAttribute('title', processo?.Descricao_NCM);
    setElementText('ncm', processo?.NCM);


    const linhasTabela = gerarLinhasTabelaContainers(containers);
    setElementHTML('tabela-containers', linhasTabela);


    // Chama a função e define o HTML no elemento da tabela
    const linhasTabelaViagens = gerarLinhasTabelaViagens(viagem);
    setElementHTML('tabela-viagens', linhasTabelaViagens);



    // Preenche containers
    const containersContainer = document.getElementById('containers-list');
    if (containersContainer && containers?.length > 0) {
        containersContainer.innerHTML = containers.map(container => `
            <div class="col-sm-6 col-lg-3">
                <div class="card custom-card">
                    <div class="card-body">
                        <p class="fw-semibold mb-2">${container.Container || '-'}</p>
                        <p class="mb-1">Tipo: ${container.Equipamentos || '-'}</p>
                        <p class="mb-1">Peso: ${container.Peso_Bruto || '-'} kg</p>
                        <p class="mb-0">Volume: ${container.Metros_Cubicos || '-'} m³</p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

async function loadProcessFees(processNumber){
    const response = await fetch(`/api/process-view/fees/${processNumber}`);
    const data = await response.json();

    console.log(data)


    if (data.status === 'error') {
        console.error(data.message);
        return;
    }


    const { taxas } = data.data;


    setElementValue('processo-lucro-abertura', taxas[0]?.Lucro_Abertura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    setElementValue('processo-lucro-estimado', taxas[0]?.Lucro_Estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    setElementValue('processo-lucro-efetivo', taxas[0]?.Lucro_Efetivo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    $('#tableTaxasProcessos').DataTable({
        searching: false,
        paging: false,
        fixedHeader: true,
        info: false,
        scrollY: 'calc(100vh - 400px)',
        data: taxas,
        columns: [
            {
                data: 'Nome_Taxa',
                render: function(data, type, row) {
                    // Adiciona a indicação "Taxa em aberto" ao lado do nome da taxa, se estiver inativa
                    return row.inativo ? `${data} <span class="text-danger">(Taxa em aberto)</span>` : data;
                }
            },
            {
                data: 'Valor_Pagamento_Total',
                render: function(data, type, row) {
                    if (data === null) return '';
                    return data.toLocaleString('pt-BR', { style: 'currency', currency: row.Moeda_Pgto });
                },
            },
            {
                data: 'Valor_Recebimento_Total',
                render: function(data, type, row) {
                    if (data === null) return '';
                    return data.toLocaleString('pt-BR', { style: 'currency', currency: row.Moeda_Receb });
                },
            }
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        }
    });

}

async function loadProcessFollows(processNumber) {
    try {
        const response = await fetch(`/api/process-view/follows/${processNumber}`);
        const data = await response.json();


        if (data.status === 'error') {
            console.error(data.message);
            return;
        }

        const { acompanhamentos } = data.data;

        // Preenche a lista de acompanhamentos
        const acompanhamentosContainer = document.getElementById('follows-timeline');
        if (acompanhamentosContainer && acompanhamentos?.length > 0) {
            acompanhamentosContainer.innerHTML = acompanhamentos.map(acomp => {
                // Substitui quebras de linha (\n) por <br> para exibir no HTML
                const descricaoFormatada = acomp.Descricao ? acomp.Descricao.replace(/\n/g, '<br>') : '';

                return `
                    <div class="follow-item p-3 border rounded-2 mb-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="fw-semibold">${acomp.Responsavel || 'Não informado'}</span>
                            <span class="text-muted fs-12">${acomp.Data}</span>
                        </div>
                        <p class="mb-0">${descricaoFormatada}</p>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar acompanhamentos:', error);
    }
}



// Carrega os acompanhamentos do processo
async function loadProcessFollows2(processNumber, page = 1) {
    try {
        const response = await fetch(`/api/process-view/follows/${processNumber}?page=${page}`);
        const data = await response.json();

        if (data.status === 'error') {
            console.error(data.message);
            return;
        }

        const { acompanhamentos, pagination } = data.data;

        // Preenche a lista de acompanhamentos
        const acompanhamentosContainer = document.getElementById('acompanhamentos-list');
        if (acompanhamentosContainer && acompanhamentos?.length > 0) {
            acompanhamentosContainer.innerHTML = acompanhamentos.map(acomp => `
                <div class="timeline-item">
                    <div class="timeline-time">${acomp.Data}</div>
                    <div class="timeline-content">
                        <p class="mb-1">${acomp.Descricao}</p>
                        <small class="text-muted">Por: ${acomp.Responsavel || 'Não informado'}</small>
                    </div>
                </div>
            `).join('');
        }

        // Cria a paginação
        if (pagination) {
            createPagination(pagination, processNumber);
        }
    } catch (error) {
        console.error('Erro ao carregar acompanhamentos:', error);
    }
}

// Cria a paginação
function createPagination(pagination, processNumber) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    const { page, totalPages } = pagination;
    let paginationHtml = '';

    // Botão anterior
    paginationHtml += `
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page - 1}">Anterior</a>
        </li>
    `;

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <li class="page-item ${i === page ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Botão próximo
    paginationHtml += `
        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page + 1}">Próximo</a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHtml;

    // Adiciona eventos aos links de paginação
    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const newPage = parseInt(e.target.dataset.page);
            if (!isNaN(newPage) && newPage !== page) {
                loadProcessFollows(processNumber, newPage);
            }
        });
    });
}

// Função para mostrar mensagem de processo não encontrado
function showProcessoNaoEncontrado(mensagem) {
    const elemento = document.getElementById('processo-nao-encontrado');
    if (elemento) {
        // Atualiza a mensagem se necessário
        const msgElement = elemento.querySelector('p');
        if (msgElement && mensagem) {
            msgElement.textContent = mensagem;
        }
        
        // Remove a classe d-none para mostrar o elemento
        elemento.classList.remove('d-none');
        
        // Esconde o conteúdo principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
    }
}

// Funções de utilidade para loading
function showLoading() {
    const loader = document.getElementById('loader2');
    if (loader) {
        loader.classList.remove('d-none');
    }
}

function hideLoading() {
    const loader = document.getElementById('loader2');
    if (loader) {
        loader.classList.add('d-none');
    }
}

// Função para mostrar toast
function showToast(type, message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}