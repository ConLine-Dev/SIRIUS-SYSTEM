/**
 * Script para a página de avaliação mensal
 */

// Funções de utilidade
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function showSuccessAlert(message) {
    Swal.fire({
        icon: 'success',
        title: 'Sucesso',
        text: message,
        confirmButtonColor: '#3085d6'
    });
}

function showErrorAlert(message) {
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: message,
        confirmButtonColor: '#3085d6'
    });
}

// Formata uma data para exibição
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Obter os parâmetros da URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

// Obter informações do usuário logado
async function getInfosLogin() {
    try {
        // Primeiro tenta obter do localStorage
        const storageData = localStorage.getItem('StorageGoogle');
        if (storageData) {
            return JSON.parse(storageData);
        }
        
        // Se não encontrar no localStorage, tenta obter da sessão
        const response = await fetch('/api/session/getSession');
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
        return null;
    }
}

// Inicializar a página
async function initializePage() {
    try {
        showLoader();
        // Obter parâmetros da URL
        const params = getUrlParams();
        // Verificar se temos os parâmetros necessários
        if (!params.pdi_id || !params.collaborator_name) {
            hideLoader();
            showErrorAlert('Parâmetros insuficientes para carregar a avaliação. Feche esta janela e tente novamente.');
            return;
        }
        // --- NOVO BLOCO: Verificar se usuário é supervisor do PDI ---
        const btnSave = document.getElementById('btnSaveEvaluation');
        let isSupervisor = false;
        try {
            const [user, pdiResp] = await Promise.all([
                getInfosLogin(),
                fetch('/api/pdi-hub/getPDIView', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: params.pdi_id })
                }).then(r => r.json())
            ]);
            if (user && user.system_collaborator_id && pdiResp.success && pdiResp.data) {
                const supervisorId = parseInt(pdiResp.data.supervisor_id);
                const loggedId = parseInt(user.system_collaborator_id);
                isSupervisor = supervisorId === loggedId;
            }
        } catch (e) {
            isSupervisor = false;
        }
        if (!isSupervisor) {
            btnSave.disabled = true;
            btnSave.title = 'Apenas o supervisor responsável pode salvar a avaliação.';
            btnSave.classList.add('disabled');
        } else {
            btnSave.disabled = false;
            btnSave.title = '';
            btnSave.classList.remove('disabled');
        }
        // --- FIM NOVO BLOCO ---
        // Preencher os campos do formulário
        document.getElementById('evaluationPdiId').value = params.pdi_id;
        document.getElementById('evaluationCollaboratorName').textContent = decodeURIComponent(params.collaborator_name);
        // Definir o mês e ano
        const monthSelect = document.getElementById('evaluationMonthSelect');
        const yearSelect = document.getElementById('evaluationYearSelect');
        // Inicializar Choices.js para o select de mês (com correção)
        const monthChoices = new Choices(monthSelect, {
            searchEnabled: false,
            itemSelectText: '',
            shouldSort: false,
            allowHTML: true,
            classNames: {
                containerOuter: 'choices select-choices'
            }
        });
        // Preencher anos (do ano atual até 3 anos atrás)
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = ''; // Limpar opções existentes
        for (let year = currentYear; year >= currentYear - 3; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
        // Inicializar Choices.js para o select de ano
        const yearChoices = new Choices(yearSelect, {
            searchEnabled: false,
            itemSelectText: '',
            shouldSort: false,
            allowHTML: true,
            classNames: {
                containerOuter: 'choices select-choices'
            }
        });
        // Definir valores padrão para mês e ano
        if (params.month) {
            document.getElementById('evaluationMonth').value = params.month;
            monthChoices.setChoiceByValue(params.month);
        } else {
            const currentMonth = (new Date().getMonth() + 1).toString();
            document.getElementById('evaluationMonth').value = currentMonth;
            monthChoices.setChoiceByValue(currentMonth);
        }
        if (params.year) {
            document.getElementById('evaluationYear').value = params.year;
            yearChoices.setChoiceByValue(params.year);
        } else {
            document.getElementById('evaluationYear').value = currentYear.toString();
            yearChoices.setChoiceByValue(currentYear.toString());
        }
        // Configurar eventos
        setupEventListeners(monthChoices, yearChoices);
        // Carregar fatores do PDI e, só depois, preencher respostas se for edição
        await loadPdiFactors(params.pdi_id);
        const isEdit = params.edit === 'true';
        if (isEdit || (params.month && params.year)) {
            await fillMonthlyEvaluationAnswers(params.pdi_id, params.month, params.year);
        }
        hideLoader();
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        hideLoader();
        showErrorAlert('Ocorreu um erro ao carregar a página. Por favor, tente novamente.');
    }
}

