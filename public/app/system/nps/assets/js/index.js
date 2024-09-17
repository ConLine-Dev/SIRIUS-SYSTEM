const table = [];
// table['table_control_password'].ajax.reload(null, false)

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {

    await renderGradeAverage()
    document.querySelector('#loader2').classList.add('d-none')

})

// Verifica informações no localStorage do usuario logado
// Esta função recupera e retorna os dados armazenados localmente relacionados ao login do Google.
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}



// Função que envia para a proxima janela o id da senha clicada
async function openPassword(id) {
    const body = {
        url: `/app/administration/control-password/view?id=${id}`,
        width: 500,
        height: 420,
        resizable: false,
        alwaysOnTop: true
    }
    window.ipcRenderer.invoke('open-exWindow', body);
 };

 async function renderGradeAverage(){
    const {npsResult, clientesAtivos} = await makeRequest(`/api/nps/dashboard`);
    const resultNotes = await calculateAverages(npsResult)
    const countDistinct = await countDistinctClientsByIdEmpresa(npsResult)
    const feedbackCount = npsResult.filter(item => item.feedback && item.feedback.trim() !== "").length;

    document.querySelector('.noteComercial').textContent = resultNotes.comercial
    document.querySelector('.noteFinancial').textContent = resultNotes.financeiro
    document.querySelector('.noteOperational').textContent = resultNotes.operacional
    document.querySelector('.noteGeral').textContent = resultNotes.geralMedia

    document.querySelector('.recebidasCount').textContent = (npsResult.length).toString().padStart(4, '0')
    document.querySelector('.ativosCount').textContent = (clientesAtivos).toString().padStart(4, '0')
    document.querySelector('.feedbackCount').textContent = (feedbackCount).toString().padStart(4, '0')
    document.querySelector('.respondentesCount').textContent = (countDistinct).toString().padStart(4, '0')

    await renderChartResume(npsResult)
 }


 async function countDistinctClientsByIdEmpresa(npsResult) {
    // Usa um Set para armazenar IDs de empresas únicos
    const uniqueIdEmpresas = new Set();

    // Itera sobre o array npsResult
    for (let i = 0; i < npsResult.length; i++) {
        // Adiciona o idempresa ao Set, o que garante que apenas valores únicos serão armazenados
        uniqueIdEmpresas.add(npsResult[i].idempresa);
    }

    // O tamanho do Set representa o número de empresas distintas
    return uniqueIdEmpresas.size;
 }

 async function calculateAverages(npsResult) {
    // Variáveis para somar as notas de cada categoria
    let totalP1 = 0, totalP2 = 0, totalP3 = 0, totalSatisfaction = 0;
    const totalRespostas = npsResult.length;

    // Itera sobre o array npsResult para somar as notas
    for (let i = 0; i < totalRespostas; i++) {
        totalP1 += npsResult[i].p1 || 0; // Soma p1
        totalP2 += npsResult[i].p2 || 0; // Soma p2
        totalP3 += npsResult[i].p3 || 0; // Soma p3
    }

    // Calcula a média de cada categoria
    const p1Media = totalP1 / totalRespostas;
    const p2Media = totalP2 / totalRespostas;
    const p3Media = totalP3 / totalRespostas;
    const geralMedia = (p1Media+p2Media+p3Media) / 3;

    // Retorna as médias
    return {
        comercial: p1Media.toFixed(2),
        operacional: p2Media.toFixed(2),
        financeiro: p3Media.toFixed(2),
        geralMedia: geralMedia.toFixed(2)
    };
 }

 async function renderChartResume(npsResult) {
    // Função para contar as respostas por mês
    function countResponsesByMonth(data) {
        const monthlyCounts = {};

        // Contar respostas por mês
        data.forEach(item => {
            const date = new Date(item.date);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // formato "YYYY-MM"

            if (!monthlyCounts[yearMonth]) {
                monthlyCounts[yearMonth] = 0;
            }

            monthlyCounts[yearMonth]++;
        });

        // Obter o menor e maior data no intervalo
        const startDate = new Date(Math.min(...data.map(item => new Date(item.date))));
        const endDate = new Date(Math.max(...data.map(item => new Date(item.date))));
        
        // Ajustar a data de término para o último dia do mês
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        // Inicializar o array de meses e a contagem de meses
        const months = [];
        const monthCounts = {};

        // Iterar pelos meses desde a data inicial até a data final
        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
            const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push(yearMonth);
            monthCounts[yearMonth] = monthlyCounts[yearMonth] || 0;
        }

        // Converter o formato de "YYYY-MM" para "MMM-YYYY"
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return months.map(month => {
            const [year, monthNum] = month.split('-');
            const monthName = monthNames[parseInt(monthNum, 10) - 1];
            return {
                month: `${monthName}-${year}`,
                count: monthCounts[month]
            };
        });
    }

    const responseCounts = countResponsesByMonth(npsResult);

    // Extraindo informações para o gráfico
    const months = responseCounts.map(data => data.month);
    const counts = responseCounts.map(data => data.count);

    var options1 = {
        series: [{
            name: 'Respostas',
            data: counts
        }],
        chart: {
            type: 'bar',
            height: 200
        },
        grid: {
            borderColor: '#f2f6f7',
        },
        colors: ["rgba(132, 90, 223, 0.3)"],
        plotOptions: {
            bar: {
                columnWidth: '20%',
                distributed: true,
                borderRadius: 7,
            }
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        yaxis: {
            title: {
                style: {
                    color: '#adb5be',
                    fontSize: '12px',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    cssClass: 'apexcharts-yaxis-label',
                },
            },
            labels: {
                formatter: function (y) {
                    return y.toFixed(0) + "";
                }
            }
        },
        xaxis: {
            categories: months,
            axisBorder: {
                show: true,
                color: 'rgba(119, 119, 142, 0.05)',
                offsetX: 0,
                offsetY: 0,
            },
            axisTicks: {
                show: true,
                borderType: 'solid',
                color: 'rgba(119, 119, 142, 0.05)',
                width: 6,
                offsetX: 0,
                offsetY: 0
            },
            labels: {
                rotate: -90
            }
        }
    };

    document.getElementById('earnings').innerHTML = '';
    var chart1 = new ApexCharts(document.querySelector("#earnings"), options1);
    chart1.render();
}







