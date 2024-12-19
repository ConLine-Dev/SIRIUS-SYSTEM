/**
 * Inicializa os componentes do editor de texto Quill e FilePond.
 */
async function initializeComponents() {
    // Configuração do editor Quill
    const toolbarOptions = [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'align': [] }],
        ['image'],
        ['clean']                                         // remove formatting button
    ];

    quillEditor = new Quill('#project-descriptioin-editor', {
        modules: { toolbar: toolbarOptions },
        theme: 'snow'
    });

    // Configuração do FilePond
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

    const inputElement = document.querySelector('.multiple-filepond-Attachments');
    if (inputElement) {
        fileAttachments = FilePond.create(inputElement, {
            allowMultiple: true,
            maxFiles: 5,
            labelIdle: 'Arraste e solte seus arquivos aqui ou <span class="filepond--label-action">Procure</span>'
        });

        fileAttachments.on('addfile', (error, file) => {
            if (error) {
                console.error('Erro ao adicionar arquivo:', error);
            } else {
                // console.log('Arquivo adicionado:', file.filename);
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    await initializeComponents();

})