// Configurar eventos
function setupEventListeners(monthChoices, yearChoices) {
    // Eventos para mês/ano usando Choices.js
    if (monthChoices) {
        monthChoices.passedElement.element.addEventListener('choice', function(event) {
            const month = event.detail.choice.value;
            document.getElementById('evaluationMonth').value = month;
            const year = document.getElementById('evaluationYear').value;
            const pdiId = document.getElementById('evaluationPdiId').value;
            loadMonthlyEvaluation(pdiId, month, year);
        });
    } else {
        // Fallback para select normal se Choices não estiver disponível
        document.getElementById('evaluationMonthSelect').addEventListener('change', function() {
            const month = this.value;
            document.getElementById('evaluationMonth').value = month;
            const year = document.getElementById('evaluationYearSelect').value;
            const pdiId = document.getElementById('evaluationPdiId').value;
            loadMonthlyEvaluation(pdiId, month, year);
        });
    }
    
    if (yearChoices) {
        yearChoices.passedElement.element.addEventListener('choice', function(event) {
            const year = event.detail.choice.value;
            document.getElementById('evaluationYear').value = year;
            const month = document.getElementById('evaluationMonth').value;
            const pdiId = document.getElementById('evaluationPdiId').value;
            loadMonthlyEvaluation(pdiId, month, year);
        });
    } else {
        // Fallback para select normal se Choices não estiver disponível
        document.getElementById('evaluationYearSelect').addEventListener('change', function() {
            const year = this.value;
            document.getElementById('evaluationYear').value = year;
            const month = document.getElementById('evaluationMonthSelect').value;
            const pdiId = document.getElementById('evaluationPdiId').value;
            loadMonthlyEvaluation(pdiId, month, year);
        });
    }
    
    // Evento para salvar
    document.getElementById('btnSaveEvaluation').addEventListener('click', saveMonthlyEvaluation);
}

// Carregar fatores do PDI e montar formulário dinâmico
async function loadPdiFactors(pdiId) {
    // Primeiro tenta buscar fatores específicos do PDI
    const response = await fetch(`/api/pdi-hub/getPdiFactors?pdi_id=${pdiId}`);
    const result = await response.json();
    const container = document.getElementById('factorsContainer');
    if (!container) return;
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        // Montar tabela com fatores específicos do PDI
        let table = `<div class="table-responsive"><table class="table table-bordered table-fatores-avaliacao align-middle">
            <thead class="table-light">
                <tr>
                    <th style="width: 40%">Fatores</th>
                    <th class="text-center">Ótimo</th>
                    <th class="text-center">Bom</th>
                    <th class="text-center">Regular</th>
                    <th class="text-center">Ruim</th>
                    <th class="text-center">Péssimo</th>
                </tr>
            </thead>
            <tbody>`;
        result.data.forEach(factor => {
            table += `<tr>
                <td><strong>${factor.name}</strong>${factor.description ? ` <span class='text-muted small'>(${factor.description})</span>` : ''} <span class='text-muted'>(Peso: ${factor.weight})</span></td>
                ${['Ótimo','Bom','Regular','Ruim','Péssimo'].map(option => `
                    <td class='text-center'>
                        <input class='form-check-input' type='radio' name='factor_${factor.factor_id}' id='factor_${factor.factor_id}_${option}' value='${option}'>
                    </td>
                `).join('')}
            </tr>`;
        });
        table += '</tbody></table></div>';
        container.innerHTML = table;
    } else {
        // Se não houver fatores específicos, buscar fatores padrão do sistema
        const defaultResponse = await fetch('/api/pdi-hub/getAllFactors');
        const defaultResult = await defaultResponse.json();
        if (defaultResult.success && Array.isArray(defaultResult.data) && defaultResult.data.length > 0) {
            let table = `<div class=\"table-responsive\"><table class=\"table table-bordered table-fatores-avaliacao align-middle\">\n                <thead class=\"table-light\">\n                    <tr>\n                        <th style=\"width: 40%\">Fatores</th>\n                        <th class=\"text-center\">Ótimo</th>\n                        <th class=\"text-center\">Bom</th>\n                        <th class=\"text-center\">Regular</th>\n                        <th class=\"text-center\">Ruim</th>\n                        <th class=\"text-center\">Péssimo</th>\n                    </tr>\n                </thead>\n                <tbody>`;
            defaultResult.data.forEach(factor => {
                table += `<tr>
                    <td><strong>${factor.name}</strong>${factor.description ? ` <span class='text-muted small'>(${factor.description})</span>` : ''} <span class='text-muted'>(Peso: 1.0)</span></td>
                    ${['Ótimo','Bom','Regular','Ruim','Péssimo'].map(option => `
                        <td class='text-center'>
                            <input class='form-check-input' type='radio' name='factor_${factor.id}' id='factor_${factor.id}_${option}' value='${option}'>
                        </td>
                    `).join('')}
                </tr>`;
            });
            table += '</tbody></table></div>';
            container.innerHTML = table;
        } else {
            container.innerHTML = '<div class="alert alert-info">Nenhum fator cadastrado no sistema.</div>';
        }
    }
}

