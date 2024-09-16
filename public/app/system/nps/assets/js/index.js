const table = [];
// table['table_control_password'].ajax.reload(null, false)

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {

    await renderChartResume()
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


 async function renderChartResume(){
    var options1 = {
        series: [{
            name: 'Total Orders',
            data: [44, 42, 57, 86, 112, 55, 70, 43, 23, 54, 77, 34],
        }],
        chart: {
            type: 'bar',
            height: 200
        },
        grid: {
            borderColor: '#f2f6f7',
        },
        colors: ["rgba(132, 90, 223, 0.3)", "rgba(132, 90, 223, 0.3)", "rgba(132, 90, 223, 0.3)", "rgba(132, 90, 223, 0.3)", "rgb(132, 90, 223)", "rgba(132, 90, 223, 0.3)", "#e4e7ed", "#e4e7ed", "#e4e7ed", "#e4e7ed", "#e4e7ed", "#e4e7ed"],
        plotOptions: {
            bar: {
                columnWidth: '25%',
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
            type: 'month',
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'sep', 'oct', 'nov', 'dec'],
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
    
    // function Earnings() {
    //     chart1.updateOptions({
    //         colors: ["rgba(" + myVarVal + ", 0.3)", "rgba(" + myVarVal + ", 0.3)", "rgba(" + myVarVal + ", 0.3)", "rgba(" + myVarVal + ", 0.3)", "rgb(" + myVarVal + ")", "rgba(" + myVarVal + ", 0.3)", "#e4e7ed", "#e4e7ed", "#e4e7ed", "#e4e7ed", "#e4e7ed", "#e4e7ed"],
    //     })
    // }
 }

