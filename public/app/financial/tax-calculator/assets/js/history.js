document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const historyContainer = document.getElementById('history-container');
    const btnBack = document.getElementById('btn-back');
    const btnExportJson = document.getElementById('btn-export-json');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const loader = document.getElementById('loader2');

    let historyData = [];

    // --- Functions ---
    const formatCurrency = (value) => {
        if (isNaN(value)) return "---";
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'Data indisponível';
        const date = new Date(isoString);
        // Subtrai 3 horas para ajustar ao fuso horário de Brasília (UTC-3)
        date.setHours(date.getHours() - 3);
        return date.toLocaleString('pt-BR');
    };

    const renderHistory = (items) => {
        historyContainer.innerHTML = '';
        if (items.length === 0) {
            historyContainer.innerHTML = '<p class="text-center text-muted">Nenhum cálculo no histórico.</p>';
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            
            let detailsHtml = `
                <p class="mb-1"><strong>Valor Produto:</strong> ${formatCurrency(item.productValue)}</p>
                <p class="mb-1"><strong>Alíquota:</strong> ${item.rate}%</p>
            `;
            
            if (item.type === 'ICMS' && item.reducedBase) {
                detailsHtml += `<p class="mb-1"><strong>Base de Cálculo Reduzida:</strong> ${item.reducedBase}%</p>`;
            }

            detailsHtml += `
                <hr class="my-2">
                <p class="mb-1"><strong>Valor Imposto:</strong> <span class="text-danger">${formatCurrency(item.taxAmount)}</span></p>
                <p class="mb-1"><strong>Valor Total:</strong> <span class="text-success fw-bold">${formatCurrency(item.totalAmount)}</span></p>
                <hr class="my-2">
                <p class="mb-0 text-muted"><small><em>Notas: ${item.notes || ''}</em></small></p>
            `;

            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="card-title text-primary mb-0">${item.type}</h6>
                            <small class="text-muted">por: ${item.authorName || 'N/A'}</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <small class="text-muted me-3">${formatDate(item.createdAt)}</small>
                            <button class="btn btn-sm btn-outline-danger btn-delete-history" data-id="${item.id}" title="Excluir registro">
                                <i class="ri-delete-bin-line" style="pointer-events: none;"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-3">
                        ${detailsHtml}
                    </div>
                </div>
            `;
            historyContainer.appendChild(card);
        });
    };

    const fetchHistory = async () => {
        loader.style.display = 'block';
        try {
            historyData = await makeRequest('/api/tax-calculator/history');
            renderHistory(historyData);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            historyContainer.innerHTML = '<p class="text-center text-danger">Falha ao carregar o histórico.</p>';
        } finally {
            loader.style.display = 'none';
        }
    };

    const exportToJson = () => {
        if (historyData.length === 0) {
            alert('Não há histórico para exportar.');
            return;
        }
        const dataStr = JSON.stringify(historyData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'tax_calculator_history.json';

        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const clearHistory = async () => {
        if (!confirm('Tem certeza que deseja limpar todo o histórico de cálculos? Esta ação não pode ser desfeita.')) {
            return;
        }

        loader.style.display = 'block';
        try {
            await makeRequest('/api/tax-calculator/history', 'DELETE');
            alert('Histórico limpo com sucesso.');
            fetchHistory(); // Refresh the view
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
            alert('Falha ao limpar o histórico.');
        } finally {
            loader.style.display = 'none';
        }
    };

    const deleteHistoryItem = async (id) => {
        if (!confirm(`Tem certeza que deseja excluir este registro?`)) {
            return;
        }

        loader.style.display = 'block';
        try {
            await makeRequest(`/api/tax-calculator/history/${id}`, 'DELETE');
            fetchHistory(); // Recarrega a lista para refletir a exclusão
        } catch (error) {
            console.error('Erro ao excluir registro:', error);
            alert('Falha ao excluir o registro.');
        } finally {
            loader.style.display = 'none';
        }
    };

    // --- Event Listeners ---
    btnBack.addEventListener('click', () => window.close());
    btnExportJson.addEventListener('click', exportToJson);
    btnClearHistory.addEventListener('click', clearHistory);
    
    historyContainer.addEventListener('click', (event) => {
        if (event.target.closest('.btn-delete-history')) {
            const id = event.target.closest('.btn-delete-history').dataset.id;
            deleteHistoryItem(id);
        }
    });

    window.addEventListener('storage', (event) => {
        // Recarrega o histórico se outra aba salvou um novo cálculo
        if (event.key === 'taxHistoryNeedsUpdate') {
            fetchHistory();
        }
    });

    // --- Initial Load ---
    fetchHistory();
}); 