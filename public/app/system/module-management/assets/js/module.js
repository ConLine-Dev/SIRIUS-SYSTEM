const table = []
document.addEventListener("DOMContentLoaded", async () => {

    await generateTable();
    await loadCategories()
    document.querySelector('#loader2').classList.add('d-none')
})


async function generateTable() {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#modulesTable')) {
        $('#modulesTable').DataTable().destroy();
    }

        // Criar a nova tabela com os dados da API
        table['modulesTable'] = $('#modulesTable').DataTable({
            dom: 'Bfrtip', // This will show the button panel
            buttons: [
                {
                    text: 'Novo',
                    action: function (e, dt, node, config) {
                        // Abrir modal para cadastrar novo módulo
                        openCreateModal();
                    }
                }
            ],
            scrollY: '75vh', // Define the height of the scrollable area
            scrollCollapse: true, // Allow the table to reduce in height when fewer rows are shown
            paging: false, // Disable pagination
            order: [[0, 'desc']],
            ajax: {
                url: '/api/module-management/getAll',
                dataSrc: ''
            },
            columns: [
                {
                    data: 'icon',
                    render: function (data, type, row) {
                    const updatedImgTag = data.replace('../assets/', '../../assets/');
                      return `<span class="avatar avatar-sm"> ${updatedImgTag} </span>`
                    }
                },
                { data: 'title' },
                { data: 'description' },
                { data: 'path' },
                { data: 'category_name' }
            ],
            language: {
                searchPlaceholder: 'Pesquisar...',
                sSearch: '',
            },
        });


    // Ao dar dois cliques em uma linha da tabela
    $('#modulesTable tbody').on('dblclick', 'tr', function() {
        const data = table['modulesTable'].row(this).data();
        openEditModal(data);
    });

   
}




// Função para abrir modal de criação
function openCreateModal() {
    $('#moduleModalLabel').text('Cadastrar Módulo');
    $('#moduleForm')[0].reset();
    $('#moduleId').val('');
    $('#moduleModal').modal('show');
    $('.btn-remover').css('display', 'none')
    
}

// Função para abrir modal de edição
function openEditModal(data) {
    console.log(data)
    $('#moduleModalLabel').text('Editar Módulo');
    $('#moduleId').val(data.id);
    $('#moduleTitle').val(data.title);
    $('#moduleDescription').val(data.description);
    $('#modulePath').val(data.path);
    $('#moduleCategory').val(data.category_id);
    $('#moduleIcon').val(data.icon);
    $('#moduleHeight').val(data.height);
    $('#moduleWidth').val(data.width);
    $('#moduleResizable').prop('checked', data.resizable);
    $('#moduleFixed').prop('checked', data.fixed);
    $('#moduleSearchable').prop('checked', data.searchable);
    $('#moduleModal').modal('show');
    $('.btn-remover').css('display', 'block')
}

$('.btn-remover').on('click', function(event) {
    const moduleId = $('#moduleId').val();
    // remove módulo
    $.ajax({
        url: `/api/module-management/deleteModule/${moduleId}`,
        type: 'DELETE',
        contentType: 'application/json',
        success: function(response) {
            $('#moduleModal').modal('hide');
            table['modulesTable'].ajax.reload();
            console.log('deu certo')
        },
        error: function(xhr) {
            alert('Erro ao remover módulo');
        }
    });
})

// Submeter formulário para criar ou editar módulo
$('#moduleForm').on('submit', function(event) {
    event.preventDefault();
    const moduleData = {
        title: $('#moduleTitle').val(),
        description: $('#moduleDescription').val(),
        path: $('#modulePath').val(),
        categoryId: $('#moduleCategory').val(),
        icon: $('#moduleIcon').val(),
        height: $('#moduleHeight').val(),
        width: $('#moduleWidth').val(),
        resizable: $('#moduleResizable').is(':checked') ? 1 : 0,
        fixed: $('#moduleFixed').is(':checked') ? 1 : 0,
        searchable: $('#moduleSearchable').is(':checked') ? 1 : 0
    };

    const moduleId = $('#moduleId').val();
    if (moduleId) {
        // Editar módulo
        $.ajax({
            url: `/api/module-management/updateModule/${moduleId}`,
            type: 'PUT',
            data: JSON.stringify(moduleData),
            contentType: 'application/json',
            success: function(response) {
                $('#moduleModal').modal('hide');
                table['modulesTable'].ajax.reload();
                console.log('deu certo')
            },
            error: function(xhr) {
                alert('Erro ao editar módulo');
            }
        });
    } else {
        // Criar novo módulo
        $.ajax({
            url: '/api/module-management/createModule',
            type: 'POST',
            data: JSON.stringify(moduleData),
            contentType: 'application/json',
            success: function(response) {
                $('#moduleModal').modal('hide');
                table['modulesTable'].ajax.reload();
            },
            error: function(xhr) {
                alert('Erro ao criar módulo');
            }
        });
    }
});

