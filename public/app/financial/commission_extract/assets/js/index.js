// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
let startDateGlobal, endDateGlobal, dataExport, table = [], listAllUsers;

// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {
    // Verifica o localStorage para alterar a mensagem de boas vindas
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
 
    if (!localStorage.getItem('StorageGoogle')) {
        window.location.href = '/app/login';
    } else {
        document.querySelector('body').style.display = 'block'
    }
 
 
 
    const loginTime = localStorage.getItem('loginTime');
 
    if (loginTime) {
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - parseInt(loginTime);
    
        // 24 horas em milissegundos
        const twentyFourHours = 1000;
 
        if (elapsedTime >= twentyFourHours) {
            // Limpa os dados do usuário e redireciona para a página de login
            localStorage.removeItem('StorageGoogle');
            localStorage.removeItem('loginTime');
            window.location.href = '/app/login';
        }
    }
};

// Verifica o localStorage para setar informações
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
 
    return StorageGoogle;
};

// Verifica o localStorage para setar informações
async function setInfosLogin(StorageGoogle) {
    document.querySelectorAll('.imgUser').forEach(element => {
        element.src = StorageGoogle.picture ? StorageGoogle.picture : StorageGoogle.system_image
    });
 
    document.querySelectorAll('.UserName').forEach(element => {
        element.textContent = StorageGoogle.given_name.replace(/[^a-zA-Z\s]/g, '');
    });
 
    document.querySelectorAll('.buttonLogout').forEach(element => {
        element.addEventListener('click', function (e) {
                e.preventDefault()
        
                localStorage.removeItem('StorageGoogle');
                localStorage.removeItem('loginTime');
        
                window.location.href = '/app/login'
        })
 
    });
 
 
};

// Função para calcular o valor total da coluna value_comission considerando apenas os itens visíveis da tabela
function calcularValorTotal() {
    let valorTotal = 0;
    table['tableExtractComission'].rows({ search: 'applied' }).data().each(function (row) {
        valorTotal += parseFloat(row.value_comission);
    });


    const numeroRegistrosFiltrados = table['tableExtractComission'].rows({ search: 'applied' }).count();
    document.querySelector('.total-comisions').textContent = numeroRegistrosFiltrados;

    document.querySelector('.total-pay').textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal.toFixed(2));
}



// Função para armazenar os dados originais da tabela
function armazenarDadosOriginais(dataTable) {
    if (!dataTable.originalData) {
        dataTable.originalData = dataTable.rows().data().toArray(); // Armazena os dados originais uma única vez
    }
}

// Função auxiliar para converter a data de entrada no formato esperado
function parseDateInput(dataStr, time) {
    return new Date(`${dataStr}T${time}`);
}

// Função para aplicar filtros aos dados
function aplicarFiltros(dataSet, filtros) {
    return dataSet.filter(row => {
        // Aplica todas as condições de filtragem aos dados
        return filtros.every(filtro => filtro(row));
    });
}

// Mapeamento de meses fora da função para otimização
const month_map = {
    'Jan': '01',
    'Fev': '02',
    'Mar': '03',
    'Abr': '04',
    'Mai': '05',
    'Jun': '06',
    'Jul': '07',
    'Ago': '08',
    'Set': '09',
    'Out': '10',
    'Nov': '11',
    'Dez': '12',
};

