// User state management
let currentUser = null;
let notes = [];

// Admin credentials
const ADMIN_EMAIL = 'humanezjuan28@gmail.com';
const ADMIN_PASSWORD = 'J2801.000';

// Initialize admin user and notes if not exists
function initializeAdmin() {
    let users = {};
    try {
        users = JSON.parse(localStorage.getItem('users') || '{}');
    } catch (e) {
        users = {};
    }

    // Create admin user if not exists
    if (!users[ADMIN_EMAIL]) {
        users[ADMIN_EMAIL] = {
            name: 'Administrador',
            password: ADMIN_PASSWORD,
            isAdmin: true,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Initialize admin notes if not exists
    if (!localStorage.getItem(`notes_${ADMIN_EMAIL}`)) {
        const adminNotes = [{
            title: 'Bienvenido a Notas',
            content: 'Esta es una nota del administrador que todos los usuarios pueden ver.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isAdminNote: true,
            readOnly: false // Admin should be able to modify their own notes
        }];
        localStorage.setItem(`notes_${ADMIN_EMAIL}`, JSON.stringify(adminNotes));
    }
}

// Initialize users if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({}));
}

// Initialize admin on app start
initializeAdmin();

// Load notes from localStorage based on user
function loadNotes() {
    try {
        if (!currentUser) return;
        
        // Load user's personal notes
        const storedNotes = localStorage.getItem(`notes_${currentUser}`);
        notes = storedNotes ? JSON.parse(storedNotes) : [];

        // If not admin, also load admin's notes
        if (currentUser !== ADMIN_EMAIL) {
            const adminNotes = JSON.parse(localStorage.getItem(`notes_${ADMIN_EMAIL}`)) || [];
            // Add all admin notes that are marked as visible
            const publicAdminNotes = adminNotes.filter(note => note.isAdminNote).map(note => ({
                ...note,
                readOnly: true, // Regular users can't modify admin notes
                isAdminNote: true // Ensure admin note status is preserved
            }));
            notes = [...publicAdminNotes, ...notes];
        }

        displayNotes();
    } catch (error) {
        console.error('Error loading notes:', error);
        notes = [];
    }
}

// Save notes to localStorage for current user
function saveNotes() {
    try {
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        // If admin, save all notes
        if (currentUser === ADMIN_EMAIL) {
            localStorage.setItem(`notes_${currentUser}`, JSON.stringify(notes));
        } else {
            // For regular users, only save their personal notes
            const personalNotes = notes.filter(note => !note.isAdminNote);
            localStorage.setItem(`notes_${currentUser}`, JSON.stringify(personalNotes));
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        alert('Error al guardar las notas. Por favor, intente nuevamente.');
    }
}

// User Authentication Functions
function registerUser(email, password, name) {
    try {
        if (!email || !password || !name) {
            alert('Por favor complete todos los campos.');
            return;
        }

        if (email === ADMIN_EMAIL) {
            alert('Este correo electrónico no está disponible.');
            return;
        }

        // Validate email format
        if (!email.includes('@')) {
            alert('Por favor ingrese un correo electrónico válido.');
            return;
        }

        // Get existing users
        let users = {};
        try {
            users = JSON.parse(localStorage.getItem('users') || '{}');
        } catch (e) {
            localStorage.setItem('users', '{}');
        }
        
        if (users[email]) {
            alert('Este correo electrónico ya está registrado.');
            return;
        }

        // Store user data
        users[email] = {
            password: password,
            name: name,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('users', JSON.stringify(users));
        
        // Initialize empty notes array for new user
        localStorage.setItem(`notes_${email}`, JSON.stringify([]));
        
        alert('Registro exitoso. Por favor inicia sesión.');
        
        // Clear registration form
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        
        // Show login form
        showLoginForm();
    } catch (error) {
        console.error('Error en registro:', error);
        alert('Error en el registro. Por favor, intente nuevamente.');
    }
}

function loginUser(email, password) {
    try {
        if (!email || !password) {
            alert('Por favor ingrese correo y contraseña.');
            return;
        }

        // Get users from localStorage
        let users = {};
        try {
            users = JSON.parse(localStorage.getItem('users') || '{}');
        } catch (e) {
            localStorage.setItem('users', '{}');
            alert('Error al cargar los usuarios. Por favor, intente nuevamente.');
            return;
        }

        const user = users[email];
        
        if (user && user.password === password) {
            currentUser = email;
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('notes-container').classList.remove('hidden');
            document.getElementById('user-email').textContent = `${user.name} (${email})${user.isAdmin ? ' - Administrador' : ''}`;
            
            // Initialize notes array if not exists
            if (!localStorage.getItem(`notes_${email}`)) {
                localStorage.setItem(`notes_${email}`, JSON.stringify([]));
            }
            
            loadNotes();
        } else {
            alert('Credenciales incorrectas.');
        }
    } catch (error) {
        console.error('Error en login:', error);
        alert('Error al iniciar sesión. Por favor, intente nuevamente.');
    }
}

function logoutUser() {
    try {
        currentUser = null;
        notes = [];
        document.getElementById('notes-container').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        
        // Clear login form
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión. Por favor, recarga la página.');
    }
}

function showLoginForm() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const addNoteBtn = document.getElementById('add-note-btn');
const editorModal = document.getElementById('editor-modal');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const filePreviews = document.getElementById('file-previews');
const fileUpload = document.getElementById('file-upload');
const saveNoteBtn = document.getElementById('save-note');
const cancelEditBtn = document.getElementById('cancel-edit');
let currentNoteIndex = null;

// Event Listeners for Authentication
document.getElementById('login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    loginUser(email, password);
});

document.getElementById('register-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    registerUser(email, password, name);
});

document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        logoutUser();
    }
});

