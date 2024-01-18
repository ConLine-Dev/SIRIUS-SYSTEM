

    document.addEventListener("DOMContentLoaded", async () => {
     await main()
    })


    async function main(){
        dragula([document.querySelector('#new-tasks-draggable'), document.querySelector('#todo-tasks-draggable'), document.querySelector('#inprogress-tasks-draggable'), document.querySelector('#inreview-tasks-draggable'), document.querySelector('#completed-tasks-draggable')]);

    // /* multi select with remove button */
    // const multipleCancelButton = new Choices(
    //     '#choices-multiple-remove-button1',
    //     {
    //         allowHTML: true,
    //         removeItemButton: true,
    //     }
    // );
    // const multipleCancelButton1 = new Choices(
    //     '#choices-multiple-remove-button2',
    //     {
    //         allowHTML: true,
    //         removeItemButton: true,
    //     }
    // );

    /* TargetDate Picker */
    flatpickr("#targetDate", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
    });

     /* filepond */
     FilePond.registerPlugin(
        FilePondPluginImagePreview,
        FilePondPluginImageExifOrientation,
        FilePondPluginFileValidateSize,
        FilePondPluginFileEncode,
        FilePondPluginImageEdit,
        FilePondPluginFileValidateType,
        FilePondPluginImageCrop,
        FilePondPluginImageResize,
        FilePondPluginImageTransform
    );

    /* multiple upload */
    const MultipleElement = document.querySelector('.multiple-filepond');
    FilePond.create(MultipleElement,);


        await listAllUsersTI()

    }


    async function listAllUsersTI(){
        const listusers = await makeRequest('/api/users/ListUserByDep/7')

        const DivSelected = document.querySelector('.listusers');
        DivSelected.innerHTML = '';

        listusers.forEach(element => {
            DivSelected.innerHTML += `
            <span class="avatar avatar-rounded">
                <img src="${element.image}" alt="img">
            </span>`
        });
        
        DivSelected.innerHTML += `<a class="avatar bg-primary avatar-rounded text-fixed-white" href="javascript:void(0);"> Todos </a></div>`
       
      
    }


    async function createTicket(init,title, description){
    const card = `<div class="card custom-card">
        <div class="card-body p-0">
            <div class="p-3 kanban-board-head">
                <div
                    class="d-flex text-muted justify-content-between mb-1 fs-12 fw-semibold">
                    <div>
                    <i class="ri-time-line me-1 align-middle d-inline-block"></i>
                    ${init}
                    </div>
                    <div>faltam 2 dias</div>
                </div>
                <div
                    class="d-flex align-items-center justify-content-between">
                    <div class="task-badges">
                          
                    </div>
                    <div class="dropdown">
                        <a aria-label="anchor"
                            href="javascript:void(0);"
                            class="btn btn-icon btn-sm btn-light"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"><i
                                class="fe fe-more-vertical"></i></a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item"
                                    href="javascript:void(0);"><i
                                        class="ri-eye-line me-1 align-middle d-inline-block"></i>View</a>
                            </li>
                            <li><a class="dropdown-item"
                                    href="javascript:void(0);"><i
                                        class="ri-delete-bin-line me-1 align-middle d-inline-block"></i>Delete</a>
                            </li>
                            <li><a class="dropdown-item"
                                    href="javascript:void(0);"><i
                                        class="ri-edit-line me-1 align-middle d-inline-block"></i>Edit</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="kanban-content mt-2">
                    <h6 class="fw-semibold mb-1 fs-15">${title}</h6>
                    <div class="kanban-task-description">${description}.</div>
                </div>
            </div>
            <div class="p-3 border-top border-block-start-dashed">
                <div
                    class="d-flex align-items-center justify-content-between">
                    <div>
                   
                    <a href="javascript:void(0);" class="text-muted">
                    <span class="me-1">
                    <i class="ri-message-2-line align-middle fw-normal"></i>
                    </span>
                        <span class="fw-semibold fs-12">02</span>
                    </a>
                    </div>
                    <div class="avatar-list-stacked"><span
                            class="avatar avatar-sm avatar-rounded"><img
                                src="../../assets/images/faces/11.jpg"
                                alt="img"></span><span
                            class="avatar avatar-sm avatar-rounded"><img
                                src="../../assets/images/faces/12.jpg"
                                alt="img"></span><span
                            class="avatar avatar-sm avatar-rounded"><img
                                src="../../assets/images/faces/7.jpg"
                                alt="img"></span><span
                            class="avatar avatar-sm avatar-rounded"><img
                                src="../../assets/images/faces/8.jpg"
                                alt="img"></span></div>
                </div>
            </div>
        </div>
                  </div>`


    document.querySelector('#new-tasks-draggable').innerHTML += card
    }

    createTicket('Início - 18/01/2024 ás 17:30', 'titulo', 'descrição')