// Função principal para filtrar por data, comissionado, status, pessoas, criado por e data de pagamento
function filtrarPorData() {
    if (table['tableExtractComission']) {
        const dataTable = table['tableExtractComission'];

        // Obtém o valor do select do comissionado
        const comissionadSelect = document.getElementById('comissionad');
        const comissionadValue = comissionadSelect.value; // Captura o valor selecionado

        // Obtém o valor do select do status
        const statusSelect = document.getElementById('commision_status');
        const statusValue = statusSelect.value; // Captura o valor selecionado

        // Obtém o valor do select de pessoas comissionadas
        const peopleSelect = document.getElementById('peopleCommisioned');
        const peopleValue = peopleSelect.value; // Captura o valor selecionado

        // Obtém o valor do select do usuário criador
        const createBySelect = document.getElementById('createBy');
        const createByValue = createBySelect.value; // Captura o valor selecionado

        // Obtém o valor do input de data de criação
        const inputDateCreate = document.getElementById('inputDateCreate');
        const dateRangeCreate = inputDateCreate.value;
        
        // Divide o valor em duas datas separadas, se for válido
        const [startDateStr, endDateStr] = dateRangeCreate.includes(' até ') ? dateRangeCreate.split(' até ') : [null, null];

        // Obtém o valor do input de data de pagamento
        const inputDatePayment = document.getElementById('inputDatePayment');
        const dateRangePayment = inputDatePayment.value;

        // Divide o valor em duas datas separadas para o pagamento, se for válido
        const [startPaymentDateStr, endPaymentDateStr] = dateRangePayment.includes(' até ') ? dateRangePayment.split(' até ') : [null, null];

        // Função para converter uma data "01 jan 2024" para "2024-01-01"
        const formatDate = (dateStr) => {
            if (!dateStr) {
                return false;
            } else {
                const [day, month, year] = dateStr.split(' ');
                return `${year}-${month_map[month]}-${day.padStart(2, '0')}`;
            }
        };

        const dataDe = formatDate(startDateStr);
        const dataAte = formatDate(endDateStr);

        const paymentDataDe = formatDate(startPaymentDateStr);
        const paymentDataAte = formatDate(endPaymentDateStr);

        // Atualiza os dados via AJAX antes de aplicar o filtro
        dataTable.ajax.reload(function() {
            // Após a recarga via AJAX, armazena os dados originais
            armazenarDadosOriginais(dataTable);

            // Inicializa o array de filtros
            let filtros = [];

            // Adiciona a lógica de filtragem por data de criação, se as datas forem válidas
            if (dataDe && dataAte) {
                const dataDeFormatada = parseDateInput(dataDe, '00:00:00');
                const dataAteFormatada = parseDateInput(dataAte, '23:59:59');

                // Verifica se as datas são válidas
                if (!isNaN(dataDeFormatada.getTime()) && !isNaN(dataAteFormatada.getTime())) {
                    // Adiciona um filtro para verificar se as datas estão no intervalo
                    filtros.push(row => {
                        const dataStr = row['date']; // Substitua pelo índice correto da coluna de datas, ex: row[2]
                        const data = new Date(dataStr);
                        return data >= dataDeFormatada && data <= dataAteFormatada;
                    });
                } else {
                    console.warn("Datas de criação inválidas fornecidas. Limpando filtro de data de criação.");
                }
            }

            // Adiciona a lógica de filtragem por data de pagamento, se as datas forem válidas
            if (paymentDataDe || paymentDataAte) {
                const paymentDataDeFormatada = paymentDataDe ? parseDateInput(paymentDataDe, '00:00:00') : null;
                const paymentDataAteFormatada = paymentDataAte ? parseDateInput(paymentDataAte, '23:59:59') : null;

                // Verifica se as datas são válidas
                if ((!paymentDataDeFormatada || !isNaN(paymentDataDeFormatada.getTime())) &&
                    (!paymentDataAteFormatada || !isNaN(paymentDataAteFormatada.getTime()))) {

                    // Adiciona um filtro para verificar se as datas de pagamento estão no intervalo e o status é 1
                    filtros.push(row => {
                        const paymentDateStr = row['payment_date']; // Substitua pelo índice correto da coluna de datas de pagamento
                        const paymentDate = new Date(paymentDateStr);
                        const status = row['status']; // Supondo que 'status' é a coluna onde o status está armazenado

                        // Verifica a data de pagamento e se o status é igual a 1
                        const isDateInRange = (paymentDataDeFormatada && !paymentDataAteFormatada && paymentDate.toDateString() === paymentDataDeFormatada.toDateString()) ||
                                            (!paymentDataDeFormatada && paymentDataAteFormatada && paymentDate.toDateString() === paymentDataAteFormatada.toDateString()) ||
                                            (paymentDataDeFormatada && paymentDataAteFormatada && paymentDate >= paymentDataDeFormatada && paymentDate <= paymentDataAteFormatada);

                        return isDateInRange && status === 1; // Retorna verdadeiro se a data for válida e o status for 1
                    });
                } else {
                    console.warn("Datas de pagamento inválidas fornecidas. Limpando filtro de data de pagamento.");
                }
            }

            // Adiciona a lógica de filtragem por tipo de comissionado, se o valor for diferente de "0"
            if (comissionadValue !== "0") {
                filtros.push(row => {
                    const comissionedType = row['commissioned_type']; // Substitua pelo índice correto da coluna de tipo de comissionado
                    return comissionedType == comissionadValue;
                });
            } else {
                console.warn("Comissionado 'Todos' selecionado. Limpando filtro de comissionado.");
            }

            // Adiciona a lógica de filtragem por status, se o valor for diferente de "all"
            if (statusValue !== "all") {
                filtros.push(row => {
                    const status = row['status']; // Substitua pelo índice correto da coluna de status
                    return status == statusValue;
                });
            } else {
                console.warn("Status 'Todos' selecionado. Limpando filtro de status.");
            }

            // Adiciona a lógica de filtragem por pessoa comissionada, se o valor for diferente de "0"
            if (peopleValue !== "0") {
                filtros.push(row => {
                    const user = row['user']; // Substitua pelo índice correto da coluna de pessoas (user)
                    return user == peopleValue;
                });
            } else {
                console.warn("Pessoa comissionada 'Todos' selecionada. Limpando filtro de pessoa.");
            }

            // Adiciona a lógica de filtragem por usuário criador, se o valor for diferente de "0"
            if (createByValue !== "0") {
                filtros.push(row => {
                    const byUser = row['by_user']; // Substitua pelo índice correto da coluna de usuários criadores (by_user)
                    return byUser == createByValue;
                });
            } else {
                console.warn("Usuário criador 'Todos' selecionado. Limpando filtro de criador.");
            }

            // Aplica os filtros ao conjunto de dados original
            const filteredData = aplicarFiltros(dataTable.originalData, filtros);

            // Atualiza a tabela com os dados filtrados
            dataTable.clear().rows.add(filteredData).draw();
            calcularValorTotal()
        }, false); // 'false' impede a ressincronização completa dos dados, mantendo o estado atual
    } else {
        console.error("'tableExtractComission' não está definido na variável 'table'.");
    }

    
}





