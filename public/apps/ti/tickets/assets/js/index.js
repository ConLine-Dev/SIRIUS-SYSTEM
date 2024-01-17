

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
        console.log(listusers)

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