// Carregar categorias no select do modal
async function loadCategories() {
    $.ajax({
        url: '/api/module-management/getAllCategories',
        type: 'GET',
        success: function(response) {
            $('#moduleCategory').empty();
            response.forEach(function(category) {
                $('#moduleCategory').append(`<option value="${category.id}">${category.name}</option>`);
            });
        },
        error: function(xhr) {
            alert('Erro ao carregar categorias');
        }
    });
}



// $(document).ready(function() {
//     const table = $('#modulesTable').DataTable({
//         ajax: {
//             url: '/api/module-management/getAll',
//             dataSrc: ''
//         },
//         columns: [
//             { data: 'id' },
//             { data: 'title' },
//             { data: 'description' },
//             { data: 'path' },
//             { data: 'category_name' }
//         ]
//     });

//     // Ao dar dois cliques em uma linha da tabela
//     $('#modulesTable tbody').on('dblclick', 'tr', function() {
//         const data = table.row(this).data();
//         openEditModal(data);
//     });

//     // Abrir modal para cadastrar novo módulo
//     $('#newModuleBtn').on('click', function() {
//         openCreateModal();
//     });

//     // Função para abrir modal de criação
//     function openCreateModal() {
//         $('#moduleModalLabel').text('Cadastrar Módulo');
//         $('#moduleForm')[0].reset();
//         $('#moduleId').val('');
//         $('#moduleModal').modal('show');
//     }

//     // Função para abrir modal de edição
//     function openEditModal(data) {
//         console.log(data)
//         $('#moduleModalLabel').text('Editar Módulo');
//         $('#moduleId').val(data.id);
//         $('#moduleTitle').val(data.title);
//         $('#moduleDescription').val(data.description);
//         $('#modulePath').val(data.path);
//         $('#moduleCategory').val(data.category_id);
//         $('#moduleIcon').val(data.icon);
//         $('#moduleHeight').val(data.height);
//         $('#moduleWidth').val(data.width);
//         $('#moduleResizable').prop('checked', data.resizable);
//         $('#moduleFixed').prop('checked', data.fixed);
//         $('#moduleSearchable').prop('checked', data.searchable);
//         $('#moduleModal').modal('show');
//     }

//     // Submeter formulário para criar ou editar módulo
//     $('#moduleForm').on('submit', function(event) {
//         event.preventDefault();
//         const moduleData = {
//             title: $('#moduleTitle').val(),
//             description: $('#moduleDescription').val(),
//             path: $('#modulePath').val(),
//             categoryId: $('#moduleCategory').val(),
//             icon: $('#moduleIcon').val(),
//             height: $('#moduleHeight').val(),
//             width: $('#moduleWidth').val(),
//             resizable: $('#moduleResizable').is(':checked') ? 1 : 0,
//             fixed: $('#moduleFixed').is(':checked') ? 1 : 0,
//             searchable: $('#moduleSearchable').is(':checked') ? 1 : 0
//         };

//         const moduleId = $('#moduleId').val();
//         if (moduleId) {
//             // Editar módulo
//             $.ajax({
//                 url: `/api/module-management/updateModule/${moduleId}`,
//                 type: 'PUT',
//                 data: JSON.stringify(moduleData),
//                 contentType: 'application/json',
//                 success: function(response) {
//                     $('#moduleModal').modal('hide');
//                     table.ajax.reload();
//                 },
//                 error: function(xhr) {
//                     alert('Erro ao editar módulo');
//                 }
//             });
//         } else {
//             // Criar novo módulo
//             $.ajax({
//                 url: '/api/module-management/createModule',
//                 type: 'POST',
//                 data: JSON.stringify(moduleData),
//                 contentType: 'application/json',
//                 success: function(response) {
//                     $('#moduleModal').modal('hide');
//                     table.ajax.reload();
//                 },
//                 error: function(xhr) {
//                     alert('Erro ao criar módulo');
//                 }
//             });
//         }
//     });

//     // Carregar categorias no select do modal
//     function loadCategories() {
//         $.ajax({
//             url: '/api/module-management/getAllCategories',
//             type: 'GET',
//             success: function(response) {
//                 $('#moduleCategory').empty();
//                 response.forEach(function(category) {
//                     $('#moduleCategory').append(`<option value="${category.id}">${category.name}</option>`);
//                 });
//             },
//             error: function(xhr) {
//                 alert('Erro ao carregar categorias');
//             }
//         });
//     }

//     loadCategories();
// });
