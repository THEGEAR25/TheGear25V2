// --- PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT URL HERE ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2cf39XLv-kCMtt8YfKHXZ9CBpiI7AKMdXFeNkI7lEfYImWzWdTF5QiAWZelexD_5s/exec'; // Make sure this is your latest URL!

// --- Data from your C# app ---
const programs = [
    // Graduate School
    "Doctor of Philosophy Major in Technology Education Management",
    "Master of Arts in Language and Literacy Education",
    "Master of Arts in Education",
    "Master in Technician Education",
    // COLLEGE OF ENGINEERING
    "Bachelor of Science in Mechanical Engineering",
    "Bachelor of Science in Electrical Engineering",
    "Bachelor of Science in Industrial Engineering",
    // COLLEGE OF EDUCATION ARTS AND SCIENCES
    "Bachelor of Secondary Education Major in English, SECTION A",
    "Bachelor of Secondary Education Major in English, SECTION B",
    "Bachelor of Secondary Education Major in Mathematics",
    "Bachelor of Secondary Education Major in Social Studies",
    "Bachelor of Secondary Education Major in Filipino",
    "Bachelor of Technical-Vocational Teacher Education Major in Automotive Technology",
    "Bachelor of Technical-Vocational Teacher Education Major in Electronics Technology",
    "Bachelor of Technical-Vocational Teacher Education Major in Food and Service Management",
    "Bachelor of Technical-Vocational Teacher Education Major in Garments, Fashion and Design",
    // COLLEGE OF TECHNOLOGY
    "Bachelor in Food Processing and Service Technology",
    "Bachelor of Industrial Technology (BIT, SECTION A)",
    "Bachelor of Industrial Technology (BIT, SECTION B)",
    "Bachelor of Industrial Technology (BIT, SECTION C)",
    "Diploma in Automotive Technology",
    "Diploma in Civil Technology",
    "Diploma in Electrical Technology",
    "Diploma in Electronics Technology",
    "Diploma in Heating, Ventilating & Air-conditioning Technology",
    "Diploma in Mechanical Technology",
    "Diploma in Welding and Fabrication Technology",
    "Bachelor of Technology Major in Mechanical Technology",
    "Bachelor of Technology Major in Electrical Technology",
    "Bachelor of Technology Major in Electronics Technology",
    "Bachelor of Technology Major in Civil Technology",
    "Bachelor of Technology Major in Heating, Ventilating & Air-conditioning Technology",
    "Bachelor of Technology Major in Welding & Fabrication Technology"
];

// --- Barangay list has been removed ---

const programLogos = {
    'Graduate School': 'Logos/grad.png',
    'College of Engineering': 'Logos/eng.png',
    'College of Education, Arts, and Sciences': 'Logos/edu.png',
    'College of Technology': 'Logos/tech.png'
};

// --- This targets the logo next to the dropdown ---
const programLogo = document.getElementById('program-logo');

// --- Main Form Elements ---
const formContainer = document.getElementById('form-container');
const form = document.getElementById('yearbook-form');
const programSelect = document.getElementById('program');
const monthSelect = document.getElementById('b_month');
const daySelect = document.getElementById('b_day');
const yearSelect = document.getElementById('b_year');

// --- Review Panel Elements ---
const reviewContainer = document.getElementById('review-container');
const reviewContent = document.getElementById('review-content');
const editButton = document.getElementById('btn-edit');
const confirmButton = document.getElementById('btn-confirm');

// --- Success Panel Elements ---
const successContainer = document.getElementById('success-container');
const newFormButton = document.getElementById('btn-new-form');
const loader = document.getElementById('loader');

// --- NEW MODAL ELEMENTS ---
const privacyModal = document.getElementById('privacy-modal');
const modalAcceptBtn = document.getElementById('modal-accept-btn');

// --- Form Data Cache ---
let formData = {};

// --- Helper Functions ---

