import { marked } from 'marked';

export function initMarkdown() {
    console.log('Initializing Markdown renderer');
    const markdownInput = document.querySelector('.textarea');
    const resumeContent = document.getElementById('resume-content');

    // Configure marked with basic options
    marked.setOptions({
        gfm: true, // Enable GitHub Flavored Markdown
        breaks: true, // Convert line breaks to <br>
    });

    // Render initial content
    const renderMarkdown = () => {
        const markdownText = markdownInput.value.trim();
        resumeContent.innerHTML = markdownText ? marked.parse(markdownText) : '<p>Enter Markdown to preview your resume.</p>';
    };

    // Update preview on input
    markdownInput.addEventListener('input', renderMarkdown);

    // Initial render
    renderMarkdown();
}