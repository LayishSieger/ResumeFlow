export function initUI() {
    console.log('Initializing UI');

    // Elements
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const resumeListBtn = document.getElementById('resume-list-btn');
    const analysisBtn = document.getElementById('analysis-btn');
    const addResumeForm = document.getElementById('add-resume-form');
    const markdownInput = document.querySelector('.textarea');

    // Toggle left sidebar
    resumeListBtn.addEventListener('click', () => {
        leftSidebar.classList.toggle('hidden');
        rightSidebar.classList.add('hidden'); // Ensure right sidebar is hidden
    });

    // Toggle right sidebar
    analysisBtn.addEventListener('click', () => {
        rightSidebar.classList.toggle('hidden');
        leftSidebar.classList.add('hidden'); // Ensure left sidebar is hidden
    });

    // Form submission
    addResumeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const resumeContent = markdownInput.value.trim();
        if (resumeContent) {
            console.log('Resume saved:', resumeContent);
            markdownInput.value = ''; // Clear textarea
        } else {
            console.log('No resume content to save');
        }
    });
}