// (Ported from C#)
function getCollegeCategory(programName) {
    if (!programName) return 'Default';
    if (programName.includes("Doctor") || programName.includes("Master")) {
        return "Graduate School";
    }
    if (programName.includes("Engineering")) {
        return "College of Engineering";
    }
    if (programName.includes("Education") || programName.includes("Arts") ||
        programName.includes("Philosophy") || programName.includes("Language") ||
        programName.includes("Secondary Education") || programName.includes("Teacher Education")) {
        return "College of Education, Arts, and Sciences";
    }
    return "College of Technology";
}

// (Ported from C#)
function smartCapitalize(text) {
    if (!text) return "";
    let formatted = text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    
    // Handle "Mc" and "Mac"
    formatted = formatted.replace(/\bMc(\w)/g, (match, p1) => "Mc" + p1.toUpperCase());
    formatted = formatted.replace(/\bMac(\w)/g, (match, p1) => "Mac" + p1.toUpperCase());
    
    // Handle Roman numerals
    const romans = ["Ii", "Iii", "Iv", "Vi", "Vii", "Viii"];
    romans.forEach(roman => {
        formatted = formatted.replace(new RegExp(`\\b${roman}\\b`, 'g'), roman.toUpperCase());
    });
    
    // Handle particles
    const particles = ["De", "La", "Del", "Dos", "Van", "Von", "Dela"];
    particles.forEach(part => {
        formatted = formatted.replace(new RegExp(`\\s${part}\\s`, 'g'), ` ${part.toLowerCase()} `);
    });
    
    return formatted;
}

// --- Form Initialization ---
function populatePrograms() {
    programs.forEach(p => {
        const option = new Option(p, p);
        programSelect.add(option);
    });
}

function populateBirthday() {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        const option = new Option(month, index + 1);
        monthSelect.add(option);
    });

    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 15; y >= currentYear - 45; y--) {
        const option = new Option(y, y);
        yearSelect.add(option);
    }
}

function updateDays() {
    const month = monthSelect.value;
    const year = yearSelect.value || new Date().getFullYear();
    let daysInMonth = 31;

    if (month && year) {
        daysInMonth = new Date(year, month, 0).getDate();
    }

    const selectedDay = daySelect.value;
    daySelect.innerHTML = '<option value="">Day</option>'; // Clear old days
    for (let d = 1; d <= daysInMonth; d++) {
        const option = new Option(d, d);
        daySelect.add(option);
    }

    if (selectedDay <= daysInMonth) {
        daySelect.value = selectedDay;
    }
}

// This is the logo function for the dropdown
function updateCollegeLogo() {
    const category = getCollegeCategory(programSelect.value);
    const logoPath = programLogos[category];

    if (logoPath) {
        // If we have a logo, set its path and make it visible
        programLogo.src = logoPath;
        programLogo.style.visibility = 'visible';
    } else {
        // If no program is selected, hide it
        programLogo.src = ""; // Clear the src
        programLogo.style.visibility = 'hidden';
    }
}

// --- Form Logic ---

