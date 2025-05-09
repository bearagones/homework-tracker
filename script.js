// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const timerScreen = document.getElementById('timer-screen');
const newUserScreen = document.getElementById('new-user-screen');

const newUserBtn = document.getElementById('new-user-btn');
const addClassBtn = document.getElementById('add-class-btn');
const addAssignmentBtn = document.getElementById('add-assignment-btn');
const startStudyingBtn = document.getElementById('start-studying-btn');

const pauseBtn = document.getElementById('pause-btn');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const addBtn = document.getElementById('add-btn');

const newUserForm = document.getElementById('new-user-form');
const navBtns = document.querySelectorAll('.nav-btn');
const completeButtons = document.querySelectorAll('.complete-btn');
const editButtons = document.querySelectorAll('.edit-btn');
const deleteButtons = document.querySelectorAll('.delete-btn');

// Timer variables
let timerInterval;
let seconds = 0;
let isTimerRunning = false;

// Navigation functions
function showScreen(screen) {
    // Hide all screens
    welcomeScreen.style.display = 'none';
    timerScreen.style.display = 'none';
    newUserScreen.style.display = 'none';
    
    // Show the selected screen
    screen.style.display = 'block';
}

// Event Listeners for navigation
newUserBtn.addEventListener('click', () => showScreen(newUserScreen));
startStudyingBtn.addEventListener('click', () => showScreen(timerScreen));

// Home button functionality
navBtns[0].addEventListener('click', () => showScreen(welcomeScreen));

// Back button functionality
navBtns[2].addEventListener('click', () => {
    // If on timer or new user screen, go back to welcome screen
    if (timerScreen.style.display === 'block' || newUserScreen.style.display === 'block') {
        showScreen(welcomeScreen);
    }
});

// Timer functionality
function updateTimerDisplay() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    document.querySelector('.timer').textContent = formattedTime;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function stopTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    seconds = 0;
    updateTimerDisplay();
}

function addTime() {
    // Add 5 minutes (300 seconds)
    seconds += 300;
    updateTimerDisplay();
}

// Timer button event listeners
playBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
stopBtn.addEventListener('click', stopTimer);
addBtn.addEventListener('click', addTime);

// Assignment card functionality
completeButtons.forEach(button => {
    button.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon.classList.contains('fa-square')) {
            icon.classList.remove('fa-square');
            icon.classList.add('fa-check-square');
            
            // Add completed class to the card
            this.closest('.assignment-card').classList.add('completed');
        } else {
            icon.classList.remove('fa-check-square');
            icon.classList.add('fa-square');
            
            // Remove completed class from the card
            this.closest('.assignment-card').classList.remove('completed');
        }
    });
});

// Delete button functionality
deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this assignment?')) {
            this.closest('.assignment-card').remove();
        }
    });
});

// Edit button functionality
editButtons.forEach(button => {
    button.addEventListener('click', function() {
        const card = this.closest('.assignment-card');
        const assignmentTitle = card.querySelector('.card-body h4').textContent;
        const dueDate = card.querySelector('.due-date').textContent.replace('Due: ', '');
        const priority = card.getAttribute('data-priority');
        
        alert(`Edit functionality would open a form to edit:\n- Title: ${assignmentTitle}\n- Due Date: ${dueDate}\n- Priority: ${priority}`);
    });
});

// New User Form Submission
newUserForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const studyTime = document.getElementById('study-time').value;
    const colorOptions = document.querySelectorAll('input[name="color"]');
    let selectedColor;
    
    for (const option of colorOptions) {
        if (option.checked) {
            selectedColor = option.value;
            break;
        }
    }
    
    // In a real app, we would save this data to a database or localStorage
    console.log('New User Created:', {
        name,
        email,
        studyTime,
        selectedColor
    });
    
    // Update the user avatar name
    document.querySelector('.user-avatar p').textContent = name;
    
    // Show welcome screen after form submission
    showScreen(welcomeScreen);
    
    // Reset form
    this.reset();
    
    // Show success message
    alert('Profile created successfully!');
});

// Add Class button functionality
addClassBtn.addEventListener('click', function() {
    alert('This would open a form to add a new class with fields for class name, instructor, etc.');
});

// Add Assignment button functionality
addAssignmentBtn.addEventListener('click', function() {
    alert('This would open a form to add a new assignment with fields for title, due date, priority, etc.');
});

// Make assignment cards clickable to start studying them
document.querySelectorAll('.assignment-card').forEach(card => {
    card.addEventListener('click', function(e) {
        // Don't trigger if clicking on action buttons
        if (!e.target.closest('.card-actions')) {
            const title = this.querySelector('.card-body h4').textContent;
            document.getElementById('current-assignment').textContent = title;
            showScreen(timerScreen);
            // Reset and start timer
            stopTimer();
            startTimer();
        }
    });
});

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Show welcome screen by default
    showScreen(welcomeScreen);
    
    // Initialize timer display
    updateTimerDisplay();
});
