function getLinkParams(){
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const status = params.get('status');
    return {type, status}
}

async function createTable(type, status) {

    const printData = [];
    const tableData = await makeRequest(`/api/executive-analytics-dashboard/table${type}?status=${status}`);
    const divFullTable = document.getElementById('fullTable');
    let printFullTable = '';

    if (type == 'Offers'){
        printFullTable = `
            <thead>
                <tr>
                    <th scope="col">Proposta</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Vendedor</th>
                    <th scope="col">Consignee</th>
                    <th scope="col">Shipper</th>
                    <th scope="col">Origem</th>
                    <th scope="col">Destino</th>
                    <th scope="col">Cia Transporte</th>
                    <th scope="col">Equipamentos</th>
                    <th scope="col">Tipo Proposta</th>
                    <th scope="col">Pagamento Estimado</th>
                    <th scope="col">Recebimento Estimado</th>
                    <th scope="col">Lucro Estimado</th>
                    <th scope="col">Data Abertura</th>
                </tr>
            </thead>`

        for (let i = 0; i < tableData.length; i++) {
            const item = tableData[i];
            let formattedDate = await formattedDateTime(item.Data)
            let formattedClient = await limitByCharacter(item.Cliente, 27);
            let formattedConsignee = await limitByCharacter(item.Consignee, 27);
            let formattedShipper = await limitByCharacter(item.Shipper, 27);
            let formattedCarrier = await limitByCharacter(item.Armador, 15);

            printData.push({
                reference: item.Referência,
                client: formattedClient,
                sales: item.Vendedor,
                consignee: formattedConsignee,
                shipper: formattedShipper,
                origin: item.Origem,
                destination: item.Destino,
                carrier: formattedCarrier,
                equip: item.Equipamentos,
                type: `${item.Tipo} ${item.Modal}`,
                payment: item.Total_Pagamento,
                receipt: item.Total_Recebimento,
                profit: item.Lucro_Estimado,
                date: formattedDate,
            });
        }

    } else if (type == 'Processes'){
        printFullTable = `
            <thead>
                <tr>
                    <th scope="col">Processo</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Vendedor</th>
                    <th scope="col">Consignee</th>
                    <th scope="col">Shipper</th>
                    <th scope="col">Origem</th>
                    <th scope="col">Destino</th>
                    <th scope="col">Cia Transporte</th>
                    <th scope="col">Equipamentos</th>
                    <th scope="col">Pagamento Estimado</th>
                    <th scope="col">Pagamento Efetivo</th>
                    <th scope="col">Recebimento Estimado</th>
                    <th scope="col">Recebimento Efetivo</th>
                    <th scope="col">Lucro Estimado</th>
                    <th scope="col">Lucro Efetivo</th>
                    <th scope="col">Data Abertura</th>
                </tr>
            </thead>`

        for (let i = 0; i < tableData.length; i++) {
            const item = tableData[i];
            let formattedDate = await formattedDateTime(item.Data)
            let formattedClient = await limitByCharacter(item.Cliente, 27);
            let formattedConsignee = await limitByCharacter(item.Consignee, 27);
            let formattedShipper = await limitByCharacter(item.Shipper, 27);
            let formattedCarrier = await limitByCharacter(item.Armador, 15);

            printData.push({
                reference: item.Referência,
                client: formattedClient,
                sales: item.Vendedor,
                consignee: formattedConsignee,
                shipper: formattedShipper,
                origin: item.Origem,
                destination: item.Destino,
                carrier: formattedCarrier,
                equip: item.Equipamentos,
                fullPayment: item.Total_Pagamento,
                actualPayment: item.Total_Pago,
                fullReceipt: item.Total_Recebimento,
                actualReceipt: item.Total_Recebido,
                fullProfit: item.Lucro_Estimado,
                actualProfit: item.Lucro_Efetivo,
                date: formattedDate,
            });
        }
    }

    divFullTable.innerHTML = printFullTable;

    if (type == 'Offers'){
        currentTable = $('#fullTable').DataTable({
            "data": printData,
            "columns": [
                { "data": "reference" },
                { "data": "client" },
                { "data": "sales" },
                { "data": "consignee" },
                { "data": "shipper" },
                { "data": "origin" },
                { "data": "destination" },
                { "data": "carrier" },
                { "data": "equip" },
                { "data": "type" },
                { "data": "payment" },
                { "data": "receipt" },
                { "data": "profit" },
                { "data": "date" },
            ],
            "language": {
                url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' // Tradução para o português do Brasil
            },
            "order": [[0, 'desc']],
            "lengthMenu": [[15], [15]],
            "pageLength": 15,
            "searching": true,
            "scrollX": true
        })
    } else if (type == 'Processes'){
        currentTable = $('#fullTable').DataTable({
            "data": printData,
            "columns": [
                { "data": "reference" },
                { "data": "client" },
                { "data": "sales" },
                { "data": "consignee" },
                { "data": "shipper" },
                { "data": "origin" },
                { "data": "destination" },
                { "data": "carrier" },
                { "data": "equip" },
                { "data": "fullPayment" },
                { "data": "actualPayment" },
                { "data": "fullReceipt" },
                { "data": "actualReceipt" },
                { "data": "fullProfit" },
                { "data": "actualProfit" },
                { "data": "date" },
            ],
            "language": {
                url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' // Tradução para o português do Brasil
            },
            "order": [[0, 'desc']],
            "lengthMenu": [[15], [15]],
            "pageLength": 15,
            "searching": true,
            "scrollX": true
        })
    }
}

async function formattedDateTime(time) {
    const date = new Date(time);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
}

async function limitByCharacter(text, limit) {
    if (text == null){
        text = '';
    }
    if (text.length > limit) {
        return text.substring(0, limit) + "...";
    }
    return text;
}

document.addEventListener("DOMContentLoaded", async () => {

    const {type, status} = getLinkParams();

    await createTable(type, status);

    document.querySelector('#loader2').classList.add('d-none')
})