// This function shows the review panel
function showReviewPanel() {
    // 1. Get all data from the form
    const data = new FormData(form);
    formData = {}; // Clear previous data
    reviewContent.innerHTML = ''; // Clear review panel
    
    const fieldLabels = {
        fullName: "Full Name", program: "Program",
        b_month: "Birthday", address: "Address",
        fathersName: "Father's Name", mothersName: "Mother's Name", spousesName: "Spouse's Name",
        thesis: "Thesis/Project", ojt1: "OJT 1", ojt2: "OJT 2",
        org1: "Org 1", org2: "Org 2", org3: "Org 3", org4: "Org 4", org5: "Org 5",
        award1: "Award 1", award2: "Award 2", award3: "Award 3", award4: "Award 4", award5: "Award 5",
        guidingPrinciple: "Guiding Principle"
    };

    // 2. Apply smart capitalization
    data.set('fullName', smartCapitalize(data.get('fullName')));
    data.set('fathersName', smartCapitalize(data.get('fathersName')));
    data.set('mothersName', smartCapitalize(data.get('mothersName')));
    data.set('spousesName', smartCapitalize(data.get('spousesName')));
    
    // 3. Build the review panel
    for (let [key, value] of data.entries()) {
        if (key === 'b_day' || key === 'b_year') continue; // Skip, handled by month
        
        let label = fieldLabels[key] || key;
        let displayValue = value;

        if (key === 'b_month') {
            const monthName = monthSelect.options[monthSelect.selectedIndex].text;
            let day = data.get('b_day');
            let year = data.get('b_year');
            
            // Handle case where user didn't select a date
            if (monthName === "Month" || !day || !year) {
                displayValue = ""; // Show as blank
            } else {
                displayValue = `${monthName} ${day}, ${year}`;
            }
            formData['birthday'] = displayValue; // Combine for submission
        } else {
            formData[key] = value; // Add to submission object
        }

        // This creates an item for every field, even empty ones
        const item = document.createElement('div');
        item.className = 'review-item';
        if (key === 'guidingPrinciple') item.className += ' full-width';
        
        // Use (displayValue || '') to show a blank space
        item.innerHTML = `<strong>${label}:</strong> <span>${displayValue || ''}</span>`;
        reviewContent.appendChild(item);
    }

    // 4. Show/Hide panels
    formContainer.style.display = 'none';
    reviewContainer.style.display = 'block';
    window.scrollTo(0, 0);
}

function handleFormSubmit(e) {
    e.preventDefault();
    showReviewPanel();
}

function editDetails() {
    reviewContainer.style.display = 'none';
    formContainer.style.display = 'block';
}

// --- THIS IS THE UPDATED FUNCTION WITH THE DUPLICATE CHECK ---
async function confirmAndSubmit() {
    loader.style.display = 'block';
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // Required for cross-origin
            headers: {
                'Content-Type': 'text/plain', // Apps Script needs text/plain for POST
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        // --- THIS IS THE UPDATED PART ---

        if (result.status === 'success') {
            // This is the normal success path
            reviewContainer.style.display = 'none';
            successContainer.style.display = 'block';
            window.scrollTo(0, 0);
            form.reset(); // Clear the form
            updateCollegeLogo(); // Reset logo
            updateDays(); // Reset days
            
        } else if (result.status === 'duplicate') {
            // --- THIS IS THE NEW DUPLICATE CHECK ---
            // Show an alert to the user
            alert('Submission Failed: This name is already registered.\n\nPlease check the spelling or contact the admin.');
            // Send the user back to the form to edit
            editDetails();

        } else {
            // This handles any other errors
            throw new Error(result.message || 'Unknown error');
        }
        // --- END OF UPDATED PART ---

    } catch (error) {
        console.error('Submission Error:', error);
        alert(`Submission Failed: ${error.message}\n\nPlease check your internet connection or contact the admin.`);
    } finally {
        loader.style.display = 'none'; // This will now run for all cases
    }
}

function showNewForm() {
    successContainer.style.display = 'none';
    formContainer.style.display = 'block';
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    populatePrograms();
    populateBirthday();
});

form.addEventListener('submit', handleFormSubmit);
editButton.addEventListener('click', editDetails);
confirmButton.addEventListener('click', confirmAndSubmit);
newFormButton.addEventListener('click', showNewForm);

monthSelect.addEventListener('change', updateDays);
yearSelect.addEventListener('change', updateDays);
programSelect.addEventListener('change', updateCollegeLogo);

// --- NEW EVENT LISTENER FOR THE MODAL ---
modalAcceptBtn.addEventListener('click', () => {
    privacyModal.style.display = 'none';
});

// Add smart capitalization on 'blur' (like C# 'Leave' event)
document.getElementById('fullName').addEventListener('blur', (e) => e.target.value = smartCapitalize(e.target.value));
document.getElementById('fathersName').addEventListener('blur', (e) => e.target.value = smartCapitalize(e.target.value));
document.getElementById('mothersName').addEventListener('blur', (e) => e.target.value = smartCapitalize(e.target.value));
document.getElementById('spousesName').addEventListener('blur', (e) => e.target.value = smartCapitalize(e.target.value));