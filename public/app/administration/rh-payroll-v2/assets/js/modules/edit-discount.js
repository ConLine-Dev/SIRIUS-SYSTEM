import { loadEmployees, loadTypes, showToast, formatCurrency, makeRequest } from './utils.js';

let pond;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await listEmployees();
    await displayTypes();
    setupFilePond();
    initializeEventListeners();
    setupCurrencyInput();
    
    // Carrega os detalhes do desconto após inicializar os campos
    await loadDiscountDetails();
    
    document.querySelector('#loader2').classList.add('d-none');
});

// Carrega lista de funcionários
async function listEmployees(){
    try {
        const employees = await loadEmployees();
        const selectElement = document.getElementById('employee');
        
        // Limpa as opções existentes
        selectElement.innerHTML = '<option value="">Selecione...</option>';
        
        // Adiciona as novas opções
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id_colab;
            option.textContent = employee.username + ' ' + employee.familyName;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

// Carrega lista de tipos
async function displayTypes() {
    try {
        const types = await loadTypes();

        const selectElement = document.getElementById('type');
        
        // Limpa as opções existentes
        selectElement.innerHTML = '<option value="">Selecione...</option>';
        
        // Adiciona as novas opções
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name_discount;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar tipos:', error);
    }
}

// Inicializa os ouvintes de eventos
function initializeEventListeners() {
    // Formulário de Desconto
    const form = document.getElementById('add-discount-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

function setupFilePond() {
    // Registra os plugins do FilePond
    FilePond.registerPlugin(
        FilePondPluginImagePreview,
        FilePondPluginImageEdit,
        FilePondPluginFileValidateSize,
        FilePondPluginFileValidateType
    );

    // Configurações do FilePond
    const inputElement = document.querySelector('input[type="file"].filepond');
    
    pond = FilePond.create(inputElement, {
        allowMultiple: false,
        maxFiles: 1,
        labelIdle: 'Arraste e solte seus arquivos ou <span class="filepond--label-action">Procure</span>',
        labelFileProcessing: 'Carregando',
        labelFileProcessingComplete: 'Upload Completo',
        labelFileProcessingAborted: 'Upload Cancelado',
        labelFileProcessingError: 'Erro no Upload',
        labelFileTypeNotAllowed: 'Tipo de arquivo inválido',
        labelFileSizeNotAllowed: 'Arquivo muito grande',
        labelTapToCancel: 'clique para cancelar',
        labelTapToRetry: 'clique para tentar novamente',
        labelTapToUndo: 'clique para desfazer',
        labelMaxFilesExceeded: 'Limite de arquivos excedido',
        
        // Validação de tipo de arquivo
        acceptedFileTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ],
        fileValidateTypeDetectType: (source, type) => new Promise((resolve, reject) => {
            // Para arquivos que não são imagens
            if (type === 'application/pdf' || type.includes('word')) {
                resolve(type);
            }
            // Para imagens
            resolve(type);
        }),
        
        // Limite de tamanho (5MB)
        maxFileSize: '5MB',
        
        // Configurações de imagem
        imagePreviewHeight: 160,
        imageCropAspectRatio: '1:1',
        imageResizeTargetWidth: 200,
        imageResizeTargetHeight: 200,
        
        // Configurações do servidor (mock por enquanto)
        server: {
            process: (fieldName, file, metadata, load, error, progress, abort) => {
                // Simula upload para o servidor
                const interval = setInterval(() => {
                    progress(Math.random() * 100);
                }, 100);
                
                setTimeout(() => {
                    clearInterval(interval);
                    load('uploaded-file-' + Date.now());
                }, 1500);
                
                return {
                    abort: () => {
                        clearInterval(interval);
                        abort();
                    }
                };
            },
            revert: (uniqueFileId, load) => {
                // Simula remoção do arquivo no servidor
                setTimeout(load, 500);
            }
        },

        // Callbacks
        onaddfile: (error, file) => {
            if (error) {
                console.error('Erro ao adicionar arquivo:', error);
                return;
            }
            console.log('Arquivo adicionado:', file.filename);
        },
        onremovefile: (error, file) => {
            if (error) {
                console.error('Erro ao remover arquivo:', error);
                return;
            }
            console.log('Arquivo removido:', file.filename);
        },
        onprocessfile: (error, file) => {
            if (error) {
                console.error('Erro ao processar arquivo:', error);
                return;
            }
            console.log('Arquivo processado:', file.filename);
        }
    });
}

// Configura o input de moeda
function setupCurrencyInput() {
    const amountInput = document.getElementById('amount');
    if (!amountInput) return;

    function formatValue(value) {
        // Remove tudo exceto números
        value = value.replace(/\D/g, '');
        
        // Converte para número e divide por 100 para considerar os centavos
        const numericValue = Number(value) / 100;
        
        // Formata com duas casas decimais e vírgula
        return numericValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Define valor inicial
    amountInput.value = formatValue('0');

    amountInput.addEventListener('input', function(e) {
        const value = e.target.value.replace(/\D/g, '');
        if (value === '') {
            e.target.value = formatValue('0');
            return;
        }
        e.target.value = formatValue(value);
    });

    // Seleciona todo o texto quando o input recebe foco
    amountInput.addEventListener('focus', function(e) {
        e.target.select();
    });

    // Adiciona tratamento para o envio do formulário
    const form = document.getElementById('add-discount-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Converte o valor para o formato que o backend espera (ponto como separador decimal)
            const rawValue = amountInput.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            
            // Atualiza o valor do input para envio
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'amount';
            hiddenInput.value = numericValue.toFixed(2);
            form.appendChild(hiddenInput);
            
            // Remove o input original do envio
            amountInput.removeAttribute('name');
        });
    }
}

// Carrega os detalhes do desconto
async function loadDiscountDetails() {
    try {
        // Obtém o ID do desconto da URL
        const urlParams = new URLSearchParams(window.location.search);
        const discountId = urlParams.get('id');

        if (!discountId) {
            showToast('ID do desconto não encontrado', 'error');
            return;
        }

        // Busca os detalhes do desconto
        const response = await makeRequest(`/api/rh-payroll/discount/${discountId}`, 'GET');
        
        if (!response) {
            showToast('Erro ao carregar detalhes do desconto', 'error');
            return;
        }

        // Popula os campos do formulário
        document.getElementById('employee').value = response.collaborator_id;
        document.getElementById('type').value = response.category_id;
        document.getElementById('amount').value = formatCurrency(response.amount);
        document.getElementById('date').value = response.date ? response.date.split('T')[0] : '';
        document.getElementById('reference_month').value = response.reference_month;
        document.getElementById('description').value = response.description || '';

        // Se houver anexo, configura o FilePond
        if (response.attachment_path) {
            const attachmentLink = document.createElement('a');
            attachmentLink.href = `/api/rh-payroll/download-file/${response.attachment_path}`;
            attachmentLink.textContent = 'Baixar Anexo Atual';
            attachmentLink.classList.add('btn', 'btn-primary', 'mt-2');
            document.getElementById('attachment-container').appendChild(attachmentLink);
        }

    } catch (error) {
        console.error('Erro ao carregar detalhes do desconto:', error);
        showToast('Erro ao carregar detalhes do desconto', 'error');
    }
}

// Função para enviar o formulário
async function handleSubmit(e) {
    e.preventDefault();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const discountId = urlParams.get('id');

        const formData = new FormData();
        formData.append('collaborator_id', document.getElementById('employee').value);
        formData.append('category_id', document.getElementById('type').value);
        formData.append('amount', parseAmountValue(document.getElementById('amount').value));
        formData.append('date', document.getElementById('date').value);
        formData.append('reference_month', document.getElementById('reference_month').value);
        formData.append('description', document.getElementById('description').value);

        // Adiciona o arquivo se estiver presente
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput.files.length > 0) {
            formData.append('attachment', fileInput.files[0]);
        }

        // Adiciona o ID do desconto para identificar a edição
        formData.append('id', discountId);

        const response = await fetch('/api/rh-payroll/discount/update', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showToast('Desconto atualizado com sucesso', 'success');
            // Opcional: redirecionar ou fechar a janela
            window.close();
        } else {
            showToast('Erro ao atualizar desconto', 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar desconto:', error);
        showToast('Erro ao atualizar desconto', 'error');
    }
}

// Função para parsear o valor do input de moeda
function parseAmountValue(value) {
    return parseFloat(value.replace(/\D/g, '')) / 100;
}
