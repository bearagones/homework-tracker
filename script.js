// Import database manager
import db from './db.js';

// DOM Elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    timer: document.getElementById('timer-screen'),
    newUser: document.getElementById('new-user-screen'),
    addAssignment: document.getElementById('add-assignment-screen'),
    addClass: document.getElementById('add-class-screen'),
    settings: document.getElementById('settings-screen'),
    statistics: document.getElementById('statistics-screen'),
    completed: document.getElementById('completed-screen'),
};

const navBtns = {
    home: document.getElementById('nav-home'),
    settings: document.getElementById('nav-settings'),
    back: document.getElementById('nav-back'),
};

const actionBtns = {
    newUser: document.getElementById('new-user-btn'),
    addClass: document.getElementById('add-class-btn'),
    addAssignment: document.getElementById('add-assignment-btn'),
    startStudying: document.getElementById('start-studying-btn'),
    addAssignmentTimer: document.getElementById('add-assignment-btn-timer'),
    completed: document.getElementById('settings-completed-btn'),
};

const forms = {
    newUser: document.getElementById('new-user-form'),
    addAssignment: document.getElementById('add-assignment-form'),
    addClass: document.getElementById('add-class-form'),
    settings: document.getElementById('settings-form'),
};

const assignmentClassSelect = document.getElementById('assignment-class');
const classesContainer = document.getElementById('classes-container');
const currentAssignmentSpan = document.getElementById('current-assignment');

// Timer variables
let timerInterval;
let seconds = 1500; // 25:00 default
let isTimerRunning = false;
let selectedAssignmentId = null;
let pausedTime = null; // Track when timer was paused

// SETTINGS PAGE LOGIC
const settingsScreen = document.getElementById('settings-screen');
const settingsForm = document.getElementById('settings-form');
const settingsName = document.getElementById('settings-name');
const settingsEmail = document.getElementById('settings-email');
const settingsStudyTime = document.getElementById('settings-study-time');
const settingsColorRadios = document.querySelectorAll('input[name="settings-color"]');
const navSettingsBtn = document.getElementById('nav-settings');

// --- Study Time Statistics Page Logic ---
const statisticsScreen = document.getElementById('statistics-screen');
const statisticsSummary = document.getElementById('statistics-summary');
const statisticsChart = document.getElementById('statistics-chart');
const statisticsBtn = document.getElementById('settings-statistics-btn');
const statisticsBackBtn = document.getElementById('statistics-back-btn');

// --- Completed Assignments Page Logic ---
const completedScreen = document.getElementById('completed-screen');
const completedBtn = document.getElementById('settings-completed-btn');
const completedBackBtn = document.getElementById('completed-back-btn');
const completedTbody = document.getElementById('completed-tbody');
const completedFilterCourse = document.getElementById('completed-filter-course');
const completedSort = document.getElementById('completed-sort');

// Store the last set of unique courses to avoid unnecessary repopulation
let lastCompletedCourses = [];

function formatTimeSpent(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    } else {
        return `${minutes}m`;
    }
}

// Helper to set user name in avatar
function setUserAvatarName(name, color) {
    const nameElem = document.getElementById('user-avatar-name');
    if (name && name.trim()) {
        nameElem.textContent = name;
        nameElem.style.display = '';
    } else {
        nameElem.textContent = '';
        nameElem.style.display = 'none';
    }
    // Set avatar color
    const avatarImg = document.getElementById('user-avatar-img');
    if (avatarImg) {
        let colorMap = {
            pink: '#f8bbd0',
            green: '#c8e6c9',
            yellow: '#fff9c4',
            purple: '#e1bee7'
        };
        if (color && colorMap[color]) {
            avatarImg.style.background = colorMap[color];
        } else {
            avatarImg.style.background = '#e3efdd';
        }
        avatarImg.style.border = '2px solid #b6c7b6';
        avatarImg.style.borderRadius = '50%';
    }
}

async function updateUserAvatarFromDB() {
    const users = await db.getAllUsers();
    if (users && users.length > 0) {
        console.log('Setting avatar:', users[0].name, users[0].profile_color);
        setUserAvatarName(users[0].name, users[0].profile_color);
    } else {
        console.log('No user found, clearing avatar');
        setUserAvatarName('', '');
    }
}

