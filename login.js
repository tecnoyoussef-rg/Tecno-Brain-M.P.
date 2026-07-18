// Auth page logic for login, register, and redirect to members.html
let isLogin = true;

function redirectToMembers() {
    window.location.href = 'members.html';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

function showError(fieldId, message) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function setLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Processing...';
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || btn.textContent;
    }
}

async function saveUserToFirestore(user, name, provider) {
    const userData = {
        uid: user.uid,
        name: name || user.displayName || 'Anonymous',
        email: user.email,
        provider,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active'
    };
    await db.collection('users').doc(user.uid).set(userData, { merge: true });
}

async function handleLogin(e) {
    e.preventDefault();
    clearAllErrors();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email) {
        showError('loginEmailError', 'Please enter your email.');
        return;
    }
    if (!validateEmail(email)) {
        showError('loginEmailError', 'Please enter a valid email address.');
        return;
    }
    if (!password) {
        showError('loginPasswordError', 'Please enter your password.');
        return;
    }
    setLoading('loginBtn', true);
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await saveUserToFirestore(userCredential.user, userCredential.user.displayName || email.split('@')[0], 'email');
        showToast('Login successful!', 'success');
        redirectToMembers();
    } catch (error) {
        console.error('Login error', error);
        if (error.code === 'auth/user-not-found') {
            showError('loginEmailError', 'No account found with this email.');
        } else if (error.code === 'auth/wrong-password') {
            showError('loginPasswordError', 'Incorrect password.');
        } else if (error.code === 'auth/invalid-email') {
            showError('loginEmailError', 'Invalid email address.');
        } else {
            showToast(error.message, 'error');
        }
    } finally {
        setLoading('loginBtn', false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearAllErrors();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    let hasError = false;
    if (!name) {
        showError('registerNameError', 'Please enter your name.');
        hasError = true;
    }
    if (!email) {
        showError('registerEmailError', 'Please enter your email.');
        hasError = true;
    } else if (!validateEmail(email)) {
        showError('registerEmailError', 'Please enter a valid email address.');
        hasError = true;
    }
    if (!password) {
        showError('registerPasswordError', 'Please enter a password.');
        hasError = true;
    } else if (password.length < 6) {
        showError('registerPasswordError', 'Password must be at least 6 characters.');
        hasError = true;
    }
    if (!confirmPassword) {
        showError('registerConfirmError', 'Please confirm your password.');
        hasError = true;
    } else if (password !== confirmPassword) {
        showError('registerConfirmError', 'Passwords do not match.');
        hasError = true;
    }
    if (hasError) return;
    setLoading('registerBtn', true);
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await user.updateProfile({ displayName: name });
        await saveUserToFirestore(user, name, 'email');
        showToast('Account created successfully!', 'success');
        redirectToMembers();
    } catch (error) {
        console.error('Registration error', error);
        if (error.code === 'auth/email-already-in-use') {
            showError('registerEmailError', 'This email is already registered.');
        } else if (error.code === 'auth/invalid-email') {
            showError('registerEmailError', 'Invalid email address.');
        } else if (error.code === 'auth/weak-password') {
            showError('registerPasswordError', 'Password is too weak.');
        } else {
            showToast(error.message, 'error');
        }
    } finally {
        setLoading('registerBtn', false);
    }
}

function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const panelTitle = document.getElementById('panelTitle');
    const panelText = document.getElementById('panelText');
    const panelBtn = document.getElementById('panelBtn');
    isLogin = !isLogin;
    if (isLogin) {
        loginForm.classList.remove('hidden');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        setTimeout(() => registerForm.classList.add('hidden'), 300);
        panelTitle.textContent = 'Welcome Back!';
        panelText.textContent = 'To keep connected with us please login with your personal info';
        panelBtn.textContent = 'Sign In';
    } else {
        registerForm.classList.remove('hidden');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        setTimeout(() => loginForm.classList.add('hidden'), 300);
        panelTitle.textContent = 'Hello, Friend!';
        panelText.textContent = 'Enter your personal details and start your journey with us';
        panelBtn.textContent = 'Sign Up';
    }
}

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    setLoading('loginBtn', true);
    try {
        const result = await auth.signInWithPopup(provider);
        await saveUserToFirestore(result.user, result.user.displayName || 'Google User', 'google');
        showToast('Signed in with Google!', 'success');
        redirectToMembers();
    } catch (error) {
        console.error('Google sign in error', error);
        showToast(error.message, 'error');
    } finally {
        setLoading('loginBtn', false);
    }
}

async function signInWithGithub() {
    const provider = new firebase.auth.GithubAuthProvider();
    setLoading('loginBtn', true);
    try {
        const result = await auth.signInWithPopup(provider);
        await saveUserToFirestore(result.user, result.user.displayName || 'GitHub User', 'github');
        showToast('Signed in with GitHub!', 'success');
        redirectToMembers();
    } catch (error) {
        console.error('GitHub sign in error', error);
        showToast(error.message, 'error');
    } finally {
        setLoading('loginBtn', false);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
        showToast('Please enter your email address first', 'error');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        showToast('Password reset email sent! Check your inbox.', 'success');
    } catch (error) {
        console.error('Reset password error', error);
        showToast(error.message, 'error');
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showToast('Logged out successfully', 'success');
        window.location.href = 'regester.html';
    } catch (error) {
        console.error('Logout error', error);
        showToast(error.message, 'error');
    }
}
