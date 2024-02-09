// table_despesasADM

 // file export datatable
 $('#table_despesasADM').DataTable({
    dom: 'Bfrtip',
    buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
    ],
    language: {
        searchPlaceholder: 'Pesquisar...',
        sSearch: '',
    },
});