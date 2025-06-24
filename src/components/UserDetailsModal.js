export function renderUserDetailsModal({ onSubmit }) {
    const modal = document.createElement('div');
    modal.id = 'user-details-modal';
    modal.className = `
        fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50
        transition-opacity duration-300
    `;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'user-details-title');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <h2 id="user-details-title" class="text-2xl font-bold text-gray-800 mb-4">Enter Your Personal Details</h2>
            <p class="text-gray-600 mb-4">
                Provide your contact information to include at the top of your resume. This data is stored locally and will not be sent to any external APIs.
            </p>
            <form id="user-details-form" class="space-y-4">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        class="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:ring-blue-400 focus:outline-none"
                        aria-required="true"
                    >
                </div>
                <div>
                    <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        class="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:ring-blue-400 focus:outline-none"
                    >
                </div>
                <div>
                    <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        class="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:ring-blue-400 focus:outline-none"
                    >
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        class="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:ring-blue-400 focus:outline-none"
                        aria-required="true"
                    >
                </div>
                <div>
                    <label for="linkedin" class="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                    <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        class="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:ring-blue-400 focus:outline-none"
                    >
                </div>
                <div>
                    <label for="portfolio" class="block text-sm font-medium text-gray-700">Portfolio/GitHub URL</label>
                    <input
                        type="url"
                        id="portfolio"
                        name="portfolio"
                        class="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:ring-blue-400 focus:outline-none"
                    >
                </div>
                <div class="flex justify-end">
                    <button
                        type="submit"
                        id="user-details-submit-btn"
                        class="btn"
                        aria-label="Save Details"
                    >
                        Save Details
                    </button>
                </div>
            </form>
        </div>
    `;

    const form = modal.querySelector('#user-details-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const userDetails = {
            name: formData.get('name')?.trim() || '',
            address: formData.get('address')?.trim() || '',
            phone: formData.get('phone')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            linkedin: formData.get('linkedin')?.trim() || '',
            portfolio: formData.get('portfolio')?.trim() || '',
        };

        if (!userDetails.name || !userDetails.email) {
            alert('Name and Email are required fields.');
            return;
        }

        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.remove();
            onSubmit(userDetails);
        }, 300); // Match transition duration
    });

    // Handle keyboard accessibility
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            const submitButton = modal.querySelector('#user-details-submit-btn');
            if (submitButton) submitButton.click();
        }
    });

    // Focus the first input for accessibility
    const firstInput = modal.querySelector('#name');
    if (firstInput) firstInput.focus();

    return modal;
}