// --- Navigation ---
async function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.style.display = 'none');
    screens[screenName].style.display = 'flex';
    localStorage.setItem('lastScreen', screenName);

    // Highlight the correct nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (screenName === 'welcome') {
        document.getElementById('nav-home').classList.add('active');
    } else if (screenName === 'settings') {
        document.getElementById('nav-settings').classList.add('active');
    }

    await updateUserAvatarFromDB();
}

// Sidebar navigation
navBtns.home.addEventListener('click', () => showScreen('welcome'));
// (Settings can be implemented later)

// Main action buttons
actionBtns.newUser.addEventListener('click', () => showScreen('newUser'));
actionBtns.addClass.addEventListener('click', () => showScreen('addClass'));
actionBtns.addAssignment.addEventListener('click', () => showScreen('addAssignment'));
actionBtns.startStudying.addEventListener('click', () => {
    showScreen('timer');
    loadClassesAndAssignments();
});
actionBtns.addAssignmentTimer.addEventListener('click', () => showScreen('addAssignment'));
actionBtns.completed.addEventListener('click', () => showScreen('completed'));

// Refresh button logic: store current screen, then reload
const refreshBtn = document.querySelector('.refresh-btn');
if (refreshBtn) {
    refreshBtn.onclick = function() {
        // Find the currently visible screen
        let currentScreen = 'welcome';
        for (const [key, screen] of Object.entries(screens)) {
            if (screen.style.display !== 'none') {
                currentScreen = key;
                break;
            }
        }
        localStorage.setItem('lastScreen', currentScreen);
        window.location.reload();
    };
}

// --- Timer Logic ---
function updateTimerDisplay() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    document.querySelector('.timer').textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        // If we were paused, calculate the time difference
        if (pausedTime) {
            const timeDiff = Math.floor((Date.now() - pausedTime) / 1000);
            seconds = Math.max(0, seconds - timeDiff);
            pausedTime = null;
        }
        timerInterval = setInterval(async () => {
            if (seconds > 0) {
                seconds--;
            updateTimerDisplay();
                // Increment time spent on selected assignment
                if (selectedAssignmentId) {
                    // Get the assignment, increment time, and update in DB
                    const assignments = await db.getAllAssignments();
                    const found = assignments.find(a => a.id === selectedAssignmentId);
                    if (found) {
                        found.time = (found.time || 0) + 1;
                        found.updatedAt = new Date().toISOString();
                        await db.updateAssignment(found.id, found);
                        // Update the card display
                        updateSelectedAssignment();
                    }
                }
                if (seconds === 0) {
                    stopTimer();
                    showToast('Time is up!', 'success');
                }
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (isTimerRunning) {
    isTimerRunning = false;
    clearInterval(timerInterval);
        pausedTime = Date.now(); // Store when we paused
        showToast('Timer paused. Click play to resume.', 'success');
    }
}

function stopTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    pausedTime = null;
    // Update total time spent for the current assignment
    if (selectedAssignmentId) {
        db.getAllAssignments().then(assignments => {
            const found = assignments.find(a => a.id === selectedAssignmentId);
            if (found) {
                const timeSpent = 1500 - seconds; // Calculate time spent
                found.time = (found.time || 0) + timeSpent;
                found.updatedAt = new Date().toISOString();
                db.updateAssignment(found.id, found).then(() => {
                    updateSelectedAssignment();
                    showToast('Study session ended. Time spent has been recorded.', 'success');
                });
            }
        });
    }
    seconds = 1500; // Reset to 25:00
    updateTimerDisplay();
}

function addTime() {
    seconds += 300; // Add 5 minutes
    updateTimerDisplay();
}

function subtractTime() {
    seconds = Math.max(0, seconds - 300); // Subtract 5 minutes, but not below 0
    updateTimerDisplay();
}

// Add event listeners for timer controls
// If the - button does not exist, add it next to the + button
const timerControls = document.querySelector('.timer-controls');
if (!document.getElementById('subtract-btn')) {
    const subtractBtn = document.createElement('button');
    subtractBtn.className = 'timer-btn';
    subtractBtn.id = 'subtract-btn';
    subtractBtn.innerHTML = '<i class="fas fa-minus"></i>';
    timerControls.appendChild(subtractBtn);
}

document.getElementById('play-btn').addEventListener('click', startTimer);
document.getElementById('pause-btn').addEventListener('click', pauseTimer);
document.getElementById('stop-btn').addEventListener('click', stopTimer);
document.getElementById('add-btn').addEventListener('click', addTime);
document.getElementById('subtract-btn').addEventListener('click', subtractTime);

// --- Form Handling ---
// New User
forms.newUser.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const studyTime = document.getElementById('study-time').value;
    const color = document.querySelector('input[name="color"]:checked')?.value;
    if (!name) {
        showToast('Please enter your name.', 'error');
        return;
    }
    try {
        showSpinner();
        await db.createUser({ name, email, preferred_study_time: studyTime, profile_color: color });
        await showScreen('welcome');
        await updateUserAvatarFromDB();
        this.reset();
        showToast('Profile created successfully!', 'success');
    } catch (error) {
        showToast('Error creating profile. Please try again.', 'error');
    } finally {
        hideSpinner();
    }
});

