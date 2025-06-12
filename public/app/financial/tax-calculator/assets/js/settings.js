document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const adValoremRateInput = document.getElementById('default-ad-valorem-rate');
    const icmsRateInput = document.getElementById('default-icms-rate');
    const icmsReducedBaseInput = document.getElementById('default-icms-reduced-base');
    const btnSave = document.getElementById('btn-save-settings');
    const btnBack = document.getElementById('btn-back');
    const feedbackMessage = document.getElementById('feedback-message');
    const loader = document.getElementById('loader2');

    // --- Functions ---
    const loadSettings = async () => {
        loader.style.display = 'block';
        try {
            const settings = await makeRequest('/api/tax-calculator/settings');
            adValoremRateInput.value = parseFloat(settings.defaultAdValoremRate) || '1';
            icmsRateInput.value = parseFloat(settings.defaultIcmsRate) || '18';
            icmsReducedBaseInput.value = parseFloat(settings.defaultIcmsReducedBase) || '100';
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            showFeedback('Falha ao carregar as configurações do servidor.', 'danger');
        } finally {
            loader.style.display = 'none';
        }
    };

    const saveSettings = async () => {
        const settings = {
            defaultAdValoremRate: parseFloat(adValoremRateInput.value),
            defaultIcmsRate: parseFloat(icmsRateInput.value),
            defaultIcmsReducedBase: parseFloat(icmsReducedBaseInput.value)
        };

        // Validation
        if (isNaN(settings.defaultAdValoremRate) || settings.defaultAdValoremRate < 0) {
            showFeedback('Alíquota Ad Valorem padrão é inválida.', 'danger');
            return;
        }
        if (isNaN(settings.defaultIcmsRate) || settings.defaultIcmsRate < 0) {
            showFeedback('Alíquota ICMS padrão é inválida.', 'danger');
            return;
        }
        if (isNaN(settings.defaultIcmsReducedBase) || settings.defaultIcmsReducedBase < 0 || settings.defaultIcmsReducedBase > 100) {
            showFeedback('Base de Cálculo Reduzida do ICMS deve ser entre 0 e 100.', 'danger');
            return;
        }

        loader.style.display = 'block';
        try {
            await makeRequest('/api/tax-calculator/settings', 'POST', settings);
            showFeedback('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            showFeedback('Falha ao salvar as configurações no servidor.', 'danger');
        } finally {
            loader.style.display = 'none';
        }
    };

    const showFeedback = (message, type = 'success') => {
        feedbackMessage.className = `alert alert-${type}`;
        feedbackMessage.textContent = message;
        setTimeout(() => {
            feedbackMessage.textContent = '';
            feedbackMessage.className = '';
        }, 3000);
    };

    // --- Event Listeners ---
    btnSave.addEventListener('click', saveSettings);
    btnBack.addEventListener('click', () => window.close());

    // --- Initial Load ---
    loadSettings();
}); 