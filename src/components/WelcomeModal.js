export function renderWelcomeModal({ onClose }) {
    const modal = document.createElement('div');
    modal.id = 'welcome-modal';
    modal.className = `
      fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50
      transition-opacity duration-300
    `;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'welcome-title');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <h2 id="welcome-title" class="text-2xl font-bold text-gray-800 mb-4">Welcome to ResumeFlow!</h2>
        <p class="text-gray-600 mb-4">
          ResumeFlow is your free, open-source tool for creating and tailoring resumes. It allows you to design, customize, and save resumes directly on your device.
        </p>
        <p class="text-gray-600 mb-4">
          Your data is stored locally, ensuring privacy and control. If you choose to use the tailoring feature, it may involve third-party APIs.
        </p>
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Terms and Conditions</h3>
          <div class="text-gray-600 text-sm max-h-40 overflow-y-auto scrollbar-thin pr-2">
            <p class="mb-2">
              By using ResumeFlow, you agree to the following terms:
            </p>
            <ul class="list-disc pl-5 mb-2">
              <li>ResumeFlow is provided free of charge for creating, tailoring, and saving resumes locally on your device using IndexedDB.</li>
              <li>Your data is stored locally and not transmitted to our servers unless you opt to use the tailoring feature.</li>
              <li>You are responsible for the accuracy and legality of the content you upload or create.</li>
              <li>ResumeFlow is not liable for any loss of data or misuse of the application.</li>
              <li>We may update these terms at any time, and continued use constitutes acceptance of the updated terms.</li>
            </ul>
            <p>
            For full details, contact our support team at support@resumeflow.com.
            </p>
          </div>
        </div>
        <div class="flex items-start mb-6">
          <input
            type="checkbox"
            id="terms-checkbox"
            class="mr-2 h-5 w-5 text-blue-400 focus:ring-blue-400 border-gray-300 rounded"
            aria-labelledby="terms-label"
          >
          <label id="terms-label" for="terms-checkbox" class="text-gray-600 text-sm">
            I agree to the Terms and Conditions
          </label>
        </div>
        <div class="flex justify-end">
          <button
            id="welcome-close-btn"
            class="btn"
            aria-label="Get started"
            disabled
          >
            Get Started
          </button>
        </div>
      </div>
    `;

    // Get elements
    const closeButton = modal.querySelector('#welcome-close-btn');
    const termsCheckbox = modal.querySelector('#terms-checkbox');

    // Enable/disable button based on checkbox state
    termsCheckbox.addEventListener('change', () => {
        closeButton.disabled = !termsCheckbox.checked;
    });

    // Close modal on button click
    closeButton.addEventListener('click', () => {
        if (!termsCheckbox.checked) return; // Prevent closing if terms not accepted
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.remove();
            onClose();
        }, 300); // Match transition duration
    });

    // Handle keyboard accessibility
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (e.target === termsCheckbox) {
                termsCheckbox.checked = !termsCheckbox.checked;
                closeButton.disabled = !termsCheckbox.checked;
            } else if (e.target === closeButton && !closeButton.disabled) {
                closeButton.click();
            }
        }
    });

    // Focus the checkbox for accessibility
    termsCheckbox.focus();

    return modal;
}