// Add Class
forms.addClass.addEventListener('submit', async function(e) {
    e.preventDefault();
    const className = document.getElementById('class-name').value;
    const instructorName = document.getElementById('instructor-name').value;
    const classSchedule = document.getElementById('class-schedule').value;
    const color = document.querySelector('input[name="class-color"]:checked')?.value;
    try {
        showSpinner();
        await db.createClass({
            class_name: className,
            course_code: className + '-' + Date.now(), // simple unique code
            instructor_name: instructorName,
            class_schedule: classSchedule,
            class_color: color
        });
        await showScreen('welcome');
        this.reset();
        showToast('Class added successfully!', 'success');
    } catch (error) {
        showToast('Error adding class. Please try again.', 'error');
    } finally {
        hideSpinner();
    }
});

// Default handler for Add Assignment form
async function defaultAddAssignmentHandler(e) {
    e.preventDefault();
    const assignmentTitle = document.getElementById('assignment-title').value;
    const courseCode = assignmentClassSelect.value;
    const dueDate = document.getElementById('due-date').value;
    const priority = document.querySelector('input[name="priority"]:checked')?.value;
    if (!priority) {
        showToast('Please select a priority level.', 'error');
        return;
    }
    try {
        showSpinner();
        await db.createAssignment({
            course_code: courseCode,
            assignment_title: assignmentTitle,
            priority: priority,
            due_date: dueDate,
            time: 0,
            completed: false
        });
        await showScreen('timer');
        loadClassesAndAssignments();
        forms.addAssignment.reset();
        showToast('Assignment added successfully!', 'success');
    } catch (error) {
        showToast('Error adding assignment. Please try again.', 'error');
    } finally {
        hideSpinner();
    }
}

// Always reset handler when opening Add Assignment screen
async function openAddAssignmentScreen() {
    forms.addAssignment.onsubmit = defaultAddAssignmentHandler;
    forms.addAssignment.reset();
    // Fetch latest classes and update dropdown
    const classes = await db.getAllClasses();
    updateAssignmentClassDropdown(classes);
    showScreen('addAssignment');
}
actionBtns.addAssignment.addEventListener('click', openAddAssignmentScreen);
actionBtns.addAssignmentTimer.addEventListener('click', openAddAssignmentScreen);

// --- Dynamic Data Rendering ---
function priorityOrder(priority) {
    if (!priority) return 3;
    const p = priority.toLowerCase();
    if (p === 'high') return 0;
    if (p === 'medium') return 1;
    if (p === 'low') return 2;
    return 3;
}

