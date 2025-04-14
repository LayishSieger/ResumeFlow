import { initStorage } from './storage.js';
import { jsPDF } from 'jspdf';

export function initUI() {
    console.log('Initializing UI');

    // Elements
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const resumeListBtn = document.getElementById('resume-list-btn');
    const addResumeBtn = document.getElementById('add-resume-btn');
    const analysisBtn = document.getElementById('analysis-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const addResumeForm = document.getElementById('add-resume-form');
    const markdownInput = document.querySelector('.textarea');
    const resumeFileInput = document.getElementById('resume-file-input');
    const saveResumeBtn = document.getElementById('save-resume-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const editResumeBtn = document.getElementById('edit-resume-btn');
    const formInstructions = document.getElementById('form-instructions');
    const resumeItems = document.getElementById('resume-items') || document.createElement('ul');
    const formContainer = document.getElementById('form-container');
    const resumeList = document.getElementById('resume-list');
    resumeItems.id = 'resume-items';
    resumeList.appendChild(resumeItems);

    // Initialize storage
    const { saveResume, loadResumes, deleteResume, updateResumeName, updateResumeContent } = initStorage();

    // State for editing
    let editingResumeId = null;
    let originalResumeContent = '';

    // Load and display resumes
    const displayResumes = async () => {
        try {
            const resumes = await loadResumes();
            resumeItems.innerHTML = '';
            resumes.forEach((resume) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center py-2 border-b border-gray-200 hover:bg-gray-100';

                // Resume name
                const nameSpan = document.createElement('span');
                nameSpan.textContent = resume.name;
                nameSpan.className = 'cursor-pointer flex-grow';
                nameSpan.dataset.resumeId = resume.id; // Store ID for edit mode
                nameSpan.addEventListener('click', () => {
                    markdownInput.value = resume.content;
                    markdownInput.dispatchEvent(new Event('input')); // Trigger Markdown rendering
                    editingResumeId = resume.id; // Set ID for preview mode
                    editResumeBtn.classList.remove('hidden');
                    leftSidebar.classList.add('hidden');
                    rightSidebar.classList.add('hidden');
                    console.log(`Previewing resume ID: ${resume.id}`);
                });

                // Edit name button
                const editBtn = document.createElement('button');
                editBtn.innerHTML = '<i class="fa-solid fa-edit"></i>';
                editBtn.className = 'edit-btn text-blue-500 hover:text-blue-700 mr-2';
                editBtn.addEventListener('click', async () => {
                    const newName = prompt(`Enter new name for "${resume.name}":`, resume.name);
                    if (newName && newName.trim()) {
                        try {
                            await updateResumeName(resume.id, newName.trim());
                            console.log(`Resume renamed to: ${newName}`);
                            displayResumes(); // Refresh list
                        } catch (error) {
                            console.error('Error renaming resume:', error);
                        }
                    }
                });

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                deleteBtn.className = 'delete-btn text-red-500 hover:text-red-700';
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to delete "${resume.name}"?`)) {
                        try {
                            await deleteResume(resume.id);
                            console.log(`Resume deleted: ${resume.name}`);
                            displayResumes(); // Refresh list
                        } catch (error) {
                            console.error('Error deleting resume:', error);
                        }
                    }
                });

                li.appendChild(nameSpan);
                li.appendChild(editBtn);
                li.appendChild(deleteBtn);
                resumeItems.appendChild(li);
            });
            // Show resume list, hide form
            resumeList.classList.remove('hidden');
            formContainer.classList.add('hidden');
            editResumeBtn.classList.add('hidden');
        } catch (error) {
            console.error('Error loading resumes:', error);
        }
    };

    // Handle file upload
    resumeFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
            const reader = new FileReader();
            reader.onload = (event) => {
                markdownInput.value = event.target.result;
                markdownInput.dispatchEvent(new Event('input')); // Trigger Markdown rendering
                console.log(`File uploaded: ${file.name}`);
                editingResumeId = null; // Reset editing mode
                saveResumeBtn.classList.remove('hidden');
                saveChangesBtn.classList.add('hidden');
                formInstructions.innerHTML = `Upload resume in <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank">Markdown format</a> (.md or .txt), load from saved resume list or write/edit/paste below:`;
            };
            reader.onerror = () => {
                console.error('Error reading file:', reader.error);
                alert('Failed to read the file. Please try again.');
            };
            reader.readAsText(file);
        } else {
            console.log('Invalid file type selected');
            alert('Please select a .md or .txt file.');
            e.target.value = ''; // Clear the input
        }
    });

    // Toggle edit mode
    editResumeBtn.addEventListener('click', () => {
        if (editingResumeId) {
            originalResumeContent = markdownInput.value.trim();
            saveResumeBtn.classList.add('hidden');
            saveChangesBtn.classList.remove('hidden');
            saveChangesBtn.disabled = true;
            leftSidebar.classList.remove('hidden');
            formContainer.classList.remove('hidden');
            resumeList.classList.add('hidden');
            formInstructions.textContent = 'Edit your resume in Markdown format below:';
            editResumeBtn.classList.add('hidden');
            console.log(`Entering edit mode for resume ID: ${editingResumeId}, original content length: ${originalResumeContent.length}`);
        } else {
            console.error('No resume ID set for edit mode');
            alert('Error: No resume selected for editing.');
        }
    });

    // Enable Save Changes button on content change
    markdownInput.addEventListener('input', () => {
        if (editingResumeId) {
            const currentContent = markdownInput.value.trim();
            const hasChanged = currentContent !== originalResumeContent;
            saveChangesBtn.disabled = !hasChanged;
            console.log(`Content changed: ${hasChanged}, Current length: ${currentContent.length}, Original length: ${originalResumeContent.length}`);
        }
    });

    // Toggle left sidebar and show resume list
    resumeListBtn.addEventListener('click', () => {
        leftSidebar.classList.remove('hidden');
        rightSidebar.classList.add('hidden');
        displayResumes();
        editingResumeId = null; // Reset editing mode
        saveResumeBtn.classList.remove('hidden');
        saveChangesBtn.classList.add('hidden');
        editResumeBtn.classList.add('hidden');
        markdownInput.value = '';
        markdownInput.dispatchEvent(new Event('input'));
        formInstructions.innerHTML = `Upload resume in <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank">Markdown format</a> (.md or .txt), load from saved resume list or write/edit/paste below:`;
    });

    // Toggle left sidebar and show form
    addResumeBtn.addEventListener('click', () => {
        leftSidebar.classList.remove('hidden');
        rightSidebar.classList.add('hidden');
        formContainer.classList.remove('hidden');
        resumeList.classList.add('hidden');
        editingResumeId = null; // Reset editing mode
        saveResumeBtn.classList.remove('hidden');
        saveChangesBtn.classList.add('hidden');
        editResumeBtn.classList.add('hidden');
        markdownInput.value = '';
        markdownInput.dispatchEvent(new Event('input'));
        formInstructions.innerHTML = `Upload resume in <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank">Markdown format</a> (.md or .txt), load from saved resume list or write/edit/paste below:`;
    });

    // Toggle right sidebar
    analysisBtn.addEventListener('click', () => {
        rightSidebar.classList.toggle('hidden');
        leftSidebar.classList.add('hidden');
        editResumeBtn.classList.add('hidden');
    });

    // Export PDF
    exportPdfBtn.addEventListener('click', () => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });
        const content = document.getElementById('resume-content');
        doc.html(content, {
            callback: (pdf) => {
                pdf.save(`resume-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`);
            },
            x: 10,
            y: 10,
            width: 190, // A4 width (210mm) - margins
            windowWidth: content.scrollWidth,
        });
    });

    // Form submission
    addResumeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const resumeContent = markdownInput.value.trim();
        if (resumeContent) {
            try {
                console.log(`Submitting form with editingResumeId: ${editingResumeId}`);
                if (editingResumeId) {
                    // Update existing resume
                    await updateResumeContent(editingResumeId, resumeContent);
                    console.log('Resume content updated:', resumeContent);
                } else {
                    // Save new resume
                    await saveResume(resumeContent);
                    console.log('Resume saved:', resumeContent);
                }
                markdownInput.value = '';
                resumeFileInput.value = ''; // Clear file input
                markdownInput.dispatchEvent(new Event('input')); // Update preview
                editingResumeId = null; // Reset editing mode
                saveResumeBtn.classList.remove('hidden');
                saveChangesBtn.classList.add('hidden');
                formInstructions.innerHTML = `Upload resume in <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank">Markdown format</a> (.md or .txt), load from saved resume list or write/edit/paste below:`;
                displayResumes();
            } catch (error) {
                console.error('Error saving/updating resume:', error);
                alert('Failed to save changes. Please try again.');
            }
        } else {
            console.log('No resume content to save');
        }
    });

    // Initial load of resumes
    displayResumes();
}