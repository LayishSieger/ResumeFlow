import { marked } from 'marked';
import { initStorage } from './storage.js';

let markdownPreview = null;
let resumeTextarea = null;

export function initMarkdown() {
    console.log('Markdown module initialized');
    markdownPreview = document.getElementById('resume-content');
    resumeTextarea = document.getElementById('resume-textarea');

    if (!markdownPreview || !resumeTextarea) {
        console.error('Markdown elements not found:', { markdownPreview, resumeTextarea });
        return;
    }
    // Load example markdown from file on page load
    fetch('assets/example_resume.md')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch example_resume.md: ${response.statusText}`);
            }
            return response.text();
        })
        .then(text => {
            resumeTextarea.value = text;
            resumeTextarea.dispatchEvent(new Event('input'));
        })
        .catch(error => {
            console.error('Error fetching example_resume.md:', error);
            resumeTextarea.value = '# Error\nFailed to load example resume. Please upload a .md or .txt file.';
        });

    // Live markdown preview
    resumeTextarea.addEventListener('input', () => {
        renderFromTextarea(resumeTextarea.value);
        window.adjustResumeScale();
    });
}

async function getUserDetailsMarkdown() {
    const { getUserDetails } = initStorage();
    const userDetails = await getUserDetails();
    if (!userDetails) return '';

    const { name, address, phone, email, linkedin, portfolio } = userDetails;
    let contactLine = [];
    if (address) contactLine.push(address);
    if (phone) contactLine.push(phone);
    if (email) contactLine.push(`[${email}](mailto:${email})`);
    if (linkedin) contactLine.push(`[Linkedin](${linkedin})`);
    if (portfolio) contactLine.push(`[${portfolio}](${portfolio})`);

    return `# ${name}\n\n${contactLine.join(' | ')}\n\n`;
}

export async function renderFromTextarea() {
    if (!markdownPreview || !resumeTextarea) {
        throw new Error('Markdown module not initialized. Call initMarkdown first.');
    }
    try {
        const userDetailsMarkdown = await getUserDetailsMarkdown();
        const content = userDetailsMarkdown + (resumeTextarea.value || 'No content provided');
        const parsedContent = await marked.parse(content);
        // Wrap content in a .page div
        const pageDiv = document.createElement('div');
        pageDiv.classList.add('page');
        if (window.isPaginated) {
            pageDiv.classList.add('paginated');
        }
        pageDiv.style.padding = '10mm';
        pageDiv.innerHTML = parsedContent;
        markdownPreview.innerHTML = '';
        markdownPreview.appendChild(pageDiv);
        console.log('Rendered from textarea with user details');
    } catch (error) {
        console.error('Error rendering from textarea:', error);
        markdownPreview.innerHTML = '<div class="page" style="padding: 10mm;"><p>Error rendering resume</p></div>';
        window.adjustResumeScale();
    }
}

export async function renderFromSelectedResume(resumeId) {
    if (!markdownPreview) {
        throw new Error('Markdown module not initialized. Call initMarkdown first.');
    }
    try {
        const { getResumeById } = initStorage();
        const resume = await getResumeById(resumeId);
        if (!resume) {
            throw new Error('Resume not found');
        }
        const userDetailsMarkdown = await getUserDetailsMarkdown();
        console.log("User Details:", userDetailsMarkdown);
        const content = resume.isTailored && window.isViewingOriginal
            ? resume.resume
            : (resume.tailoredResponse?.tailoredResume?.content || resume.resume);
        const fullContent = userDetailsMarkdown + content;
        const parsedContent = await marked.parse(fullContent);
        // Wrap content in a .page div
        const pageDiv = document.createElement('div');
        pageDiv.classList.add('page');
        if (window.isPaginated) {
            pageDiv.classList.add('paginated');
        }
        pageDiv.style.padding = '10mm';
        pageDiv.innerHTML = parsedContent;
        markdownPreview.innerHTML = '';
        markdownPreview.appendChild(pageDiv);
        console.log('Rendered from selected resume with user details:', resumeId);
    } catch (error) {
        console.error('Error rendering from selected resume:', error);
        markdownPreview.innerHTML = '<div class="page" style="padding: 10mm;"><p>Error rendering resume</p></div>';
        window.adjustResumeScale();
    }
}