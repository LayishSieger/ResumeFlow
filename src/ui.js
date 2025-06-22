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
    const resumeItems = document.getElementById('resume-items') || document.createElement('ul');
    const formContainer = document.getElementById('form-container');
    const resumeList = document.getElementById('resume-list');
    resumeItems.id = 'resume-items';
    resumeList.appendChild(resumeItems);

    // Initialize storage
    const { saveResume, loadResumes, deleteResume, updateResumeName } = initStorage();

    // Load and display resumes
    const displayResumes = async () => {
        try {
            const resumes = await loadResumes();
            resumeItems.innerHTML = '';
            resumes.forEach((resume) => {
                const li = document.createElement('li');
                li.className = 'py-2 border-b border-gray-200 hover:bg-gray-100 flex justify-between items-center';

                // Resume name
                const nameSpan = document.createElement('span');
                nameSpan.textContent = resume.name;
                nameSpan.className = 'cursor-pointer flex-grow';
                nameSpan.addEventListener('click', () => {
                    markdownInput.value = resume.content;
                    markdownInput.dispatchEvent(new Event('input')); // Trigger Markdown rendering
                });

                // Edit button
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
        } catch (error) {
            console.error('Error loading resumes:', error);
        }
    };

    // Toggle left sidebar and show resume list
    resumeListBtn.addEventListener('click', () => {
        leftSidebar.classList.remove('hidden');
        rightSidebar.classList.add('hidden');
        displayResumes();
    });

    // Toggle left sidebar and show form
    addResumeBtn.addEventListener('click', () => {
        leftSidebar.classList.remove('hidden');
        rightSidebar.classList.add('hidden');
        formContainer.classList.remove('hidden');
        resumeList.classList.add('hidden');
    });

    // Toggle right sidebar
    analysisBtn.addEventListener('click', () => {
        rightSidebar.classList.toggle('hidden');
        leftSidebar.classList.add('hidden');
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

    // File upload
    resumeFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
            const reader = new FileReader();
            reader.onload = (event) => {
                markdownInput.value = event.target.result;
                markdownInput.dispatchEvent(new Event('input')); // Trigger Markdown rendering
            };
            reader.onerror = () => {
                console.error('Error reading file:', reader.error);
                alert('Failed to read the file. Please try again.');
            };
            reader.readAsText(file);
        } else {
            alert('Please select a .md or .txt file.');
            resumeFileInput.value = ''; // Clear invalid input
        }
    });

    // Form submission
    addResumeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const resumeContent = markdownInput.value.trim();
        if (resumeContent) {
            try {
                await saveResume(resumeContent);
                console.log('Resume saved:', resumeContent);
                markdownInput.value = '';
                markdownInput.dispatchEvent(new Event('input')); // Update preview
                // Show resume list after saving
                displayResumes();
            } catch (error) {
                console.error('Error saving resume:', error);
            }
        } else {
            console.log('No resume content to save');
        }
    });

    // Initial load of resumes
    displayResumes();
}