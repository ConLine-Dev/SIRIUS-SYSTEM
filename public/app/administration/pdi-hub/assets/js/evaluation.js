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
            // É importante usar o método setChoiceByValue para o Choices.js
            monthChoices.setChoiceByValue(params.month);
        } else {
            // Definir o mês atual como padrão
            const currentMonth = (new Date().getMonth() + 1).toString();
            document.getElementById('evaluationMonth').value = currentMonth;
            monthChoices.setChoiceByValue(currentMonth);
        }
        
        if (params.year) {
            document.getElementById('evaluationYear').value = params.year;
            yearChoices.setChoiceByValue(params.year);
        } else {
            // Definir o ano atual como padrão
            document.getElementById('evaluationYear').value = currentYear.toString();
            yearChoices.setChoiceByValue(currentYear.toString());
        }
        
        // Verificar se é uma edição
        const isEdit = params.edit === 'true';
        
        // Carregar avaliação existente se for uma edição
        if (isEdit || (params.month && params.year)) {
            await loadMonthlyEvaluation(params.pdi_id, params.month, params.year);
        }
        
        // Configurar eventos
        setupEventListeners(monthChoices, yearChoices);
        
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

// Carregar avaliação mensal existente
async function loadMonthlyEvaluation(pdiId, month, year) {
    try {
        // Atualizar os campos ocultos
        document.getElementById('evaluationMonth').value = month;
        document.getElementById('evaluationYear').value = year;
        
        showLoader();
        
        // Buscar avaliação existente para o mês/ano selecionado
        const response = await fetch(`/api/pdi-hub/getMonthlyEvaluation?pdi_id=${pdiId}&month=${month}&year=${year}`);
        const result = await response.json();
        
        hideLoader();
        
        // Limpar formulário
        document.getElementById('monthlyEvaluationForm').reset();
        
        // Garantir que os campos ocultos permaneçam preenchidos
        document.getElementById('evaluationPdiId').value = pdiId;
        document.getElementById('evaluationMonth').value = month;
        document.getElementById('evaluationYear').value = year;
        
        // Se existir uma avaliação, preencher o formulário
        if (result.success && result.data) {
            const evaluation = result.data;
            
            // Preencher os campos de avaliação
            if (evaluation.attendance) {
                document.querySelector(`input[name="attendance"][value="${evaluation.attendance}"]`).checked = true;
            }
            
            if (evaluation.punctuality) {
                document.querySelector(`input[name="punctuality"][value="${evaluation.punctuality}"]`).checked = true;
            }
            
            if (evaluation.teamwork) {
                document.querySelector(`input[name="teamwork"][value="${evaluation.teamwork}"]`).checked = true;
            }
            
            if (evaluation.creativity) {
                document.querySelector(`input[name="creativity"][value="${evaluation.creativity}"]`).checked = true;
            }
            
            if (evaluation.productivity) {
                document.querySelector(`input[name="productivity"][value="${evaluation.productivity}"]`).checked = true;
            }
            
            if (evaluation.problem_solving) {
                document.querySelector(`input[name="problem_solving"][value="${evaluation.problem_solving}"]`).checked = true;
            }
            
            // Preencher observações
            document.getElementById('evaluationComments').value = evaluation.comments || '';
        }
        
    } catch (error) {
        console.error('Erro ao carregar avaliação mensal:', error);
        hideLoader();
        showErrorAlert('Não foi possível carregar a avaliação do mês selecionado.');
    }
}

// Salvar avaliação mensal
async function saveMonthlyEvaluation() {
    try {
        showLoader();
        
        // Obter os valores do formulário
        const pdiId = document.getElementById('evaluationPdiId').value;
        const month = document.getElementById('evaluationMonth').value;
        const year = document.getElementById('evaluationYear').value;
        const comments = document.getElementById('evaluationComments').value;
        
        // Obter os valores dos radios
        const attendance = document.querySelector('input[name="attendance"]:checked')?.value || null;
        const punctuality = document.querySelector('input[name="punctuality"]:checked')?.value || null;
        const teamwork = document.querySelector('input[name="teamwork"]:checked')?.value || null;
        const creativity = document.querySelector('input[name="creativity"]:checked')?.value || null;
        const productivity = document.querySelector('input[name="productivity"]:checked')?.value || null;
        const problem_solving = document.querySelector('input[name="problem_solving"]:checked')?.value || null;
        
        // Verificar se pelo menos um campo foi preenchido
        if (!attendance && !punctuality && !teamwork && !creativity && !productivity && !problem_solving && !comments) {
            hideLoader();
            showErrorAlert('Por favor, preencha pelo menos um campo de avaliação.');
            return;
        }
        
        // Enviar para o servidor
        const response = await fetch('/api/pdi-hub/saveMonthlyEvaluation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pdi_id: pdiId,
                month,
                year,
                attendance,
                punctuality,
                teamwork,
                creativity,
                productivity,
                problem_solving,
                comments
            })
        });
        
        const result = await response.json();
        
        hideLoader();
        
        if (result.success) {
            // Mostrar mensagem de sucesso
            showSuccessAlert('Avaliação mensal salva com sucesso!');
            
            // Atualizar a página pai se disponível
            if (window.opener && !window.opener.closed) {
                if (typeof window.opener.loadEvaluationHistory === 'function') {
                    window.opener.loadEvaluationHistory(pdiId);
                }
            }
            
            // Fechar a janela após 2 segundos
            setTimeout(() => {
                window.close();
            }, 2000);
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