// Esta função busca todos os usuários responsáveis via uma requisição à API
async function getAllResponsible() {
    // carrega os usuarios responsaveis
    const Responsible = await makeRequest(`/api/users/listAllUsers`);
    listAllUsers = Responsible; 
    console.log(Responsible)
    // Formate o array para ser usado com o Choices.js (Biblioteca)
    const listaDeOpcoes = Responsible.map(function (element) {
        return `<option value="${element.userID}">${element.username + ' ' + element.familyName}</option>`
    });

    const listaDeOpcoesComissioned = Responsible.map(function (element) {
        return `<option value="${element.id_headcargo}">${element.username + ' ' + element.familyName}</option>`
    });


    



    document.querySelector('#peopleCommisioned').innerHTML = '<option value="0">Todos</option>' + listaDeOpcoesComissioned.join('')

    document.querySelector('#createBy').innerHTML = '<option value="0">Todos</option>' + listaDeOpcoes.join('')

    


}










// Função Despesas Administativas puxa da API
async function tableFinancialExpenses() {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#tableExtractComission')) {
        $('#tableExtractComission').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    table['tableExtractComission'] = $('#tableExtractComission').DataTable({
        dom: 'Bfrtip',
        order: [[0, 'desc']],
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: true,
        scrollY: 'calc(100vh - 240px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        ajax: {
            url: `/api/headcargo/commission/listRegister`,
            type: 'POST',
            dataSrc: ''
        },
        columns: [
            { data: 'reference' },
            { 
                data: 'name', 
                render: function(data, type, row) {
                    return `${row.name+' '+row.family_name}`;
                }
            },
            { 
                data: 'date', 
                render: function(data, type, row) {
                    return `${formattedDateTime(data)}`;
                }
            },
            { 
                data: 'payment_date', 
                render: function(data, type, row) {
                    return data != null ? formattedDateTime(data) : `Sem Pagamento`;
                }
            },
            { 
                data: 'commissioned_type', 
                render: function(data, type, row) {
                    return data === 1 ? 'Vendedor' : 'Inside Sales';
                }
            },
            { 
                data: 'status', 
                render: function(data, type, row) {
                    return data === 0 ? 'Pendente' : data === 1 ? 'Pago' : 'Cancelado';
                }
            },
            { 
                data: 'by_user', 
                render: function(data, type, row) {
                    const user = listAllUsers.find(user => user.userID === data);

                    return `${user.username + ' ' + user.familyName}`;
                }
            },
            { 
                data: 'percentagem_comission', 
                render: function(data, type, row) {
                    return `${data}%`;
                }
            },
            { 
                data: 'value_comission',
                render: function(data, type, row) {
                    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data);
                    return formattedValue;
                }
            }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    setTimeout(() => {
        calcularValorTotal()
    }, 300);

};

// Função para formatar a data (dia, mês, ano) no gráfico
function formattedDateTime(time) {
    const date = new Date(time);

    const year = date.getFullYear(); // Ano no horário local
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses começam de 0 a 11
    const day = String(date.getDate()).padStart(2, '0'); // Dia no horário local
    const hour = String(date.getHours()).padStart(2, '0'); // Hora no horário local
    const minute = String(date.getMinutes()).padStart(2, '0'); // Minuto no horário local

    return `${day}/${month}/${year} ${hour}:${minute}`;
};


// Função para calcular o valor total dos cards
async function totalCard(data) {
    const totalInvoicing = document.querySelector('.total-invoicing')
    const totalAnticipated = document.querySelector('.total-anticipated')
    const totalInvoiceLosers = document.querySelector('.total-invoiceLosers')
    const totalTotalReceived = document.querySelector('.total-totalReceived')
    const totalTotalPaid = document.querySelector('.total-totalPaid')
    const totalADM = document.querySelector('.total-ADM')

    let invoicing = 0
    let anticipated = 0
    let invoiceLosers = 0
    let totalReceived = 0
    let totalPaid = 0
    let total_ADM = 0


    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.Tipo_Fatura && item.Tipo_Fatura === 'Faturado') {
            invoicing += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Antecipado') {
            anticipated += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Vencido') {
            invoiceLosers += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Recebido') {
            totalReceived += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Pago') {
            totalPaid += item.Valor_Total
        } else if (item.Tipo_Fatura && item.Tipo_Fatura === 'Adm') {
            total_ADM += item.Valor_Total
        }
        
    }

    invoicing = invoicing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    anticipated = anticipated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    invoiceLosers = invoiceLosers.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    totalReceived = totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    totalPaid = totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    total_ADM = total_ADM.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    totalInvoicing.textContent = invoicing
    totalAnticipated.textContent = anticipated
    totalInvoiceLosers.textContent = invoiceLosers
    totalTotalReceived.textContent = totalReceived
    totalTotalPaid.textContent = totalPaid
    totalADM.textContent = total_ADM
};







