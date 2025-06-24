export function initFileHandler() {
    console.log('File handler module initialized');

    const fileInput = document.getElementById('resume-file');
    const uploadBtn = document.getElementById('upload-btn');
    const textarea = document.getElementById('resume-textarea');

    if (!fileInput || !uploadBtn || !textarea) {
        console.error('File handler init failed: Required elements not found.');
        return;
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

        if (ext === '.md' || ext === '.txt') {
            handleTextFileUpload(file, textarea);
        } else {
            alert('Only .md and .txt files are supported for now.');
        }

        fileInput.value = ''; // reset to allow re-uploading the same file
    });
}

export function handleTextFileUpload(file, textarea) {
    const reader = new FileReader();

    reader.onload = function (event) {
        textarea.value = event.target.result;
        textarea.dispatchEvent(new Event('input')); // trigger markdown preview update
    };

    reader.onerror = function () {
        console.error('Error reading file:', reader.error);
    };

    reader.readAsText(file);
}