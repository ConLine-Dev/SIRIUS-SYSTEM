document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentTaxType = 'Ad Valorem'; // or 'ICMS'
    let lastCalculation = null;

    // --- DOM Elements ---
    const btnAdValorem = document.getElementById('btn-ad-valorem');
    const btnIcms = document.getElementById('btn-icms');
    const productValueInput = document.getElementById('product-value');
    
    // Ad Valorem fields
    const adValoremFields = document.getElementById('ad-valorem-fields');
    const adValoremRateInput = document.getElementById('ad-valorem-rate');

    // ICMS fields
    const icmsFields = document.getElementById('icms-fields');
    const icmsReducedBaseInput = document.getElementById('icms-reduced-base');
    const icmsRateInput = document.getElementById('icms-rate');

    // Display
    const taxAmountDisplay = document.getElementById('tax-amount-display');
    const totalAmountDisplay = document.getElementById('total-amount-display');
    const errorMessage = document.getElementById('error-message');

    // Action Buttons
    const btnCalculate = document.getElementById('btn-calculate');
    const btnClear = document.getElementById('btn-clear');
    const btnSave = document.getElementById('btn-save');

    // Navigation Buttons
    const btnHistory = document.getElementById('btn-history');
    const btnSettings = document.getElementById('btn-settings');

    // --- Functions ---
    const getFloat = (str) => parseFloat(String(str).replace(',', '.'));

    const formatCurrency = (value) => {
        if (isNaN(value)) return "---";
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const switchTaxType = (type) => {
        currentTaxType = type;
        if (type === 'Ad Valorem') {
            btnAdValorem.classList.add('btn-primary');
            btnAdValorem.classList.remove('btn-outline-primary');
            btnIcms.classList.add('btn-outline-primary');
            btnIcms.classList.remove('btn-primary');

            adValoremFields.classList.remove('d-none');
            icmsFields.classList.add('d-none');
        } else { // ICMS
            btnIcms.classList.add('btn-primary');
            btnIcms.classList.remove('btn-outline-primary');
            btnAdValorem.classList.add('btn-outline-primary');
            btnAdValorem.classList.remove('btn-primary');

            icmsFields.classList.remove('d-none');
            adValoremFields.classList.add('d-none');
        }
        clearForm();
        loadDefaultRates();
    };

    const clearForm = () => {
        productValueInput.value = '';
        errorMessage.textContent = '';
        taxAmountDisplay.textContent = '---';
        totalAmountDisplay.textContent = '---';
        btnSave.disabled = true;
        lastCalculation = null;
        loadDefaultRates();
    };
    
    const loadDefaultRates = async () => {
        try {
            const settings = await makeRequest('/api/tax-calculator/settings');
            adValoremRateInput.value = parseFloat(settings.defaultAdValoremRate) || 0.13;
            icmsRateInput.value = parseFloat(settings.defaultIcmsRate) || 12;
            icmsReducedBaseInput.value = parseFloat(settings.defaultIcmsReducedBase) || 88;
        } catch (error) {
            console.error('Falha ao carregar alíquotas padrão do servidor. Usando valores locais.', error);
            // Fallback para valores padrão caso a API falhe
            adValoremRateInput.value = 0.13;
            icmsRateInput.value = 12;
            icmsReducedBaseInput.value = 88;
        }
    };

    const validateInputs = () => {
        const productValue = getFloat(productValueInput.value);
        if (isNaN(productValue) || productValue <= 0) {
            errorMessage.textContent = 'Por favor, insira um valor do produto válido e positivo.';
            return false;
        }

        // Validação de limite para o valor do produto (DECIMAL(15,2) -> max 9.999.999.999.999,99)
        if (productValue >= 10_000_000_000_000) {
            errorMessage.textContent = 'O valor do produto é muito grande.';
            return false;
        }

        if (currentTaxType === 'Ad Valorem') {
            const rate = getFloat(adValoremRateInput.value);
            if (isNaN(rate) || rate < 0) {
                errorMessage.textContent = 'A alíquota de Ad Valorem deve ser um número não negativo.';
                return false;
            }
            // Validação de limite para a alíquota (DECIMAL(10,2) -> max 99.999.999,99)
            if (rate >= 100_000_000) {
                errorMessage.textContent = 'O valor da alíquota Ad Valorem é muito grande.';
                return false;
            }
        } else { // ICMS
            const reducedBase = getFloat(icmsReducedBaseInput.value);
            const rate = getFloat(icmsRateInput.value);
            if (isNaN(reducedBase) || reducedBase < 0 || reducedBase > 100) {
                errorMessage.textContent = 'A base de cálculo reduzida do ICMS deve ser entre 0 e 100.';
                return false;
            }
            if (isNaN(rate) || rate < 0) {
                errorMessage.textContent = 'A alíquota de ICMS deve ser um número não negativo.';
                return false;
            }
            // Validação de limite para a alíquota (DECIMAL(10,2) -> max 99.999.999,99)
            if (rate >= 100_000_000) {
                errorMessage.textContent = 'O valor da alíquota ICMS é muito grande.';
                return false;
            }
        }
        
        errorMessage.textContent = '';
        return true;
    };

    const calculate = () => {
        if (!validateInputs()) {
            return;
        }

        const productValue = getFloat(productValueInput.value);
        let taxAmount, totalAmount, rate, reducedBase, notes;

        if (currentTaxType === 'Ad Valorem') {
            rate = getFloat(adValoremRateInput.value);
            taxAmount = productValue * (rate / 100);
            totalAmount = productValue + taxAmount;
            notes = `Ad Valorem: Valor R$ ${productValue.toFixed(2)}, Alíquota ${rate}%`;
        } else { // ICMS
            reducedBase = getFloat(icmsReducedBaseInput.value);
            rate = getFloat(icmsRateInput.value);
            const rateDecimal = rate / 100;
            
            if (rate >= 100) {
                errorMessage.textContent = 'A alíquota de ICMS deve ser menor que 100 para o cálculo "por dentro".';
                taxAmountDisplay.textContent = '---';
                totalAmountDisplay.textContent = '---';
                btnSave.disabled = true;
                return;
            }

            // A fórmula correta para o cálculo "por dentro", conforme o exemplo do usuário.
            // Ex: R$ 837,42 / (1 - 0,12) = R$ 951,61 (Base de Cálculo)
            // R$ 951,61 * 0,12 = R$ 114,19 (Valor do ICMS)
            const calculationBase = productValue / (1 - rateDecimal);
            taxAmount = calculationBase * rateDecimal;

            // O valor total é o valor do produto mais o imposto.
            totalAmount = productValue + taxAmount;
            notes = `ICMS: Valor R$ ${productValue.toFixed(2)}, Alíquota ${rate}%, Base Reduzida ${reducedBase}% (Cálculo por dentro)`;
        }
        
        taxAmountDisplay.textContent = formatCurrency(taxAmount);
        totalAmountDisplay.textContent = formatCurrency(totalAmount);

        lastCalculation = {
            type: currentTaxType,
            productValue: productValue,
            rate: rate,
            reducedBase: currentTaxType === 'ICMS' ? reducedBase : null,
            taxAmount: taxAmount,
            totalAmount: totalAmount,
            notes: notes
        };
        
        btnSave.disabled = false;
    };

    const saveToHistory = async () => {
        if (!lastCalculation) {
            alert('Nenhum cálculo para salvar.');
            return;
        }

        try {
            const response = await makeRequest('/api/tax-calculator/history', 'POST', lastCalculation);
            alert('Cálculo salvo no histórico com sucesso!');
            localStorage.setItem('taxHistoryNeedsUpdate', Date.now()); // Notifica outras abas
            btnSave.disabled = true;
        } catch (error) {
            console.error('Erro ao salvar no histórico:', error);
            alert('Falha ao salvar no histórico. Verifique o console para mais detalhes.');
        }
    };

    // --- Event Listeners ---
    btnAdValorem.addEventListener('click', () => switchTaxType('Ad Valorem'));
    btnIcms.addEventListener('click', () => switchTaxType('ICMS'));
    btnCalculate.addEventListener('click', calculate);
    btnClear.addEventListener('click', clearForm);
    btnSave.addEventListener('click', saveToHistory);

    btnHistory.addEventListener('click', () => {
        window.open('history.html', null, 'width=700,height=800');
    });

    btnSettings.addEventListener('click', () => {
        window.open('settings.html', null, 'width=600,height=550');
    });
    
    // --- Initial Load ---
    loadDefaultRates();
    // Esconde o loader
    const loader = document.getElementById('loader2');
    if(loader) {
        loader.style.display = 'none';
    }
}); 