// Inicializa o seletor de data (Filtro)
async function initializeDatePicker() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1); // 1° de Janeiro do ano atual

    flatpickr("#inputDateCreate", {
        mode: "range",
        dateFormat: "d M Y",
        defaultDate: [startOfYear, today], // Defini o intervalo de data
    });

    flatpickr("#inputDatePayment", {
        mode: "range",
        dateFormat: "d M Y",
        // defaultDate: [startOfYear, today], // Defini o intervalo de data
    });
};

// Função do Filtro
async function eventClick() {
    //====== BOTÃO DE FILTRO ======//
    
    const btn_filter = document.getElementById('btn-filter');
    btn_filter.addEventListener('click', async function (e) {
        e.preventDefault();
        

        filtrarPorData();


        // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
        // document.querySelector('#loader2').classList.remove('d-none')

    })


    $('#tableExtractComission tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        }
        else {
            table['tableExtractComission'].$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });


    // Função para limpar o campo de data de criação
    document.getElementById('clearDateCreateBtn').addEventListener('click', function() {
        document.getElementById('inputDateCreate').value = ''; // Limpa o campo de data de criação
    });

    // Função para limpar o campo de data de pagamento
    document.getElementById('clearDatePaymentBtn').addEventListener('click', function() {
        document.getElementById('inputDatePayment').value = ''; // Limpa o campo de data de pagamento
    });
   


};


document.addEventListener("DOMContentLoaded", async () => {
    await checkLoginExpiration()

    setInterval(async () => {
        await checkLoginExpiration()
    }, 1000);

    const StorageGoogle = await getInfosLogin();
    await setInfosLogin(StorageGoogle)
    await getAllResponsible()
    await tableFinancialExpenses();

    await initializeDatePicker();
    await eventClick();

    introMain()
    

    
    document.querySelector('#loader2').classList.add('d-none')

})