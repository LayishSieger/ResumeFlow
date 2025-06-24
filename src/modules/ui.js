import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import { splitIntoPages } from './pagination.js';
import { renderWelcomeModal } from '../components/WelcomeModal.js';
import { renderUserDetailsModal } from '../components/UserDetailsModal.js'; // Add import
import { initStorage } from './storage.js';
import { initTailor } from './tailor.js';

// Export populateResumeList
export function populateResumeList(highlightId = null) {
    let isUpdatingList = false;
    return async function (highlightId = null) {
        if (isUpdatingList) return; // Prevent recursive calls
        isUpdatingList = true;
        try {
            const resumeList = document.getElementById('resume-list');
            const storage = initStorage();
            if (!resumeList) {
                console.error('Resume list container not found');
                return;
            }

            const resumes = await storage.getAllResumes();
            resumeList.innerHTML = `
                <div id="saved-resumes-container">
                    <h3 class="font-semibold mb-2">Saved Resumes</h3>
                    <ul id="saved-resumes" class="space-y-1 text-sm"></ul>
                </div>
                <div id="tailored-resumes-container">
                    <h3 class="font-semibold mb-2 mt-4">Tailored Resumes</h3>
                    <ul id="tailored-resumes" class="space-y-1 text-sm"></ul>
                </div>
            `;

            const savedResumesUl = resumeList.querySelector('#saved-resumes');
            const tailoredResumesUl = resumeList.querySelector('#tailored-resumes');

            if (!savedResumesUl || !tailoredResumesUl) {
                console.error('Resume list ULs not found');
                return;
            }

            // Separate resumes by isTailored
            const savedResumes = resumes.filter(resume => !resume.isTailored);
            const tailoredResumes = resumes.filter(resume => resume.isTailored);

            // Determine highlightId if not provided
            if (!highlightId && resumes.length > 0) {
                highlightId = resumes[0].id;
            }

            // Populate Saved Resumes
            savedResumes.forEach(resume => {
                const li = document.createElement('li');
                li.className = `resume-item ${resume.id === highlightId ? 'selected' : ''}`;
                li.dataset.id = resume.id;
                const titleText = resume.companyName || 'Untitled Resume';
                li.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="editable-title" title="${titleText}">${titleText}</span>
                        <div class="flex items-center gap-2">
                            <button class="edit-btn" data-id="${resume.id}">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete-btn" data-id="${resume.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                savedResumesUl.appendChild(li);
            });

            // Populate Tailored Resumes
            tailoredResumes.forEach(resume => {
                const li = document.createElement('li');
                li.className = `resume-item ${resume.id === highlightId ? 'selected' : ''}`;
                li.dataset.id = resume.id;
                const titleText = resume.companyName || 'Untitled Resume';
                li.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="editable-title" title="${titleText}">${titleText}</span>
                        <div class="flex items-center gap-2">
                            <button class="edit-btn" data-id="${resume.id}">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete-btn" data-id="${resume.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                tailoredResumesUl.appendChild(li);
            });

            // Hide sections if empty
            savedResumesUl.classList.toggle('hidden', savedResumes.length === 0);
            tailoredResumesUl.classList.toggle('hidden', tailoredResumes.length === 0);
            resumeList.querySelector('#saved-resumes-container').classList.toggle('hidden', savedResumes.length === 0);
            resumeList.querySelector('#tailored-resumes-container').classList.toggle('hidden', tailoredResumes.length === 0);

            // Update selectedResume if highlightId is provided
            if (highlightId) {
                const selectedResume = await storage.getResumeById(highlightId);
                document.dispatchEvent(
                    new CustomEvent('resumeSelected', { detail: { id: highlightId } })
                );
            }
        } catch (error) {
            console.error('Error in populateResumeList:', error);
            const formContainer = document.getElementById('form-container');
            const showError = (message) => {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-red-500 p-2 mb-2 bg-red-100 rounded-md';
                errorDiv.textContent = message;
                formContainer.prepend(errorDiv);
                setTimeout(() => errorDiv.remove(), 3000);
            };
            showError('Failed to load resumes: ' + error.message);
        } finally {
            isUpdatingList = false;
        }
    };
}

export function initUI() {
    console.log('Initializing UI module...');
    const storage = initStorage();
    const tailor = initTailor();
    const title = document.getElementById('title');
    // Top buttons
    const resumeListBtn = document.getElementById('resume-list-btn');
    const addResumeBtn = document.getElementById('add-resume-btn');
    const analysisBtn = document.getElementById('analysis-btn');
    const previewBtn = document.getElementById('preview-btn');
    // Left sidebar
    const leftSidebar = document.getElementById('left-sidebar');
    const resumeList = document.getElementById('resume-list');
    // Forms
    const formContainer = document.getElementById('form-container');
    const addResumeForm = document.getElementById('add-resume-form');
    const tailorResumeForm = document.getElementById('tailor-resume-form');
    const resumeTextarea = document.getElementById('resume-textarea');
    const resumeUploadTextarea = document.getElementById('resume-upload-textarea');
    const jobDescription = document.getElementById('job-description');
    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContainer = document.querySelector('.tab-container');
    const tabBackground = document.querySelector('.tab-background');
    // Tab switching logic
    const tabAdd = document.querySelector('[data-tab="add-resume"]');
    const tabTailor = document.querySelector('[data-tab="tailor-resume"]');
    const submitBtn = document.getElementById('submit-btn');
    // Center content
    const centerContent = document.getElementById('center-content');
    const resumePreview = document.getElementById('resume-preview');
    const resumeContent = document.getElementById('resume-content');
    const topBar = document.getElementById('top-bar');
    // Right sidebar
    const rightSidebar = document.getElementById('right-sidebar');
    const analysisContent = document.getElementById('analysis-content');
    // Buttons
    const printBtn = document.getElementById('print-btn');
    const downloadBtn = document.getElementById('download-btn');
    // Menu buttons
    const moreOptionsBtn = document.getElementById('menu-btn');
    const moreOptionsMenu = document.getElementById('preview-menu');
    const pageViewBtn = document.getElementById('page-view-btn');
    const viewOriginalBtn = document.getElementById('view-original-btn');
    // load resume
    const loadResumeBtn = document.getElementById('load-resume-btn');
    const loadResumeMenu = document.getElementById('load-resume-menu');

    let mode = 'view';
    let isUpdatingList = false;
    let selectedResume = null;
    const maxSidebarWidth = 428;
    const screenSizeForOneSidebar = maxSidebarWidth * 2;
    const screenSizeForTwoSidebars = maxSidebarWidth * 4;

    window.isPaginated = false;

    // Validate elements
    if (
        !resumeListBtn ||
        !addResumeBtn ||
        !analysisBtn ||
        !previewBtn ||
        !leftSidebar ||
        !rightSidebar ||
        !centerContent ||
        !resumeList ||
        !formContainer ||
        !analysisContent ||
        !resumeContent ||
        !topBar ||
        !printBtn ||
        !moreOptionsBtn ||
        !moreOptionsMenu ||
        !pageViewBtn ||
        !viewOriginalBtn ||
        !loadResumeBtn ||
        !loadResumeMenu
    ) {
        console.error('UI elements not found');
        return;
    }

    // Show error message
    const showError = (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 p-2 mb-2 bg-red-100 rounded-md';
        errorDiv.textContent = message;
        formContainer.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    };

    // Populate model dropdown
    const populateModelDropdown = () => {
        const modelSelect = document.getElementById('model-select');
        if (!modelSelect) return;
        const models = tailor.getFreeModels();
        modelSelect.innerHTML = models.map(model => `
            <option value="${model}">${model}</option>
        `).join('');
    };

    // Populate Load Resume Menu
    const populateLoadResumeMenu = async () => {
        try {
            const resumes = await storage.getAllResumes();
            const savedResumes = resumes.filter(resume => !resume.isTailored);
            loadResumeMenu.innerHTML = savedResumes.length === 0
                ? '<p class="px-4 py-2 text-sm text-gray-500">No saved resumes</p>'
                : savedResumes.map(resume => `
                    <button class="load-resume-item" data-id="${resume.id}">
                        ${resume.companyName || 'Untitled Resume'}
                    </button>
                `).join('');

            // Hide menu if empty
            loadResumeMenu.classList.toggle('hidden', savedResumes.length === 0);
        } catch (error) {
            console.error('Error populating load resume menu:', error);
            showError('Failed to load resumes: ' + error.message);
        }
    };

    loadResumeBtn.addEventListener('click', async () => {
        console.log('Load resume button clicked');
        loadResumeMenu.classList.toggle('hidden');

        await populateLoadResumeMenu();
    });

    loadResumeMenu.addEventListener('click', async (e) => {
        const target = e.target.closest('.load-resume-item');
        if (!target) return;
        const id = parseInt(target.dataset.id);
        try {
            const resume = await storage.getResumeById(id);
            if (resume) {
                resumeTextarea.value = resume.resume;
                resumeTextarea.dispatchEvent(new Event('input')); // Trigger preview update
                loadResumeMenu.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error loading resume:', error);
            showError('Error loading resume: ' + error.message);
        }
    });

    // Populate resume list
    const populateResumeListFn = async (highlightId = null) => {
        if (isUpdatingList) return; // Prevent recursive calls
        isUpdatingList = true;
        try {
            if (!resumeList) {
                console.error('Resume list container not found');
                return;
            }

            const resumes = await storage.getAllResumes();
            resumeList.innerHTML = `
            <h3 class="font-semibold mb-2">Saved Resumes</h3>
            <ul id="saved-resumes" class="space-y-2 text-sm"></ul>
            <h3 class="font-semibold mb-2 mt-4">Tailored Resumes</h3>
            <ul id="tailored-resumes" class="space-y-2 text-sm"></ul>
        `;

            const savedResumesUl = resumeList.querySelector('#saved-resumes');
            const tailoredResumesUl = resumeList.querySelector('#tailored-resumes');

            if (!savedResumesUl || !tailoredResumesUl) {
                console.error('Resume list ULs not found');
                return;
            }

            // Separate resumes by isTailored
            const savedResumes = resumes.filter(resume => !resume.isTailored);
            const tailoredResumes = resumes.filter(resume => resume.isTailored);

            // Determine highlightId if not provided
            if (!highlightId && resumes.length > 0) {
                highlightId = resumes[0].id;
            }

            // Populate Saved Resumes
            savedResumes.forEach(resume => {
                const li = document.createElement('li');
                li.className = `resume-item ${resume.id === highlightId ? 'selected' : ''}`;
                li.dataset.id = resume.id;
                const titleText = resume.companyName || 'Untitled Resume';
                li.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="editable-title" title="${titleText}">${titleText}</span>
            <div class="flex items-center gap-2">
              <button class="edit-btn" data-id="${resume.id}">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="delete-btn" data-id="${resume.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `;
                savedResumesUl.appendChild(li);
            });

            // Populate Tailored Resumes
            tailoredResumes.forEach(resume => {
                const li = document.createElement('li');
                li.className = `resume-item ${resume.id === highlightId ? 'selected' : ''}`;
                li.dataset.id = resume.id;
                const titleText = resume.companyName || 'Untitled Resume';
                li.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="editable-title" title="${titleText}">${titleText}</span>
                    <div class="flex items-center gap-2">
                        <button class="edit-btn" data-id="${resume.id}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="delete-btn" data-id="${resume.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
                tailoredResumesUl.appendChild(li);
            });

            // Hide sections if empty
            savedResumesUl.classList.toggle('hidden', savedResumes.length === 0);
            tailoredResumesUl.classList.toggle('hidden', tailoredResumes.length === 0);
            resumeList.querySelector('h3:first-child').classList.toggle('hidden', savedResumes.length === 0);
            resumeList.querySelector('h3:last-of-type').classList.toggle('hidden', tailoredResumes.length === 0);

            // Update selectedResume if highlightId is provided
            if (highlightId) {
                selectedResume = await storage.getResumeById(highlightId);
                document.dispatchEvent(
                    new CustomEvent('resumeSelected', { detail: { id: highlightId } })
                );
            }
        } catch (error) {
            console.error('Error in populateResumeList:', error);
            showError('Failed to load resumes: ' + error.message);
        } finally {
            isUpdatingList = false;
        }
    };

    // Handle resume selection, button clicks, and hover via event delegation
    resumeList.addEventListener('click', async (e) => {
        const target = e.target.closest('button, li');
        if (!target) return;

        const li = target.closest('li');
        const id = parseInt(li?.dataset.id || target.dataset.id);
        if (!id) return;

        if (target.classList.contains('edit-btn')) {
            const titleSpan = li.querySelector('.editable-title');
            if (!titleSpan) {
                console.error('Editable title span not found');
                return;
            }

            // Store original title
            const originalTitle = titleSpan.textContent.trim();
            titleSpan.setAttribute('data-original-title', originalTitle);

            // Ensure clean content and set contentEditable
            titleSpan.innerHTML = originalTitle; // Reset to plain text
            titleSpan.setAttribute('contenteditable', 'true');
            titleSpan.setAttribute('tabindex', '0'); // Ensure focusable

            // Replace buttons
            const container = li.querySelector('.flex');
            container.querySelector('.edit-btn').remove();
            container.querySelector('.delete-btn').remove();
            container.innerHTML += `
        <div class="flex items-center gap-2">
          <button class="edit-save-btn" data-id="${id}">
            <i class="fa-solid fa-check"></i>
          </button>
          <button class="edit-cancel-btn" data-id="${id}">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      `;
            // Set focus and cursor
            setTimeout(() => {
                // Try again after DOM settles
                const titleSpan = li.querySelector('.editable-title');
                if (!titleSpan) return;

                // Ensure plain text only
                const originalTitle = titleSpan.getAttribute('data-original-title') || '';
                titleSpan.textContent = originalTitle;

                // Create a new range and selection
                const range = document.createRange();
                const selection = window.getSelection();

                // Append a temporary text node if needed
                let textNode = titleSpan.firstChild;
                if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
                    textNode = document.createTextNode(originalTitle);
                    titleSpan.innerHTML = '';
                    titleSpan.appendChild(textNode);
                }

                if (titleSpan.isConnected && textNode.isConnected) {
                    // Focus the span and place cursor at end
                    titleSpan.focus();
                    range.setStart(textNode, textNode.length);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    console.warn('Retrying cursor placement...');
                    // Retry in another frame if not yet in DOM
                    setTimeout(arguments.callee, 50); // Retry until in DOM
                }
            }, 50);

            titleSpan.setAttribute('contenteditable', 'true');
            titleSpan.setAttribute('tabindex', '0');
            titleSpan.focus();

            // Keyboard behavior: Enter = Save, Escape = Cancel
            const handleKeydown = async (event) => {
                const isEnter = event.key === 'Enter';
                const isEscape = event.key === 'Escape';

                if (isEnter || isEscape) {
                    event.preventDefault();
                    event.stopPropagation();

                    const newTitle = titleSpan.textContent.trim();
                    const originalTitle = titleSpan.getAttribute('data-original-title');

                    titleSpan.removeEventListener('keydown', handleKeydown);
                    titleSpan.removeEventListener('blur', handleBlur);
                    titleSpan.removeAttribute('contenteditable');
                    titleSpan.removeAttribute('tabindex');

                    if (isEnter) {
                        if (!newTitle) {
                            showError('Title cannot be empty');
                            titleSpan.textContent = originalTitle;
                            await populateResumeListFn(id);
                            return;
                        }
                        try {
                            await storage.updateResumeTitle(id, newTitle);
                            await populateResumeListFn(id);
                        } catch (err) {
                            console.error('Failed to save title:', err);
                            showError('Could not save title');
                            titleSpan.textContent = originalTitle;
                            await populateResumeListFn(id);
                        }
                    }

                    if (isEscape) {
                        titleSpan.textContent = originalTitle;
                        await populateResumeListFn(id);
                    }
                }
            };

            const handleBlur = async () => {
                titleSpan.removeEventListener('keydown', handleKeydown);
                titleSpan.removeEventListener('blur', handleBlur);
                titleSpan.removeAttribute('contenteditable');
                titleSpan.removeAttribute('tabindex');
                titleSpan.textContent = titleSpan.getAttribute('data-original-title');
                await populateResumeListFn(id);
            };

            titleSpan.addEventListener('keydown', handleKeydown);
            titleSpan.addEventListener('blur', handleBlur, { once: true });

        } else if (target.classList.contains('delete-btn')) {
            const titleText = li.querySelector('.editable-title').textContent;
            li.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="editable-title">${titleText}</span>
                <div class="delete-confirm-container flex items-center gap-2">
                    <button class="confirm-delete-btn" data-id="${id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="cancel-btn" data-id="${id}">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        } else if (target.classList.contains('edit-save-btn')) {
            const titleSpan = li.querySelector('.editable-title');
            const newTitle = titleSpan.textContent.trim();
            const originalTitle = titleSpan.title;
            if (newTitle) {
                await storage.updateResumeTitle(id, newTitle);
                await populateResumeListFn(id);
            } else {
                showError('Title cannot be empty');
                titleSpan.textContent = originalTitle;
                await populateResumeListFn(id);
            }
        } else if (target.classList.contains('edit-cancel-btn')) {
            await populateResumeListFn(id);
        } else if (target.classList.contains('confirm-delete-btn')) {
            await storage.deleteResume(id);
            await populateResumeListFn();
            document.dispatchEvent(new CustomEvent('resumeDeleted', { detail: { id } }));
        } else if (target.classList.contains('cancel-btn')) {
            await populateResumeListFn(id);
        } else if (target.tagName === 'LI') {
            resumeList.querySelectorAll('li').forEach((item) =>
                item.classList.remove('selected', 'bg-blue-100')
            );
            li.classList.add('selected', 'bg-blue-100');
            selectedResume = await storage.getResumeById(id);
            document.dispatchEvent(new CustomEvent('resumeSelected', { detail: { id } }));
        }
    });


    // Handle resume selection
    document.addEventListener('resumeSelected', async (e) => {
        const { id } = e.detail;
        const { renderFromSelectedResume } = await import('./markdown.js');
        await renderFromSelectedResume(id);
        selectedResume = await storage.getResumeById(id);
        storage.getResumeById(id).then(resume => {
            viewOriginalBtn.classList.toggle('hidden', !resume?.isTailored);
            analysisBtn.classList.toggle('hidden', !resume?.isTailored);
            rightSidebar.classList.toggle('hidden', !resume?.isTailored);
            adjustResumeScale();
        });
        if (window.innerWidth <= screenSizeForOneSidebar) {
            resumeListBtn.click();
        }
    });

    // Show welcome and user details modals for new users
    const showWelcomeModal = async () => {
        try {
            const isNewUser = await storage.isDatabaseEmpty();
            if (isNewUser) {
                console.log('New user detected, showing welcome modal');
                const modal = renderWelcomeModal({
                    onClose: async () => {
                        // Show user details modal after welcome modal
                        const userDetailsModal = renderUserDetailsModal({
                            onSubmit: async (userDetails) => {
                                try {
                                    await storage.saveUserDetails(userDetails);
                                    // Trigger "Add Resume" mode
                                    addResumeBtn.click();
                                    if (resumeTextarea.value) {
                                        const resumeData = {
                                            resume: resumeTextarea.value,
                                            isTailored: false,
                                            companyName: 'Example Resume',
                                            position: 'Sample Position',
                                        };
                                        const newId = await storage.saveResume(resumeData);
                                        await populateResumeListFn(newId);
                                    }
                                } catch (error) {
                                    console.error('Error saving user details or example resume:', error);
                                    showError('Failed to initialize: ' + error.message);
                                }
                            },
                        });
                        document.body.appendChild(userDetailsModal);
                    },
                });
                document.body.appendChild(modal);
            } else {
                // Check if user details exist, prompt if not
                const hasUserDetails = await storage.hasUserDetails();
                if (!hasUserDetails) {
                    const userDetailsModal = renderUserDetailsModal({
                        onSubmit: async (userDetails) => {
                            try {
                                await storage.saveUserDetails(userDetails);
                                resumeListBtn.click();
                            } catch (error) {
                                console.error('Error saving user details:', error);
                                showError('Failed to save user details: ' + error.message);
                            }
                        },
                    });
                    document.body.appendChild(userDetailsModal);
                } else {
                    resumeListBtn.click();
                }
            }
        } catch (error) {
            console.error('Error checking new user status:', error);
            showError('Error initializing app: ' + error.message);
        }
    };

    // Update resume preview
    const updateResumePreview = () => {
        adjustResumeScale();
        topBar.classList.toggle('narrow', topBar.offsetWidth < 512);
    };

    // Change mode
    const changeMode = async (newMode) => {
        if (mode === newMode) return;
        mode = newMode;
        console.log('Mode changed to:', mode);
        title.textContent = mode === 'add' ? 'Add Resume' : 'My Resumes';
        const { renderFromTextarea, renderFromSelectedResume } = await import('./markdown.js');

        if (mode === 'add') {
            // Show left sidebar
            leftSidebar.classList.remove('hidden');

            // Hide resume list and set inactive state
            resumeList.classList.add('hidden');
            resumeListBtn.classList.remove('active');

            // Show form
            formContainer.classList.remove('hidden');

            // Hide right sidebar
            rightSidebar.classList.add('hidden');

            // Hide analysis button and set inactive state
            analysisBtn.classList.add('hidden');
            analysisBtn.classList.remove('active');

            // Set active state for add resume button
            addResumeBtn.classList.add('active');

            // Hide preview button
            previewBtn.classList.remove('hidden');

            // Set default width for left sidebar
            leftSidebar.classList.remove('w-1/5');
            leftSidebar.classList.add('w-1/2');

            // Hide viewOriginalBtn button
            viewOriginalBtn.classList.add('hidden');

            if (window.innerWidth <= screenSizeForOneSidebar) {
                // For samll screens, hide center content and set preview inactive state
                previewBtn.classList.remove('active');
                centerContent.classList.add('hidden');
            } else {
                // For wide screens, set preview button active and show center content
                previewBtn.classList.add('active');
                centerContent.classList.remove('hidden');
            }
            await renderFromTextarea();
            if (window.isPaginated) await splitIntoPages();

        } else if (mode === 'view') {
            // Show left sidebar
            leftSidebar.classList.remove('hidden');

            // Hide from and show resume list and set active state
            formContainer.classList.add('hidden');
            resumeList.classList.remove('hidden');
            resumeListBtn.classList.add('active');

            // Show analysis button is selected resume is tailored
            if (selectedResume?.isTailored) {
                analysisBtn.classList.remove('hidden');
                rightSidebar.classList.remove('hidden');
            }

            // Hide preview button
            previewBtn.classList.add('hidden');

            // Set inactive state for add resume button
            addResumeBtn.classList.remove('active');

            // set default width for left sidebar
            leftSidebar.classList.remove('w-1/2');
            leftSidebar.classList.add('w-1/5');

            // Show viewOriginalBtn button
            viewOriginalBtn.classList.remove('hidden');

            if (window.innerWidth <= screenSizeForOneSidebar) {
                // For small screens, hide center content and right sidebar
                centerContent.classList.add('hidden');
                rightSidebar.classList.add('hidden');
                // Set inactive state for analysis button
                analysisBtn.classList.remove('active');
            } else if (window.innerWidth <= screenSizeForTwoSidebars) {
                // For medium screens, hide right sidebar and set inactive state
                rightSidebar.classList.add('hidden');
                analysisBtn.classList.remove('active');
            } else {
                // For wide screens, show center content
                centerContent.classList.remove('hidden');

                // if isTailored also show right sidbar and set active state for analysis button
                if (selectedResume?.isTailored) {
                    rightSidebar.classList.remove('hidden');
                    analysisBtn.classList.add('active');
                }
            }

            try {
                await renderFromSelectedResume(selectedResume.id);
                if (window.isPaginated) await splitIntoPages();
            } catch {
                resumeContent.innerHTML = '<p class="text-gray-500">No resume selected</p>';
            }
            // adjustResumeScale();
        }
        updateResumePreview();
    };

    // 1. Handle resume-list-btn click
    resumeListBtn.addEventListener('click', async () => {
        console.log('Resume list button clicked');
        if (mode === 'add') {
            await changeMode('view');
        } else {

            // Toggle active state and left-sidebar visibility
            if (resumeListBtn.classList.contains('active')) {

                // Hide left sidebar (resume list)
                leftSidebar.classList.add('hidden');
                resumeListBtn.classList.remove('active');

                console.log('Hide resume list');

                // Visibility logic
                if (window.innerWidth <= screenSizeForOneSidebar) {
                    // For small screens, show center content
                    centerContent.classList.remove('hidden');
                }
            } else {
                // Show left sidebar (resume list)
                leftSidebar.classList.remove('hidden');
                resumeListBtn.classList.add('active');

                console.log('Show resume list');

                // Visibility logic
                if (window.innerWidth <= screenSizeForTwoSidebars) {
                    // For medium screens, hide right sidebar when showing left sidebar
                    rightSidebar.classList.add('hidden');
                    analysisBtn.classList.remove('active');
                }
                if (window.innerWidth <= screenSizeForOneSidebar) {
                    // For small screens, hide both right sidebar and center content when showing left sidebar
                    rightSidebar.classList.add('hidden');
                    analysisBtn.classList.remove('active');
                    centerContent.classList.add('hidden');
                }
            }
            updateResumePreview();
        }
    });

    // 2. Handle analysis-btn click
    analysisBtn.addEventListener('click', () => {
        console.log('Analysis button clicked');
        if (mode === 'add') {
            console.error('Analysis button should not be active in add mode');
            return;
        }

        if (analysisBtn.classList.contains('active')) {
            // Hide right sidebar (analysis)
            rightSidebar.classList.add('hidden');
            analysisBtn.classList.remove('active');
            console.log('Hide analysis view');

            // Visibility logic
            if (window.innerWidth <= screenSizeForOneSidebar) {
                // For small screens, show center content
                centerContent.classList.remove('hidden');
            }
        } else {
            // Show right sidebar (analysis)
            rightSidebar.classList.remove('hidden');
            analysisBtn.classList.add('active');
            console.log('Show analysis view');

            // Visibility logic
            if (window.innerWidth <= screenSizeForTwoSidebars) {
                // For medium screens, hide left sidebar when showing right sidebar
                leftSidebar.classList.add('hidden');
                resumeListBtn.classList.remove('active');
            }
            if (window.innerWidth <= screenSizeForOneSidebar) {
                // For small screens, hide both left sidebar and center content when showing right sidebar
                leftSidebar.classList.add('hidden');
                resumeListBtn.classList.remove('active');
                centerContent.classList.add('hidden');
            }
        }
        updateResumePreview();
    });

    // 3. Handle add-resume-btn click
    addResumeBtn.addEventListener('click', async () => {
        console.log('Add resume button clicked');
        if (mode === 'view') {
            await changeMode('add');
        }
        updateResumePreview();
    });

    // 4. Handle preview-btn click
    previewBtn.addEventListener('click', async () => {
        console.log('Preview button clicked');
        if (mode === 'view') {
            console.error('Preview button should not be active in view mode');
            return;
        }
        if (previewBtn.classList.contains('active')) {
            // Hide center content
            centerContent.classList.add('hidden');
            previewBtn.classList.remove('active');
            console.log('Hide preview view');
            // Visibility logic
            if (window.innerWidth <= screenSizeForOneSidebar) {
                // For small screens, show left sidebar (form) instead of center content (preview)
                leftSidebar.classList.remove('hidden');
                addResumeBtn.classList.add('active');
            }
        } else {
            // Show center content
            centerContent.classList.remove('hidden');
            previewBtn.classList.add('active');
            console.log('Show preview view');

            if (window.innerWidth <= screenSizeForOneSidebar) {
                // For small screens, hide left sidebar (form) when showing center content (preview)
                leftSidebar.classList.add('hidden');
            }
            const { renderFromTextarea } = await import('./markdown.js');
            await renderFromTextarea();
            if (window.isPaginated) await splitIntoPages();
        }
        updateResumePreview();
    });

    // Set Tab
    const setActiveFormTab = (tab = null) => {
        if (!tabAdd || !tabTailor || !tailorResumeForm || !title || !tabBackground || !formContainer) return;

        const isAdd = tab === null || tab.dataset.tab === 'add-resume';

        // Update tab button classes and ARIA
        tabAdd.classList.toggle('active-tab', isAdd);
        tabAdd.setAttribute('aria-selected', isAdd);
        tabTailor.classList.toggle('active-tab', !isAdd);
        tabTailor.setAttribute('aria-selected', !isAdd);

        // Show/hide extra fields
        tailorResumeForm.classList.toggle('hidden', isAdd);
        addResumeForm.classList.toggle('hidden', !isAdd);

        // Toggle mode classes on form-container
        formContainer.classList.toggle('add-mode', isAdd);
        formContainer.classList.toggle('tailor-mode', !isAdd);

        // Update title
        title.textContent = isAdd ? 'Add Resume' : 'Tailor Resume';

        // Update submit button text
        if (submitBtn) {
            submitBtn.textContent = isAdd ? 'Save Resume' : 'Tailor Resume';
        }

        // Update background position to active tab
        updateBackgroundPosition(isAdd ? tabAdd : tabTailor);
        jobDescription.classList.toggle('flex', !isAdd);
        jobDescription.classList.toggle('flex-col', !isAdd);
        jobDescription.classList.toggle('flex-grow', !isAdd);

        addResumeForm.classList.toggle('flex', !isAdd);
        addResumeForm.classList.toggle('flex-col', !isAdd);
        addResumeForm.classList.toggle('flex-grow', !isAdd);

        // Show/hide model dropdown
        const modelSelectContainer = document.getElementById('model-select-container');
        if (modelSelectContainer) {
            modelSelectContainer.classList.toggle('hidden', isAdd);
        }
    };

    // Update background position based on active tab
    const updateBackgroundPosition = (targetTab) => {
        const { offsetLeft, offsetWidth } = targetTab;
        tabBackground.style.left = `${offsetLeft}px`;
        tabBackground.style.width = `${offsetWidth}px`;
    };

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveFormTab(btn);
        });

        // Handle hover
        btn.addEventListener('mouseenter', () => {
            updateBackgroundPosition(btn);
        });
    });

    // Snap background back to active tab when leaving container
    tabContainer.addEventListener('mouseleave', () => {
        const activeTab = document.querySelector('.tab-btn.active-tab');
        if (activeTab) {
            updateBackgroundPosition(activeTab);
        }
    });

    // Print resume
    function printResume() {
        if (!resumeContent) {
            console.error('Resume content not found');
            return;
        }

        const pageContents = document.querySelectorAll('.page');

        if (!pageContents.length) {
            console.error('No page elements found in resume content');
            return;
        }

        // Create a new container element
        const printContent = document.createElement('div');
        printContent.id = 'resume-content';

        // Append all cloned .page children into printContent
        pageContents.forEach(content => {
            const clonedPage = content.cloneNode(true);

            printContent.appendChild(clonedPage);
        });

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Resume Print</title>
                <link rel="stylesheet" href="src/styles/main.css">
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Raleway&display=swap">
                <script src="https://kit.fontawesome.com/da85c8bdce.js" crossorigin="anonymous"></script>

            </head>
            <body>${printContent.outerHTML}</body>
            </html>
        `);
        doc.close();

        iframe.onload = () => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (error) {
                console.error('Error during print:', error);
            } finally {
                // Remove iframe after a short delay
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 100);
            }
        };
    }

    printBtn.addEventListener('click', () => {
        console.log('Print button clicked');
        printResume();
    });

    // Download resume as PDF
    downloadBtn.addEventListener('click', async () => {
        if (!resumeContent) {
            console.error('Resume content not found');
            return;
        }

        const pages = resumeContent.querySelectorAll('.page');
        if (!pages.length) {
            console.error('No page elements found');
            return;
        }

        // Inline main.css to avoid loading issues
        const mainCss = `
            @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap');

            :root {
                --background: #000000;
                --text: #6b7280;
                --primary-dark: #81b8ff;
                --primary-light: #bfdbfe;
                --page-padding: 10mm;
            }

            body {
                font-family: 'Raleway', sans-serif;
                color: var(--text);
            }

            a {
                text-decoration: none;
                color: var(--text);
            }

            #resume-content {
            }

            #resume-content h1,
            #resume-content h2 {
                color: var(--primary-dark);
                line-height: 1.2;
            }

            #resume-content h1 {
                font-size: 3rem;
                font-weight: 400;
            }

            #resume-content h2 {
                font-size: 1.5rem;
                font-weight: 400;
                margin: 2rem 0 0;
            }

            #resume-content h3 {
                font-size: 1.2rem;
                font-weight: 700;
                margin: 2rem 0 0;
            }

            #resume-content p {
                margin: 1rem 0;
                line-height: 1.5;
            }

            #resume-content a {
                text-decoration: none;
                cursor: pointer;
            }


            #resume-content ul {
                padding-left: 2rem;
                margin: 1rem 0;
                list-style-type: disc;
            }

            #resume-content ul ul {
                padding-left: 2rem;
                margin: 0.5rem 0;
                list-style-type: circle;
            }

            #resume-content li {
                margin: 0.5rem 0;
            }

            #resume-content strong {
                font-weight: bold;
                line-height: 2;
            }
        `;

        // Create HTML content
        const htmlContent = `
            <html>
            <head>
                <title>Resume PDF</title>
                <style>${mainCss}</style>
            </head>
            <body>
                <div id="resume-content">
                    ${Array.from(pages).map((page, i) => `
                        <div class="page" style="page-break-after: ${i < pages.length - 1 ? 'always' : 'auto'}">
                            ${page.innerHTML.replace(/<span[^>]*class="[^"]*fa-[^"]*"[^>]*>(.*?)<\/span>/gi, '$1')}
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;

        // Log HTML for debugging
        console.log('Sending HTML content:', htmlContent);

        try {
            const response = await fetch('http://localhost:3000/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'text/html' },
                body: htmlContent
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`PDF generation failed: ${errorText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.pdf';
            a.click();
            URL.revokeObjectURL(url);
            console.log('PDF downloaded successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    });

    // Dropdown menu
    moreOptionsBtn.addEventListener('click', () => {
        moreOptionsMenu.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!moreOptionsBtn.contains(e.target) && !moreOptionsMenu.contains(e.target)) {
            moreOptionsMenu.classList.add('hidden');
        }
        if (!loadResumeBtn.contains(e.target) && !loadResumeMenu.contains(e.target)) {
            loadResumeMenu.classList.add('hidden');
        }
    });

    // Toggle Page View
    pageViewBtn.addEventListener('click', async () => {
        window.isPaginated = !window.isPaginated;
        pageViewBtn.classList.toggle('page-view-active', window.isPaginated);
        const { renderFromTextarea, renderFromSelectedResume } = await import('./markdown.js');
        if (mode === 'add') {
            await renderFromTextarea();
        } else {
            const selectedLi = resumeList.querySelector('li.selected');
            if (selectedLi) {
                const id = parseInt(selectedLi.dataset.id);
                await renderFromSelectedResume(id);
            } else {
                resumeContent.innerHTML = '<p class="text-gray-500">No resume selected</p>';
            }
        }
        if (window.isPaginated) await splitIntoPages();
        moreOptionsMenu.classList.add('hidden');
        updateResumePreview();
    });


    function adjustResumeScale() {
        const containerWidth = resumePreview.offsetWidth;

        // Get padding from #resume-preview
        const computedStylePreview = getComputedStyle(resumePreview);
        const padding = parseFloat(computedStylePreview.padding);

        console.log('Container width:', containerWidth);
        const a4WidthPx = 210 * 3.779; // 210mm to pixels (1mm ≈ 3.779px at 96 DPI)
        const scale = (containerWidth - 2 * padding) / a4WidthPx; // Calculate scale
        const maxScale = 3;
        const finalScale = Math.min(scale, maxScale);

        // Calculate dynamic height based on number of pages
        const pages = document.querySelectorAll('.page');
        const pageHeightMm = 297; // A4 height
        const marginBottomMm = 5; // From CSS
        const offset = 140; // Offset in pixels to account for top bar and other elements
        const totalHeightMm = pages.length * (pageHeightMm + marginBottomMm) * scale + offset;
        console.log('Total height in mm:', pages.length, pageHeightMm, marginBottomMm, scale, totalHeightMm);
        resumeContent.style.height = `${totalHeightMm}mm`;

        resumeContent.style.transform = `scale(${finalScale})`;
    }

    window.adjustResumeScale = adjustResumeScale;

    // Handle window resize
    window.addEventListener('resize', async () => {
        if (mode === 'view') {
            if (window.innerWidth <= screenSizeForTwoSidebars) {
                // For medium screens, hide left sidebar (resume list) and set inactive state
                leftSidebar.classList.add('hidden');
                resumeListBtn.classList.remove('active');
                // Show center content
                centerContent.classList.remove('hidden');

                // Hide right sidebar (analysis) and set inactive state
                if (window.innerWidth <= screenSizeForOneSidebar) {
                    // For small screens, hide right sidebar (analysis) and set active state
                    rightSidebar.classList.add('hidden');
                    analysisBtn.classList.remove('active');
                    // Show center content
                    centerContent.classList.remove('hidden');
                } else {
                    // For medium screens, show right sidebar (analysis) and set active state if isTailored
                    if (selectedResume?.isTailored) {
                        rightSidebar.classList.remove('hidden');
                        analysisBtn.classList.add('active');
                    } else {
                        // For medium screens, show left sidebar (resumeList) and set active state
                        leftSidebar.classList.remove('hidden');
                        resumeListBtn.classList.add('active');
                    }
                }
            } else {
                // For wide screens
                // Show left sidebar (resume list) and set active state
                leftSidebar.classList.remove('hidden');
                resumeListBtn.classList.add('active');

                // Show right sidebar (analysis) and set active state if isTailored
                if (selectedResume?.isTailored) {
                    rightSidebar.classList.remove('hidden');
                    analysisBtn.classList.add('active');
                }
            }

        } else if (mode === 'add') {
            if (window.innerWidth <= screenSizeForOneSidebar) {
                // For samll screens, hide center content (resume preview) and set inactive state
                centerContent.classList.add('hidden');
                previewBtn.classList.remove('active');
                // Show left sidebar (form)
                leftSidebar.classList.remove('hidden');
            } else {
                // For wide screens, show center content (resume preview) and set active state
                centerContent.classList.remove('hidden');
                previewBtn.classList.add('active');
            }
        }
        updateResumePreview();
        if (window.isPaginated) await splitIntoPages();
    });

    // Initialize
    window.addEventListener('DOMContentLoaded', () => {
        setActiveFormTab(tabAdd);
        addResumeBtn.click();
        showWelcomeModal();
        populateResumeListFn();
        populateLoadResumeMenu();
        populateModelDropdown();
    });
}

