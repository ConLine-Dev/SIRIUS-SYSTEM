import { makeRequest, formatCurrency, formatDate } from './utils.js';
let userLogin;
// Função para formatar o mês de referência
function formatReferenceMonth(dateString) {
    // Adiciona um dia para corrigir o problema de timezone
    const date = new Date(dateString + '-01:01:00');

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
}

// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};

// Carrega os descontos do colaborador
async function loadCollaboratorDiscounts() {
    try {
        const discounts = await makeRequest('/api/rh-payroll/collaborator/discounts?id_colab=' + userLogin.system_collaborator_id, 'GET');
        const container = document.getElementById('discounts-container');
        
        // Limpa o container
        container.innerHTML = '';

        if (discounts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    Você não possui descontos processados.
                </div>
            `;
            return;
        }

        // Cria o accordion para os meses
        const accordionId = 'discountAccordion';
        const accordion = document.createElement('div');
        accordion.id = accordionId;
        accordion.className = 'accordion';

        discounts.forEach((monthData, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';

            const formattedMonth = formatReferenceMonth(monthData.reference_month);

            console.log(formattedMonth, monthData.reference_month)

            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse${index}"
                            aria-expanded="${index === 0 ? 'true' : 'false'}" 
                            aria-controls="collapse${index}">
                        ${formattedMonth} - Total de Descontos: ${formatCurrency(monthData.total_discount)}
                    </button>
                </h2>
                <div id="collapse${index}" 
                     class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                     aria-labelledby="heading${index}" 
                     data-bs-parent="#${accordionId}">
                    <div class="accordion-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Categoria</th>
                                        <th>Descrição</th>
                                        <th>Valor</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${monthData.discounts.map(discount => `
                                        <tr>
                                            <td>${formatDate(discount.date)}</td>
                                            <td>${discount.category_name}</td>
                                            <td>${discount.description || 'Sem descrição'}</td>
                                            <td>${formatCurrency(discount.amount)}</td>
                                            <td>
                                                <button class="btn btn-sm btn-info view-details" 
                                                        data-id="${discount.id}">
                                                    <i class="fas fa-eye"></i> Ver Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            accordion.appendChild(accordionItem);
        });

        container.appendChild(accordion);

        // Adiciona event listeners para os botões de detalhes
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', async (e) => {
                const discountId = e.currentTarget.dataset.id;
                await viewDiscountDetails(discountId);
            });
        });

    } catch (error) {
        console.error('Erro ao carregar descontos:', error);
        const container = document.getElementById('discounts-container');
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                Erro ao carregar descontos. Por favor, tente novamente mais tarde.
            </div>
        `;
    }
}

// Função para visualizar detalhes de um desconto específico
async function viewDiscountDetails(discountId) {
    try {
        const discount = await makeRequest(`/api/rh-payroll/discount/${discountId}`, 'GET');
        
        const modalBody = document.getElementById('monthDetailsBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h5>Informações do Desconto</h5>
                    <table class="table">
                        <tr>
                            <th>Categoria</th>
                            <td>${discount.category_name}</td>
                        </tr>
                        <tr>
                            <th>Data</th>
                            <td>${formatDate(discount.date)}</td>
                        </tr>
                        <tr>
                            <th>Mês de Referência</th>
                            <td>${formatReferenceMonth(discount.reference_month)}</td>
                        </tr>
                        <tr>
                            <th>Valor</th>
                            <td>${formatCurrency(discount.amount)}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h5>Descrição</h5>
                    <p>${discount.description || 'Sem descrição adicional'}</p>
                    
                    ${discount.attachment_path ? `
                        <h5>Anexo</h5>
                        <a href="/api/rh-payroll/download-file/${discount.attachment_path}" 
                           class="btn btn-primary" target="_blank">
                            <i class="fas fa-download"></i> Baixar Anexo
                        </a>
                    ` : ''}
                </div>
            </div>
        `;

        // Mostra o modal
        const modal = new bootstrap.Modal(document.getElementById('monthDetailsModal'));
        modal.show();

    } catch (error) {
        console.error('Erro ao buscar detalhes do desconto:', error);
        alert('Erro ao buscar detalhes do desconto');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    userLogin = await getInfosLogin();
 
    await loadCollaboratorDiscounts();
    
    document.querySelector('#loader2').classList.add('d-none');
});
