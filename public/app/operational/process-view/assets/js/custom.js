// Aguarda o documento estar pronto
document.addEventListener('DOMContentLoaded', function() {
    // Remove o loader quando a página estiver carregada
    document.getElementById('loader').style.display = 'none';

    // Inicializa os componentes
    initializeComponents();
});

function initializeComponents() {
    // Inicializa a tabela de House com DataTables
    $('#house-table').DataTable({
        language: {
            url: '../../assets/libs/datatables/pt-BR.json'
        },
        responsive: true
    });

    // Carrega os dados do processo
    loadProcessData();
}

function loadProcessData() {
    // TODO: Implementar chamada à API para carregar dados do processo
    // Por enquanto, vamos usar dados de exemplo
    const mockData = {
        contacts: {
            operational: [
                { role: 'Operacional', name: 'João Silva', email: 'joao@example.com' },
                { role: 'Inside', name: 'Maria Santos', email: 'maria@example.com' },
                { role: 'Comercial', name: 'Pedro Souza', email: 'pedro@example.com' }
            ],
            parties: [
                { type: 'Cliente', name: 'Empresa ABC', contact: 'Carlos Lima' },
                { type: 'Exportador', name: 'Export Co.', contact: 'John Doe' },
                { type: 'Importador', name: 'Import Ltd.', contact: 'Jane Smith' }
            ]
        },
        shipping: {
            origin: 'Santos, SP',
            destination: 'Shanghai, China',
            expectedShipDate: '2024-03-01',
            shipDate: '2024-03-02',
            expectedArrivalDate: '2024-04-01',
            arrivalDate: null,
            vessel: 'MAERSK SEALAND',
            billNumber: 'MSKU123456789',
            payment: 'PREPAID'
        },
        cargo: {
            grossWeight: '1000 KG',
            volume: '10 M³',
            packages: '100',
            equipment: '1x40HC',
            freeTime: '21 dias',
            ncm: '8471.30.19'
        },
        house: [
            { cargo: 'Eletrônicos', container: 'MSKU1234567' },
            { cargo: 'Acessórios', container: 'MSKU7654321' }
        ],
        additionalInfo: {
            rateValidityDate: '2024-12-31',
            documentDistribution: {
                ombl: 'EBL',
                ohbl: 'EXPRESS'
            }
        },
        follows: [
            {
                date: '2024-02-15',
                text: 'Documentação recebida e processada.',
                author: 'Maria Santos'
            },
            {
                date: '2024-02-14',
                text: 'Booking confirmado com o armador.',
                author: 'João Silva'
            }
        ]
    };

    // Preenche as seções com os dados
    renderContacts(mockData.contacts);
    renderShippingInfo(mockData.shipping);
    renderCargoInfo(mockData.cargo);
    renderHouseInfo(mockData.house);
    renderAdditionalInfo(mockData.additionalInfo);
    renderFollows(mockData.follows);
}

function renderContacts(contacts) {
    // Renderiza contatos operacionais
    const operationalHtml = contacts.operational.map(contact => `
        <div class="contact-info">
            <div class="info-label">${contact.role}</div>
            <div class="info-value">${contact.name}</div>
            <div class="info-value">${contact.email}</div>
        </div>
    `).join('');
    document.getElementById('operational-contacts').innerHTML = operationalHtml;

    // Renderiza partes envolvidas
    const partiesHtml = contacts.parties.map(party => `
        <div class="contact-info">
            <div class="info-label">${party.type}</div>
            <div class="info-value">${party.name}</div>
            <div class="info-value">${party.contact}</div>
        </div>
    `).join('');
    document.getElementById('involved-parties').innerHTML = partiesHtml;
}

function renderShippingInfo(shipping) {
    const html = `
        <div class="row">
            <div class="col-md-6">
                <div class="info-label">Origem</div>
                <div class="info-value">${shipping.origin}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Destino</div>
                <div class="info-value">${shipping.destination}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Previsão de Embarque</div>
                <div class="info-value">${formatDate(shipping.expectedShipDate)}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Data de Embarque</div>
                <div class="info-value">${shipping.shipDate ? formatDate(shipping.shipDate) : '-'}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Previsão de Chegada</div>
                <div class="info-value">${formatDate(shipping.expectedArrivalDate)}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Data de Chegada</div>
                <div class="info-value">${shipping.arrivalDate ? formatDate(shipping.arrivalDate) : '-'}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Navio</div>
                <div class="info-value">${shipping.vessel}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Número do Conhecimento</div>
                <div class="info-value">${shipping.billNumber} (${shipping.payment})</div>
            </div>
        </div>
    `;
    document.getElementById('shipping-info').innerHTML = html;
}

function renderCargoInfo(cargo) {
    const html = `
        <div class="row">
            <div class="col-md-6">
                <div class="info-label">Peso Bruto</div>
                <div class="info-value">${cargo.grossWeight}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Volume</div>
                <div class="info-value">${cargo.volume}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Quantidade de Volumes</div>
                <div class="info-value">${cargo.packages}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Total Equipamentos</div>
                <div class="info-value">${cargo.equipment}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">Free Time</div>
                <div class="info-value">${cargo.freeTime}</div>
            </div>
            <div class="col-md-6">
                <div class="info-label">NCM</div>
                <div class="info-value">${cargo.ncm}</div>
            </div>
        </div>
    `;
    document.getElementById('cargo-info').innerHTML = html;
}

function renderHouseInfo(house) {
    const table = $('#house-table').DataTable();
    table.clear();
    house.forEach(item => {
        table.row.add([item.cargo, item.container]);
    });
    table.draw();
}

function renderAdditionalInfo(info) {
    const html = `
        <div class="row">
            <div class="col-12">
                <div class="info-label">Data de Validade das Taxas</div>
                <div class="info-value">${formatDate(info.rateValidityDate)}</div>
            </div>
            <div class="col-12">
                <div class="info-label">Distribuição de Documentos</div>
                <div class="info-value">OMBL: ${info.documentDistribution.ombl}</div>
                <div class="info-value">OHBL: ${info.documentDistribution.ohbl}</div>
            </div>
        </div>
    `;
    document.getElementById('additional-info').innerHTML = html;
}

function renderFollows(follows) {
    const html = follows.map(follow => `
        <div class="follow-item">
            <div class="follow-date">${formatDate(follow.date)}</div>
            <div class="follow-text">${follow.text}</div>
            <div class="follow-author">Por: ${follow.author}</div>
        </div>
    `).join('');
    document.getElementById('last-follows').innerHTML = html;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}
