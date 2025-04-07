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
    const resumeItems = document.getElementById('resume-items') || document.createElement('ul');
    const formContainer = document.getElementById('form-container');
    const resumeList = document.getElementById('resume-list');
    resumeItems.id = 'resume-items';
    resumeList.appendChild(resumeItems);

    // Initialize storage
    const { saveResume, loadResumes } = initStorage();

    // Load and display resumes
    const displayResumes = async () => {
        try {
            const resumes = await loadResumes();
            resumeItems.innerHTML = '';
            resumes.forEach((resume) => {
                const li = document.createElement('li');
                li.textContent = resume.name;
                li.className = 'py-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer';
                li.addEventListener('click', () => {
                    markdownInput.value = resume.content;
                    markdownInput.dispatchEvent(new Event('input')); // Trigger Markdown rendering
                });
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