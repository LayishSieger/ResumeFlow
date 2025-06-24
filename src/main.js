import { initUI } from './modules/ui.js';
import { initMarkdown } from './modules/markdown.js';
import { initStorage } from './modules/storage.js';
import { initFileHandler } from './modules/FileHandler.js';
import { initTailor } from './modules/tailor.js';
import { initAnalysis } from './modules/analysis.js';
import { populateResumeList } from './modules/ui.js';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing modules...');
  initUI();
  initMarkdown();
  const storage = initStorage();
  initFileHandler();
  const { tailorResume } = initTailor();
  initAnalysis();

  const addResumeForm = document.getElementById('add-resume-form');
  const tailorResumeForm = document.getElementById('tailor-resume-form');
  const resumeTextarea = document.getElementById('resume-textarea');
  const resumeListBtn = document.getElementById('resume-list-btn');

  const showError = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 p-2 mb-2 bg-red-100 rounded-md';
    errorDiv.textContent = message;
    const formContainer = document.getElementById('form-container');
    if (formContainer) {
      formContainer.prepend(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const selectResume = async (id) => {
    try {
      console.log(`Selecting resume with ID: ${id}`);
      // Ensure database is refreshed before populating list
      const resumes = await storage.getAllResumes();
      console.log(`Fetched ${resumes.length} resumes from IndexedDB`, resumes);
      // Update resume list and highlight the new resume
      const populateResumeListFn = populateResumeList();
      if (populateResumeListFn) {
        await populateResumeListFn(id);
        console.log(`populateResumeList called with ID: ${id}`);
      } else {
        console.warn('populateResumeList not available');
      }
      // Dispatch resumeSelected event
      document.dispatchEvent(new CustomEvent('resumeSelected', { detail: { id } }));
      console.log(`Dispatched resumeSelected event for ID: ${id}`);
      // Fallback: Manually select the resume in the list
      const resumeList = document.getElementById('resume-list');
      if (resumeList) {
        resumeList.querySelectorAll('li').forEach(item => item.classList.remove('selected', 'bg-blue-100'));
        const newItem = resumeList.querySelector(`li[data-id="${id}"]`);
        if (newItem) {
          newItem.classList.add('selected', 'bg-blue-100');
          console.log(`Manually selected resume with ID: ${id} in the list`);
        } else {
          console.warn(`Resume with ID: ${id} not found in the list`);
        }
      }
      // Switch to view mode
      if (resumeListBtn) {
        resumeListBtn.click();
        console.log('Switched to view mode via resumeListBtn click');
      }
    } catch (error) {
      console.error('Error selecting resume:', error);
      showError('Failed to select resume');
    }
  };

  if (addResumeForm) {
    addResumeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resumeText = resumeTextarea.value;
      if (!resumeText) {
        showError('Please provide resume content');
        return;
      }
      try {
        const resumeData = {
          resume: resumeText,
          isTailored: false,
          companyName: 'Unnamed Company',
          position: 'Unnamed Position',
        };
        console.log('Saving new resume to IndexedDB', resumeData);
        const newId = await storage.saveResume(resumeData);
        console.log(`Saved resume with ID: ${newId}`);
        await selectResume(newId);
      } catch (error) {
        console.error('Error saving resume:', error);
        showError('Error saving resume: ' + error.message);
      }
    });
  }

  if (tailorResumeForm) {
    tailorResumeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resumeContent = resumeTextarea.value;
      const jobDescription = document.getElementById('job-description').value;
      if (!resumeContent || !jobDescription) {
        showError('Please provide both resume and job description');
        return;
      }
      if (resumeContent.length + jobDescription.length > 10000) {
        showError('Resume and job description are too large. Reduce content to under 10,000 characters.');
        return;
      }
      try {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50';
        loadingOverlay.innerHTML = '<div class="text-white text-lg">Tailoring resume...</div>';
        document.body.appendChild(loadingOverlay);

        const provider = document.getElementById('provider-select')?.value || 'openrouter';
        const model = document.getElementById('model-select')?.value || 'meta-llama/llama-3.1-8b-instruct:free';

        console.log('Tailoring resume with job description', { provider, model });
        const tailoredData = await tailorResume(resumeContent, jobDescription, provider, model);
        console.log('Tailored response:', tailoredData);
        const resumeData = {
          resume: resumeContent,
          jobDescription,
          tailoredResponse: tailoredData,
          isTailored: true,
          companyName: tailoredData.jobDetails?.company || 'Unknown',
          position: tailoredData.jobDetails?.role || 'Tailored Resume',
          provider,
          model,
        };
        console.log('Saving tailored resume to IndexedDB', resumeData);
        const newId = await storage.saveResume(resumeData);
        console.log(`Saved tailored resume with ID: ${newId}`);
        await selectResume(newId);
        document.body.removeChild(loadingOverlay);
      } catch (error) {
        console.error('Error tailoring resume:', error);
        showError(`Error tailoring resume: ${error.message}`);
        if (document.querySelector('.fixed.inset-0')) {
          document.body.removeChild(document.querySelector('.fixed.inset-0'));
        }
      }
    });
  }
});