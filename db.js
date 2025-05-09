class DatabaseManager {
    constructor() {
        this.dbName = 'homework_tracker';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database connected successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create user store
                if (!db.objectStoreNames.contains('user')) {
                    const userStore = db.createObjectStore('user', { keyPath: 'email' });
                    userStore.createIndex('name', 'name', { unique: false });
                    userStore.createIndex('preferred_study_time', 'preferred_study_time', { unique: false });
                    userStore.createIndex('profile_color', 'profile_color', { unique: false });
                }

                // Create class store
                if (!db.objectStoreNames.contains('class')) {
                    const classStore = db.createObjectStore('class', { keyPath: 'course_code' });
                    classStore.createIndex('class_name', 'class_name', { unique: false });
                    classStore.createIndex('instructor_name', 'instructor_name', { unique: false });
                }

                // Create assignment store
                if (!db.objectStoreNames.contains('assignment')) {
                    const assignmentStore = db.createObjectStore('assignment', { keyPath: 'id', autoIncrement: true });
                    assignmentStore.createIndex('course_code', 'course_code', { unique: false });
                    assignmentStore.createIndex('assignment_title', 'assignment_title', { unique: false });
                    assignmentStore.createIndex('priority', 'priority', { unique: false });
                    assignmentStore.createIndex('due_date', 'due_date', { unique: false });
                    assignmentStore.createIndex('time', 'time', { unique: false });
                }
            };
        });
    }

    // User operations
    async createUser(userData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['user'], 'readwrite');
            const store = transaction.objectStore('user');
            const request = store.put(userData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUser(email) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['user'], 'readonly');
            const store = transaction.objectStore('user');
            const request = store.get(email);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['user'], 'readonly');
            const store = transaction.objectStore('user');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Class operations
    async createClass(classData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['class'], 'readwrite');
            const store = transaction.objectStore('class');
            const request = store.add(classData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllClasses() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['class'], 'readonly');
            const store = transaction.objectStore('class');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteClass(courseCode) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['class'], 'readwrite');
            const store = transaction.objectStore('class');
            const request = store.delete(courseCode);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Assignment operations
    async createAssignment(assignmentData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['assignment'], 'readwrite');
            const store = transaction.objectStore('assignment');
            const request = store.add(assignmentData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllAssignments() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['assignment'], 'readonly');
            const store = transaction.objectStore('assignment');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateAssignment(id, assignmentData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['assignment'], 'readwrite');
            const store = transaction.objectStore('assignment');
            const request = store.put({ ...assignmentData, id });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteAssignment(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['assignment'], 'readwrite');
            const store = transaction.objectStore('assignment');
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Utility functions to view database contents
    async viewAllUsers() {
        try {
            const users = await this.getAllUsers();
            console.table(users);
            return users;
        } catch (error) {
            console.error('Error viewing users:', error);
        }
    }

    async viewAllClasses() {
        try {
            const classes = await this.getAllClasses();
            console.table(classes);
            return classes;
        } catch (error) {
            console.error('Error viewing classes:', error);
        }
    }

    async viewAllAssignments() {
        try {
            const assignments = await this.getAllAssignments();
            console.table(assignments);
            return assignments;
        } catch (error) {
            console.error('Error viewing assignments:', error);
        }
    }

    // Add these methods to the global window object for easy access
    static exposeToWindow() {
        window.db = new DatabaseManager();
        window.viewUsers = () => window.db.viewAllUsers();
        window.viewClasses = () => window.db.viewAllClasses();
        window.viewAssignments = () => window.db.viewAllAssignments();
    }
}

// Create and export a singleton instance
const db = new DatabaseManager();
DatabaseManager.exposeToWindow(); // Expose methods to window object
export default db; 