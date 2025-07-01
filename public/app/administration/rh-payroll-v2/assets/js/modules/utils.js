// Funções de formatação e utilidades gerais

// Mostra um toast de notificação
/**
 * Mostra um toast de notificação
 * @param {string} type - Tipo do toast (success, error, warning, info)
 * @param {string} message - Mensagem a ser exibida
 */
export function showToast(type, message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });

    bsToast.show();

    // Remove o toast depois que ele for escondido
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

/**
 * Formata uma data para o formato brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada
 */
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formata um número como moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export function formatCurrency(value) {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata um mês/ano
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Mês/ano formatado
 */
export function formatMonthYear(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Formata um CPF
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} CPF formatado
 */
export function formatCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
}

/**
 * Formata um mês
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Mês formatado
 */
export function formatMonth(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { month: 'long' });
}

/**
 * Formata uma frequência
 * @param {string} freq - Frequência a ser formatada
 * @returns {string} Frequência formatada
 */
export function formatFrequency(freq) {
    const frequencies = {
        monthly: 'Mensal',
        weekly: 'Semanal',
        biweekly: 'Quinzenal',
        yearly: 'Anual',
        once: 'Única'
    };
    return frequencies[freq] || freq;
}

/**
 * Retorna o badge para um tipo de desconto
 * @param {string} type - Tipo de desconto
 * @returns {string} HTML do badge
 */
export function getDiscountTypeBadge(type) {
    const badges = {
        INSS: 'bg-primary',
        IRRF: 'bg-info',
        VT: 'bg-success',
        VA: 'bg-warning',
        VR: 'bg-warning',
        PLANO_SAUDE: 'bg-danger',
        OUTROS: 'bg-secondary'
    };
    return `<span class="badge ${badges[type] || 'bg-secondary'}">${type}</span>`;
}

/**
 * Retorna o badge para um status
 * @param {string} status - Status
 * @returns {string} HTML do badge
 */
export function getStatusBadge(status) {
    const badges = {
        active: 'bg-success',
        pending: 'bg-warning',
        inactive: 'bg-danger'
    };
    return `<span class="badge ${badges[status] || 'bg-secondary'}">${status}</span>`;
}

/**
 * Retorna o badge para um status de folha de pagamento
 * @param {string} status - Status
 * @returns {string} HTML do badge
 */
export function getPayrollStatusBadge(status) {
    const badges = {
        pending: 'bg-warning',
        processing: 'bg-info',
        completed: 'bg-success',
        error: 'bg-danger'
    };
    return `<span class="badge ${badges[status] || 'bg-secondary'}">${status}</span>`;
}

/**
 * Valida um CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} Se o CPF é válido
 */
export function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11) return false;

    // Elimina CPFs invalidos conhecidos
    if (/^(.)\1+$/.test(cpf)) return false;

    // Valida 1o digito	
    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;

    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;

    return true;
}

/**
 * Gera um ID único
 * @returns {string} ID único
 */
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce uma função
 * @param {Function} func - Função a ser debounced
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Faz o download de um arquivo
 * @param {Blob} blob - Blob do arquivo
 * @param {string} filename - Nome do arquivo
 */
export function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

// Carrega lista de funcionários
export async function loadEmployees() {
    try {
        
        const employees = await makeRequest(`/api/users/listAllUsersActive`);
        return employees;
        
       
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        showToast('Erro ao carregar lista de funcionários', 'danger');
    }
}

// Busca funcionário por ID
export async function fetchEmployee(id) {
    try {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const employee = employees.find(e => e.id === id);
        if (!employee) throw new Error('Funcionário não encontrado');
        
        return employee;
    } catch (error) {
        console.error('Erro ao buscar funcionário:', error);
        throw new Error('Erro ao buscar funcionário');
    }
}

export async function loadTypes() {
    try {
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const types = await makeRequest(`/api/rh-payroll/categoryDiscount`);

        return types;
        
       
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        showToast('Erro ao carregar lista de funcionários', 'danger');
    }
}

export async function makeRequest(url, method = 'GET', body = null) {
    const options = {
      method,
      headers: {}
    };
  
    // Obtendo os dados do usuário do localStorage
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = StorageGoogleData ? JSON.parse(StorageGoogleData) : null;
  
    // Se existir, adicione os dados do usuário no cabeçalho
    if (StorageGoogle) {
      options.headers['x-user'] = JSON.stringify(StorageGoogle);
    }
  
    if (body) {
      if (method === 'GET') {
        console.warn('GET request does not support a request body.');
      } else {
        // Se body for uma instância de FormData, não defina o Content-Type
        if (body instanceof FormData) {
          options.body = body;
          // O fetch automaticamente definirá o Content-Type como multipart/form-data
        } else {
          options.headers['Content-Type'] = 'application/json';
          options.body = JSON.stringify(body);
        }
      }
    }
  
    try {
      const response = await fetch(url, options);
  
      // Verifica se a resposta é um status de sucesso (2xx)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na solicitação ao servidor.');
      }
  
      // Se a resposta for bem-sucedida, retorna os dados
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
}
  
