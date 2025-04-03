import { initStorage } from './storage.js';

export function initUI() {
    console.log('Initializing UI');

    // Elements
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const resumeListBtn = document.getElementById('resume-list-btn');
    const analysisBtn = document.getElementById('analysis-btn');
    const addResumeForm = document.getElementById('add-resume-form');
    const markdownInput = document.querySelector('.textarea');
    const resumeItems = document.getElementById('resume-items') || document.createElement('ul');
    resumeItems.id = 'resume-items';
    document.getElementById('resume-list').appendChild(resumeItems);

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
        } catch (error) {
            console.error('Error loading resumes:', error);
        }
    };

    // Toggle left sidebar
    resumeListBtn.addEventListener('click', () => {
        leftSidebar.classList.toggle('hidden');
        rightSidebar.classList.add('hidden');
        displayResumes(); // Refresh resume list
    });

    // Toggle right sidebar
    analysisBtn.addEventListener('click', () => {
        rightSidebar.classList.toggle('hidden');
        leftSidebar.classList.add('hidden');
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
                displayResumes(); // Refresh resume list
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