async function loadClassesAndAssignments() {
    classesContainer.innerHTML = '';
    const [classes, assignments] = await Promise.all([
        db.getAllClasses(),
        db.getAllAssignments()
    ]);
    classes.forEach(cls => {
        // Sort assignments by priority: High, Medium, Low
        const classAssignments = assignments
            .filter(a => a.course_code === cls.course_code && !a.completed) // Only show incomplete assignments
            .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));
        const classCol = document.createElement('div');
        classCol.className = 'class-column';
        // Add delete button to header
        classCol.innerHTML = `<div class="class-header-row" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <h3 style="margin:0;">${cls.class_name}</h3>
            <button class="class-delete-btn" title="Delete Class"><i class="fas fa-trash"></i></button>
        </div>`;
        classAssignments.forEach(assignment => {
            classCol.appendChild(createAssignmentCard(assignment, cls));
        });
        classesContainer.appendChild(classCol);
        // Add event listener for delete button
        const deleteBtn = classCol.querySelector('.class-delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showConfirm(`Are you sure you want to delete the class "${cls.class_name}" and all its assignments?`, async (confirmed) => {
                if (confirmed) {
                    try {
                        showSpinner();
                        await db.deleteClass(cls.course_code);
                        // Delete all assignments for this class
                        const assignmentsToDelete = assignments.filter(a => a.course_code === cls.course_code);
                        for (const a of assignmentsToDelete) {
                            await db.deleteAssignment(a.id);
                        }
                        loadClassesAndAssignments();
                        showToast('Class and its assignments deleted.', 'success');
                    } catch (error) {
                        showToast('Error deleting class.', 'error');
                    } finally {
                        hideSpinner();
                    }
                }
            });
        });
    });
    updateAssignmentClassDropdown(classes);
    updateSelectedAssignment();
}

function updateAssignmentClassDropdown(classes) {
    assignmentClassSelect.innerHTML = '<option value="" disabled selected>Select a class</option>';
    classes.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls.course_code;
        opt.textContent = cls.class_name;
        assignmentClassSelect.appendChild(opt);
    });
}

function createAssignmentCard(assignment, cls) {
    const card = document.createElement('div');
    card.className = `assignment-card${assignment.completed ? ' completed' : ''}`;
    card.setAttribute('data-priority', assignment.priority?.toLowerCase() || 'low');
    card.setAttribute('data-id', assignment.id);
    if (assignment.id === selectedAssignmentId) {
        card.classList.add('selected');
    }
    card.innerHTML = `
        <div class="card-header">
            <span class="class-name">${cls.class_name}</span>
            <span class="instructor">${cls.instructor_name}</span>
        </div>
        <div class="card-body">
            <h4>${assignment.assignment_title}</h4>
            <p class="due-date">Due: ${assignment.due_date}</p>
            <div class="priority ${assignment.priority?.toLowerCase()}">${assignment.priority} Priority</div>
            <div class="time-spent">Time Spent: <span>${formatTimeSpent(assignment.time || 0)}</span></div>
        </div>
        <div class="card-actions">
            <button class="card-btn edit-btn"><i class="fas fa-edit"></i></button>
            <button class="card-btn delete-btn"><i class="fas fa-trash"></i></button>
            <button class="card-btn complete-btn"><i class="far ${assignment.completed ? 'fa-check-square' : 'fa-square'}"></i></button>
        </div>
    `;
    // Assignment selection
    card.addEventListener('click', function(e) {
        // Prevent click on action buttons from selecting
        if (e.target.closest('.card-btn')) return;
        selectedAssignmentId = assignment.id;
        updateSelectedAssignment();
    });
    // Complete button
    card.querySelector('.complete-btn').addEventListener('click', async function(e) {
        e.stopPropagation();
        if (!assignment.completed) {
            // Show confirmation before marking as complete
            showConfirm('Are you sure you want to mark this assignment as complete? It will move to the Completed Assignments screen.', async (confirmed) => {
                if (confirmed) {
                    assignment.completed = true;
                    assignment.completedOn = new Date().toISOString();
                    try {
                        showSpinner();
                        await db.updateAssignment(assignment.id, assignment);
                        loadClassesAndAssignments();
                        showToast('Assignment marked as complete!', 'success');
                    } catch (error) {
                        showToast('Error updating assignment.', 'error');
                    } finally {
                        hideSpinner();
                    }
                }
            });
        } else {
            // Allow unchecking without confirmation
            assignment.completed = false;
            assignment.completedOn = undefined;
            try {
                showSpinner();
                await db.updateAssignment(assignment.id, assignment);
                loadClassesAndAssignments();
                showToast('Assignment marked as incomplete!', 'success');
            } catch (error) {
                showToast('Error updating assignment.', 'error');
            } finally {
                hideSpinner();
            }
        }
    });
    // Delete button
    card.querySelector('.delete-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        showConfirm('Are you sure you want to delete this assignment?', async (confirmed) => {
            if (confirmed) {
                try {
                    showSpinner();
                    await db.deleteAssignment(assignment.id);
                    if (selectedAssignmentId === assignment.id) {
                        selectedAssignmentId = null;
                        updateSelectedAssignment();
                    }
                    loadClassesAndAssignments();
                    showToast('Assignment deleted.', 'success');
                } catch (error) {
                    showToast('Error deleting assignment.', 'error');
                } finally {
                    hideSpinner();
                }
            }
        });
    });
    // Edit button
    card.querySelector('.edit-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        forms.addAssignment.onsubmit = null;
        document.getElementById('assignment-title').value = assignment.assignment_title;
        assignmentClassSelect.value = assignment.course_code;
        document.getElementById('due-date').value = assignment.due_date;
        document.querySelector(`input[name="priority"][value="${assignment.priority}"]`).checked = true;
        showScreen('addAssignment');
        forms.addAssignment.onsubmit = async function(e) {
            e.preventDefault();
            const newPriority = document.querySelector('input[name="priority"]:checked')?.value;
            if (!newPriority) {
                showToast('Please select a priority level.', 'error');
                return;
            }
            assignment.assignment_title = document.getElementById('assignment-title').value;
            assignment.course_code = assignmentClassSelect.value;
            assignment.due_date = document.getElementById('due-date').value;
            assignment.priority = newPriority;
            try {
                showSpinner();
                await db.updateAssignment(assignment.id, assignment);
                await showScreen('timer');
                loadClassesAndAssignments();
                forms.addAssignment.reset();
                forms.addAssignment.onsubmit = defaultAddAssignmentHandler;
                showToast('Assignment updated successfully!', 'success');
            } catch (error) {
                showToast('Error updating assignment.', 'error');
            } finally {
                hideSpinner();
            }
        };
    });
    return card;
}

