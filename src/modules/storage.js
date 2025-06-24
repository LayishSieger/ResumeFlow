export function initStorage() {
    console.log('Storage module initialized');
    const DB_NAME = 'ResumeFlowDB';
    const RESUME_STORE_NAME = 'resumes';
    const USER_DETAILS_STORE_NAME = 'userDetails';
    let db;

    // Initialize IndexedDB
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 2); // Increment version for schema update

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                if (!db.objectStoreNames.contains(RESUME_STORE_NAME)) {
                    db.createObjectStore(RESUME_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(USER_DETAILS_STORE_NAME)) {
                    db.createObjectStore(USER_DETAILS_STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB initialization failed:', event.target.error);
                reject(event.target.error);
            };
        });
    };

    // Save user details
    const saveUserDetails = async (userDetails) => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([USER_DETAILS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(USER_DETAILS_STORE_NAME);
            const request = store.put({ ...userDetails, id: 1 }); // Single record with fixed ID

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    // Get user details
    const getUserDetails = async () => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([USER_DETAILS_STORE_NAME], 'readonly');
            const store = transaction.objectStore(USER_DETAILS_STORE_NAME);
            const request = store.get(1);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    };

    // Check if user details exist
    const hasUserDetails = async () => {
        const userDetails = await getUserDetails();
        return !!userDetails;
    };

    // Existing methods
    const isDatabaseEmpty = async () => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RESUME_STORE_NAME], 'readonly');
            const store = transaction.objectStore(RESUME_STORE_NAME);
            const request = store.count();

            request.onsuccess = () => resolve(request.result === 0);
            request.onerror = () => reject(request.error);
        });
    };

    // Save a resume
    const saveResume = async (resumeData) => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RESUME_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(RESUME_STORE_NAME);
            const request = store.add(resumeData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    // Get a resume by ID
    const getResumeById = async (id) => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RESUME_STORE_NAME], 'readonly');
            const store = transaction.objectStore(RESUME_STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    // Update resume title
    const updateResumeTitle = async (id, newTitle) => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RESUME_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(RESUME_STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                const resume = request.result;
                if (!resume) return reject(new Error('Resume not found'));
                resume.companyName = newTitle;
                const updateRequest = store.put(resume);

                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            request.onerror = () => reject(request.error);
        });
    };

    // Delete a resume
    const deleteResume = async (id) => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RESUME_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(RESUME_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };

    // Get all resumes
    const getAllResumes = async () => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([RESUME_STORE_NAME], 'readonly');
            const store = transaction.objectStore(RESUME_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    initDB().catch((error) => console.error('Storage initialization failed:', error));

    return {
        saveResume,
        getAllResumes,
        getResumeById,
        deleteResume,
        isDatabaseEmpty,
        updateResumeTitle,
        saveUserDetails,
        getUserDetails,
        hasUserDetails,
    };
}