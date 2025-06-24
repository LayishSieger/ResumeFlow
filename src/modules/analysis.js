import { initStorage } from './storage.js';
import { marked } from 'marked';

export function initAnalysis() {
    console.log('Analysis module initialized');
    const analysisContent = document.getElementById('analysis-content');
    const resumeContent = document.getElementById('resume-content');
    const viewOriginalBtn = document.getElementById('view-original-btn');

    if (!analysisContent || !resumeContent || !viewOriginalBtn) {
        console.error('Analysis elements not found:', { analysisContent, resumeContent, viewOriginalBtn });
        return;
    }

    let currentResume = null;
    let isViewingOriginal = false;
    window.isViewingOriginal = isViewingOriginal;

    // Render analysis for a resume
    const renderAnalysis = (resume) => {
        if (!resume || !resume.isTailored || !resume.tailoredResponse) {
            analysisContent.innerHTML = '<p class="text-gray-500">No analysis available. Please tailor a resume first.</p>';
            viewOriginalBtn.classList.add('hidden');
            return;
        }

        const { tailoredResponse } = resume;
        analysisContent.innerHTML = `
            <div id="jobDetails" class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-2">Job Details</h2>
                <p><strong>Company:</strong> ${tailoredResponse.jobDetails.company || 'N/A'}</p>
                <p><strong>Role:</strong> ${tailoredResponse.jobDetails.role || 'N/A'}</p>
                <p><strong>Job Type:</strong> ${tailoredResponse.jobDetails.jobType || 'N/A'}</p>
                <p><strong>Location:</strong> ${tailoredResponse.jobDetails.location || 'N/A'}</p>
            </div>
            <div id="keywords" class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-2">Extracted Keywords</h2>
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border p-2">Keyword</th>
                            <th class="border p-2">Type</th>
                            <th class="border p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody id="keywordsTable">
                        ${[
                ...(tailoredResponse.extractedKeywords.jobDescriptionKeywords || []).map(k => ({ ...k, status: 'Job Description Only' })),
                ...(tailoredResponse.extractedKeywords.matchedKeywords || []).map(k => ({ ...k, status: 'Matched' }))
            ].map(keyword => `
                            <tr>
                                <td class="border p-2">${keyword.keyword || 'N/A'}</td>
                                <td class="border p-2">${keyword.type || 'N/A'}</td>
                                <td class="border p-2">${keyword.status || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="matchPercentage" class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-2">Match Percentage</h2>
                <p><strong>Percentage:</strong> ${tailoredResponse.matchPercentage.percentage || 'N/A'}</p>
                <p><strong>Keyword Match:</strong> ${tailoredResponse.matchPercentage.calculation.keywordMatch || 'N/A'}</p>
                <p><strong>Skills Alignment:</strong> ${tailoredResponse.matchPercentage.calculation.skillsAlignment || 'N/A'}</p>
                <p><strong>Experience Relevance:</strong> ${tailoredResponse.matchPercentage.calculation.experienceRelevance || 'N/A'}</p>
                <p><strong>Total:</strong> ${tailoredResponse.matchPercentage.calculation.total || 'N/A'}</p>
                <p><strong>Explanation:</strong> ${tailoredResponse.matchPercentage.explanation || 'N/A'}</p>
            </div>
            <div id="roleFit" class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-2">Role Fit Assessment</h2>
                <p><strong>Fit:</strong> ${tailoredResponse.roleFitAssessment.fit || 'N/A'}</p>
                <p><strong>Explanation:</strong> ${tailoredResponse.roleFitAssessment.explanation || 'N/A'}</p>
            </div>
            <div id="improvementSuggestions" class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-2">Improvement Suggestions</h2>
                <ul class="list-disc pl-5">
                    ${tailoredResponse.tailoredResume.improvementSuggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div id="nextSteps" class="mb-6">
                <h2 class="text-xl font-bold text-gray-700 mb-2">Next Steps</h2>
                <ul class="list-disc pl-5">
                    ${tailoredResponse.nextSteps.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `;
        viewOriginalBtn.classList.remove('hidden');
    };

    // Handle resume selection
    document.addEventListener('resumeSelected', async (e) => {
        const { id } = e.detail;
        const { getResumeById } = initStorage();
        try {
            currentResume = await getResumeById(id);
            renderAnalysis(currentResume);
            isViewingOriginal = false;
            window.isViewingOriginal = isViewingOriginal;
            viewOriginalBtn.textContent = 'View Original Resume';
            viewOriginalBtn.classList.toggle('hidden', !currentResume.isTailored);
            const { renderFromSelectedResume } = await import('./markdown.js');
            await renderFromSelectedResume(id);
            if (window.isPaginated) await import('./pagination.js').then(m => m.splitIntoPages());
        } catch (error) {
            console.error('Error rendering analysis:', error);
            analysisContent.innerHTML = `<p class="text-red-500">Error loading analysis: ${error.message}</p>`;
        }
    });

    viewOriginalBtn.addEventListener('click', async () => {
        if (!currentResume) return;
        isViewingOriginal = !isViewingOriginal;
        window.isViewingOriginal = isViewingOriginal;
        viewOriginalBtn.textContent = isViewingOriginal ? 'View Tailored Resume' : 'View Original Resume';
        const { renderFromSelectedResume } = await import('./markdown.js');
        await renderFromSelectedResume(currentResume.id);
        if (window.isPaginated) await import('./pagination.js').then(m => m.splitIntoPages());
        moreOptionsMenu.classList.add('hidden');
    });

    document.addEventListener('resumeDeleted', () => {
        currentResume = null;
        analysisContent.innerHTML = '<p class="text-gray-500">Select a resume to view analysis.</p>';
        resumeContent.innerHTML = '';
        viewOriginalBtn.classList.add('hidden');
    });
}