function updateSelectedAssignment() {
    // Remove .selected from all cards and add to the selected one
    document.querySelectorAll('.assignment-card').forEach(card => {
        if (parseInt(card.getAttribute('data-id')) === selectedAssignmentId) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    // Update the top text
    if (selectedAssignmentId) {
        // Find the assignment title
        db.getAllAssignments().then(assignments => {
            const found = assignments.find(a => a.id === selectedAssignmentId);
            document.getElementById('current-assignment').textContent = found ? found.assignment_title : 'No Assignment Selected';
        });
    } else {
        document.getElementById('current-assignment').textContent = 'No Assignment Selected';
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', async function() {
    const lastScreen = localStorage.getItem('lastScreen');
    if (lastScreen) {
        await showScreen(lastScreen);
        if (lastScreen === 'timer') {
            await loadClassesAndAssignments();
        }
        localStorage.removeItem('lastScreen');
    } else {
        await showScreen('welcome');
    }
    seconds = 1500;
    updateTimerDisplay();
    const classes = await db.getAllClasses();
    updateAssignmentClassDropdown(classes);
    await updateUserAvatarFromDB();
    // Fallback: re-check after 100ms in case IndexedDB was slow
    setTimeout(updateUserAvatarFromDB, 100);
});

// Show Settings page when Settings icon is clicked
navSettingsBtn.addEventListener('click', async () => {
    await showScreen('settings');
    await loadSettingsForm();
});

// Load user data into Settings form
async function loadSettingsForm() {
    const users = await db.getAllUsers();
    if (users && users.length > 0) {
        const user = users[0];
        settingsName.value = user.name || '';
        settingsEmail.value = user.email || '';
        settingsStudyTime.value = user.preferred_study_time || 'morning';
        settingsColorRadios.forEach(radio => {
            radio.checked = (radio.value === user.profile_color);
        });
    }
}

// Save changes to user profile
settingsForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = settingsName.value.trim();
    const email = settingsEmail.value.trim();
    const studyTime = settingsStudyTime.value;
    let color = '';
    settingsColorRadios.forEach(radio => { if (radio.checked) color = radio.value; });
    if (!name || !email || !studyTime || !color) {
        showToast('Please fill out all fields.', 'error');
        return;
    }
    const users = await db.getAllUsers();
    if (users && users.length > 0) {
        const user = users[0];
        const updatedUser = {
            ...user,
            name,
            email,
            preferred_study_time: studyTime,
            profile_color: color
        };
        try {
            showSpinner();
            await db.createUser(updatedUser);
            await updateUserAvatarFromDB();
            showToast('Profile updated successfully!', 'success');
            await showScreen('welcome');
        } catch (error) {
            showToast('Error updating profile.', 'error');
        } finally {
            hideSpinner();
        }
    }
});