// Note Management Functions
function openEditor(index = null) {
    currentNoteIndex = index;
    filePreviews.innerHTML = '';
    
    noteTitle.value = '';
    noteContent.value = '';
    
    if (index !== null) {
        const note = notes[index];
        noteTitle.value = note.title || '';
        noteContent.value = note.content || '';

        // Check if user has edit permissions (admin can edit all, users can edit their own)
        if (currentUser === ADMIN_EMAIL || (!note.isAdminNote && !note.readOnly)) {
            noteTitle.disabled = false;
            noteContent.disabled = false;
            fileUpload.disabled = false;
            saveNoteBtn.style.display = 'block';
        } else {
            noteTitle.disabled = true;
            noteContent.disabled = true;
            fileUpload.disabled = true;
            saveNoteBtn.style.display = 'none';
        }
        
        if (note.files) {
            note.files.forEach(file => {
                addFilePreview(file.name, file.type, file.data);
            });
        }
    } else {
        // New note, enable all fields
        noteTitle.disabled = false;
        noteContent.disabled = false;
        fileUpload.disabled = false;
        saveNoteBtn.style.display = 'block';
    }
    
    editorModal.classList.remove('hidden');
}

function displayNotes() {
    notesGrid.innerHTML = '';
    if (notes.length === 0) {
        notesGrid.innerHTML = `
            <div class="col-span-full text-center text-gray-500 py-8">
                No tienes notas aún. ¡Crea una nueva nota!
            </div>
        `;
        return;
    }

    notes.forEach((note, index) => {
        const noteCard = document.createElement('div');
        noteCard.className = `note-card bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow ${note.isAdminNote ? 'border-2 border-blue-500' : ''}`;
        
        let filesHTML = '';
        if (note.files && note.files.length > 0) {
            filesHTML = note.files.map(file => `
                <div class="border p-2 rounded flex items-center group">
                    <i class="fas fa-file-${file.type === 'pdf' ? 'pdf' : file.type.includes('video') ? 'video' : 'word'} mr-2 text-indigo-600"></i>
                    <span class="truncate flex-grow">${file.name}</span>
                    <button onclick="downloadFile('${file.name}', '${file.type}', '${file.data}')" 
                            class="opacity-0 group-hover:opacity-100 text-indigo-600 hover:text-indigo-800 ml-2 transition-opacity">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `).join('');
        }

        // Admin can always edit their own notes, regular users can only edit their non-admin notes
        const canEdit = currentUser === ADMIN_EMAIL || (!note.isAdminNote);

        noteCard.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-semibold">${note.title || 'Nueva Nota'}</h3>
                ${note.isAdminNote ? '<span class="text-blue-500 text-sm font-medium">Nota del Administrador</span>' : ''}
            </div>
            <div class="text-gray-600 mb-4 whitespace-pre-line">${note.content || 'Sin contenido...'}</div>
            <div class="grid grid-cols-1 gap-2 mb-4">${filesHTML}</div>
            <div class="flex justify-end space-x-2">
                <button onclick="openEditor(${index})" class="text-indigo-600 hover:text-indigo-800 transition-colors">
                    <i class="fas ${canEdit ? 'fa-edit' : 'fa-eye'}"></i>
                </button>
                ${canEdit ? `
                    <button onclick="deleteNote(${index})" class="text-red-600 hover:text-red-800 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        notesGrid.appendChild(noteCard);
    });
}

function deleteNote(index) {
    if (!currentUser) return;
    
    const note = notes[index];

    // Check if user has permission to delete the note
    if (currentUser !== ADMIN_EMAIL && (note.isAdminNote || note.readOnly)) {
        alert('No tienes permiso para eliminar esta nota.');
        return;
    }

    if (confirm('¿Estás seguro de eliminar esta nota?')) {
        try {
            notes.splice(index, 1);
            saveNotes();
            displayNotes();
        } catch (error) {
            console.error('Error al eliminar la nota:', error);
            alert('No se pudo eliminar la nota. Por favor, intente nuevamente.');
        }
    }
}

function addFilePreview(name, type, data) {
    const preview = document.createElement('div');
    preview.className = 'file-preview flex items-center justify-between';
    preview.dataset.base64 = data;
    
    const icon = type === 'pdf' ? 'fa-file-pdf' :
                type.includes('video') ? 'fa-file-video' : 'fa-file-word';
    
    preview.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} text-indigo-600 mr-2"></i>
            <span class="truncate">${name}</span>
        </div>
        ${!noteTitle.disabled ? `
            <button onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800">
                <i class="fas fa-times"></i>
            </button>
        ` : ''}
    `;
    
    filePreviews.appendChild(preview);
}

// Event Listeners for Note Management
saveNoteBtn.addEventListener('click', async () => {
    try {
        if (!currentUser) {
            throw new Error('No user logged in');
        }

        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (!title && !content) {
            alert('Por favor ingresa al menos un título o contenido');
            return;
        }

        const files = Array.from(filePreviews.children).map(preview => ({
            name: preview.querySelector('span').textContent,
            type: preview.querySelector('i').className.includes('pdf') ? 'pdf' : 
                  preview.querySelector('i').className.includes('video') ? 'video' : 'word',
            data: preview.dataset.base64 || ''
        }));

        const note = { 
            title, 
            content, 
            files,
            updatedAt: new Date().toISOString()
        };

        if (currentUser === ADMIN_EMAIL) {
            // For admin users
            if (currentNoteIndex !== null) {
                // When editing existing note
                const existingNote = notes[currentNoteIndex];
                if (existingNote.isAdminNote) {
                    // Keep admin note status if it was already an admin note
                    note.isAdminNote = true;
                    note.readOnly = false; // Admin can always edit their notes
                } else {
                    // Ask if they want to make it visible to all users
                    note.isAdminNote = confirm('¿Deseas que esta nota sea visible para todos los usuarios?');
                    note.readOnly = false;
                }
            } else {
                // For new notes, ask if they want to make it visible
                note.isAdminNote = confirm('¿Deseas que esta nota sea visible para todos los usuarios?');
                note.readOnly = false;
            }
        }

        if (currentNoteIndex !== null) {
            notes[currentNoteIndex] = note;
        } else {
            notes.push(note);
        }

        saveNotes();
        displayNotes();
        editorModal.classList.add('hidden');
        
    } catch (error) {
        console.error('Error al guardar la nota:', error);
        alert('Error al guardar la nota. Por favor, intente nuevamente.');
    }
});

fileUpload.addEventListener('change', (e) => {
    if (noteTitle.disabled) return; // Don't allow file uploads for read-only notes
    
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            addFilePreview(
                file.name,
                file.type.includes('pdf') ? 'pdf' : 
                file.type.includes('video') ? 'video' : 'word',
                event.target.result.split(',')[1]
            );
        };
        reader.readAsDataURL(file);
    });
    fileUpload.value = '';
});

function downloadFile(filename, type, base64Data) {
    try {
        if (!base64Data) {
            throw new Error('El archivo no está disponible localmente');
        }

        const mimeTypes = {
            'pdf': 'application/pdf',
            'video': 'video/mp4',
            'word': 'application/msword'
        };
        
        const link = document.createElement('a');
        link.href = `data:${mimeTypes[type] || 'application/octet-stream'};base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 1000);
    } catch (error) {
        console.error('Error al descargar el archivo:', error);
        alert(error.message || 'Error al descargar el archivo');
    }
}

cancelEditBtn.addEventListener('click', () => {
    editorModal.classList.add('hidden');
});

addNoteBtn.addEventListener('click', () => {
    if (!currentUser) return;
    try {
        currentNoteIndex = null;
        noteTitle.value = '';
        noteContent.value = '';
        filePreviews.innerHTML = '';
        
        // Enable all fields for new notes
        noteTitle.disabled = false;
        noteContent.disabled = false;
        fileUpload.disabled = false;
        saveNoteBtn.style.display = 'block';
        
        editorModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error al abrir el modal:', error);
        alert('Error al abrir el editor. Por favor, intente nuevamente.');
    }
});

// Initialize the application
loadNotes();