// Nova função para preencher respostas após fatores renderizados
async function fillMonthlyEvaluationAnswers(pdiId, month, year) {
    // Buscar avaliação existente
    const response = await fetch(`/api/pdi-hub/getMonthlyEvaluation?pdi_id=${pdiId}&month=${month}&year=${year}`);
    const result = await response.json();
    // Limpar respostas
    document.getElementById('monthlyEvaluationForm').reset();
    document.getElementById('evaluationPdiId').value = pdiId;
    document.getElementById('evaluationMonth').value = month;
    document.getElementById('evaluationYear').value = year;
    // Preencher respostas se houver
    if (result.success && result.data && Array.isArray(result.data.answers)) {
        result.data.answers.forEach(ans => {
            const radio = document.getElementById(`factor_${ans.factor_id}_${ans.score}`);
            if (radio) radio.checked = true;
        });
        document.getElementById('evaluationComments').value = result.data.comments || '';
    } else {
        document.getElementById('evaluationComments').value = '';
    }
}

// Ajustar loadMonthlyEvaluation para usar o novo fluxo
async function loadMonthlyEvaluation(pdiId, month, year) {
    try {
        document.getElementById('evaluationMonth').value = month;
        document.getElementById('evaluationYear').value = year;
        showLoader();
        await loadPdiFactors(pdiId);
        await fillMonthlyEvaluationAnswers(pdiId, month, year);
        hideLoader();
    } catch (error) {
        console.error('Erro ao carregar avaliação mensal:', error);
        hideLoader();
        showErrorAlert('Não foi possível carregar a avaliação do mês selecionado.');
    }
}

// Salvar avaliação mensal dinâmica
async function saveMonthlyEvaluation() {
    try {
        showLoader();
        const pdiId = document.getElementById('evaluationPdiId').value;
        const month = document.getElementById('evaluationMonth').value;
        const year = document.getElementById('evaluationYear').value;
        const comments = document.getElementById('evaluationComments').value;
        // Coletar respostas dos fatores
        const answers = [];
        const radios = document.querySelectorAll('#factorsContainer input[type="radio"]:checked');
        radios.forEach(radio => {
            const [_, factorId] = radio.name.split('_');
            answers.push({ factor_id: factorId, score: radio.value });
        });
        if (answers.length === 0 && !comments) {
            hideLoader();
            showErrorAlert('Por favor, preencha pelo menos um fator ou comentário.');
            return;
        }
        const response = await fetch('/api/pdi-hub/saveMonthlyEvaluation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdi_id: pdiId, month, year, comments, answers })
        });
        const result = await response.json();
        hideLoader();
        if (result.success) {
            showSuccessAlert('Avaliação mensal salva com sucesso!');
            if (window.opener && !window.opener.closed) {
                // Atualiza histórico (caso a função exista)
                if (typeof window.opener.loadEvaluationHistory === 'function') {
                    window.opener.loadEvaluationHistory(pdiId);
                }
                // Atualiza todos os dados do PDI (nível de desempenho, barra, etc)
                if (typeof window.opener.loadPDIDetails === 'function') {
                    window.opener.loadPDIDetails(pdiId);
                }
            }
            setTimeout(() => { window.close(); }, 2000);
        } else {
            showErrorAlert(result.message || 'Erro ao salvar a avaliação mensal.');
        }
    } catch (error) {
        console.error('Erro ao salvar avaliação mensal:', error);
        hideLoader();
        showErrorAlert('Não foi possível salvar a avaliação mensal.');
    }
}

// Inicializar a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initializePage); 