// Show statistics page when button is clicked from Settings
statisticsBtn.addEventListener('click', async () => {
    await showScreen('statistics');
    await renderStatisticsPage();
});

// Back to Settings
statisticsBackBtn.addEventListener('click', async () => {
    await showScreen('settings');
    await loadSettingsForm();
});

async function renderStatisticsPage() {
    // Get user and assignments
    const users = await db.getAllUsers();
    const assignments = await db.getAllAssignments();
    const classes = await db.getAllClasses(); // <-- get all classes for mapping
    let user = users && users.length > 0 ? users[0] : null;

    // --- Summary Section ---
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalWeek = 0, totalMonth = 0;
    let dailyTotals = Array(7).fill(0); // Sunday-Saturday
    let allDailyTotals = {}; // For month
    let classTotals = {}; // For class-wise statistics
    let completedCount = 0;
    let totalAssignments = assignments.length;

    assignments.forEach(a => {
        if (a.time && a.time > 0 && a.updatedAt) {
            const updated = new Date(a.updatedAt);
            if (updated >= weekStart) {
                totalWeek += a.time;
                dailyTotals[updated.getDay()] += a.time;
            }
            if (updated >= monthStart) {
                totalMonth += a.time;
                const dayKey = updated.toISOString().slice(0, 10);
                allDailyTotals[dayKey] = (allDailyTotals[dayKey] || 0) + a.time;
            }
            // Track class-wise totals
            classTotals[a.course_code] = (classTotals[a.course_code] || 0) + a.time;
        }
        if (a.completed) completedCount++;
    });

    // Calculate statistics
    const avgDaily = totalWeek / 7;
    const mostProductiveIdx = dailyTotals.indexOf(Math.max(...dailyTotals));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostProductiveDay = daysOfWeek[mostProductiveIdx];
    const completionRate = totalAssignments > 0 ? (completedCount / totalAssignments * 100).toFixed(1) : 0;
    const avgTimePerAssignment = totalAssignments > 0 ? totalMonth / totalAssignments : 0;

    // Create summary cards
    statisticsSummary.innerHTML = `
        <div class="statistics-grid">
            <div class="stat-card">
                <div class="stat-icon">⏰</div>
                <div class="stat-content">
                    <div class="stat-label">Weekly Study Time</div>
                    <div class="stat-value">${formatTimeSpent(totalWeek)}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-label">Monthly Study Time</div>
                    <div class="stat-value">${formatTimeSpent(totalMonth)}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-label">Daily Average</div>
                    <div class="stat-value">${formatTimeSpent(avgDaily)}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                    <div class="stat-label">Completion Rate</div>
                    <div class="stat-value">${completionRate}%</div>
                </div>
            </div>
        </div>
        <div class="statistics-details">
            <div class="detail-row">
                <span class="detail-label">Most Productive Day:</span>
                <span class="detail-value">${mostProductiveDay}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Average Time per Assignment:</span>
                <span class="detail-value">${formatTimeSpent(avgTimePerAssignment)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Preferred Study Time:</span>
                <span class="detail-value">${user ? user.preferred_study_time : '-'}</span>
            </div>
        </div>
    `;

    // --- Weekly Chart ---
    const maxHours = Math.max(...dailyTotals) / 3600 || 1;
    statisticsChart.innerHTML = `
        <div class="chart-container">
            <h3>Weekly Study Time Distribution</h3>
            <div class="chart-bars">
                ${dailyTotals.map((sec, i) => {
                    const hours = sec / 3600;
                    const barHeight = Math.round((hours / maxHours) * 120);
                    const isToday = i === now.getDay();
                    const formatted = formatTimeSpent(sec); // Use improved format
                    return `
                        <div class="chart-bar-container" title="${daysOfWeek[i]}: ${formatted}">
                            <div class="chart-bar ${isToday ? 'today' : ''}" style="height:${barHeight}px">
                                <span class="bar-value">${formatted}</span>
                            </div>
                            <div class="bar-label">${daysOfWeek[i].slice(0,3)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        <div class="class-stats">
            <h3>Study Time by Class</h3>
            <div class="class-stats-grid">
                ${Object.entries(classTotals).map(([code, time]) => {
                    const cls = classes.find(c => c.course_code === code);
                    return `
                        <div class="class-stat-card">
                            <div class="class-name">${cls ? cls.class_name : code}</div>
                            <div class="class-time">${formatTimeSpent(time)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Show completed assignments page when button is clicked from Settings
completedBtn.addEventListener('click', async () => {
    await showScreen('completed');
    await renderCompletedAssignmentsPage();
});

// Back to Settings
completedBackBtn.addEventListener('click', async () => {
    await showScreen('settings');
    await loadSettingsForm();
});

// Filter and sort controls
completedFilterCourse.addEventListener('change', renderCompletedAssignmentsPage);
completedSort.addEventListener('change', renderCompletedAssignmentsPage);

async function renderCompletedAssignmentsPage() {
    // Get all completed assignments
    const assignments = (await db.getAllAssignments()).filter(a => a.completed && a.completedOn);
    const classes = await db.getAllClasses();

    // Helper: map course_code to class_name
    const codeToName = {};
    classes.forEach(cls => { codeToName[cls.course_code] = cls.class_name; });

    // Populate course filter dropdown only if courses changed
    const uniqueCourses = Array.from(new Set(assignments.map(a => a.course_code)));
    const currentValue = completedFilterCourse.value;
    const coursesChanged = uniqueCourses.length !== lastCompletedCourses.length || uniqueCourses.some((c, i) => c !== lastCompletedCourses[i]);
    if (coursesChanged) {
        completedFilterCourse.innerHTML = '<option value="all">All</option>' +
            uniqueCourses.map(code => `<option value="${code}">${codeToName[code] || code}</option>`).join('');
        lastCompletedCourses = uniqueCourses;
    }
    // Restore previous selection if possible
    if (uniqueCourses.includes(currentValue)) {
        completedFilterCourse.value = currentValue;
    } else {
        completedFilterCourse.value = 'all';
    }

    // Filter by course_code
    let filtered = assignments;
    const selectedCourse = completedFilterCourse.value;
    console.log('Selected course for filter:', selectedCourse);
    console.log('Assignment course_codes:', assignments.map(a => a.course_code));
    if (selectedCourse && selectedCourse !== 'all') {
        filtered = filtered.filter(a => {
            const match = a.course_code === selectedCourse;
            if (match) {
                console.log('Matched assignment:', a.assignment_title, a.course_code);
            }
            return match;
        });
    }

    // Always sort by completedOn descending by default
    filtered.sort((a, b) => new Date(b.completedOn) - new Date(a.completedOn));

    // Sort by user selection (if not completion)
    const sortBy = completedSort.value;
    if (sortBy === 'due') {
        filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    } else if (sortBy === 'priority') {
        filtered.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));
    }

    // Render table rows
    completedTbody.innerHTML = filtered.map(a => {
        const priorityClass = a.priority ? `priority-${a.priority.toLowerCase()}` : '';
        return `<tr>
            <td>${a.assignment_title}</td>
            <td>${codeToName[a.course_code] || a.course_code}</td>
            <td>${a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}</td>
            <td>${a.completedOn ? new Date(a.completedOn).toLocaleDateString() : '-'}</td>
            <td class="${priorityClass}">${a.priority || '-'}</td>
        </tr>`;
    }).join('');
}

// Ensure the event handler is only attached once
if (!window.completedFilterCourseHandlerAttached) {
    completedFilterCourse.addEventListener('change', renderCompletedAssignmentsPage);
    window.completedFilterCourseHandlerAttached = true;
}

// --- UI/UX POLISH HELPERS ---
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

function showSpinner() {
    document.getElementById('spinner-overlay').style.display = 'flex';
}
function hideSpinner() {
    document.getElementById('spinner-overlay').style.display = 'none';
}

function showConfirm(message, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    const msg = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    msg.textContent = message;
    overlay.style.display = 'flex';
    function cleanup() {
        overlay.style.display = 'none';
        confirmBtn.removeEventListener('click', onYes);
        cancelBtn.removeEventListener('click', onNo);
    }
    function onYes() { cleanup(); onConfirm(true); }
    function onNo() { cleanup(); onConfirm(false); }
    confirmBtn.addEventListener('click', onYes);
    cancelBtn.addEventListener('click', onNo);
}
