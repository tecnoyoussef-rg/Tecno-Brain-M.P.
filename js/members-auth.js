// Auth guard and dashboard updater for members.html
const auth = firebase.auth();
const db = firebase.firestore();

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
}

function setUserAvatar(name) {
    const avatar = document.getElementById('userAvatar');
    if (!avatar) return;
    const initials = name
        .split(' ')
        .filter(Boolean)
        .map(word => word[0].toUpperCase())
        .slice(0, 2)
        .join('');
    avatar.textContent = initials || 'U';
}

function populateUserInfo(userData) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const joinDate = document.getElementById('joinDate');
    const totalUsers = document.getElementById('totalUsers');

    if (userName) userName.textContent = userData.name || userData.email || 'Member';
    if (userEmail) userEmail.textContent = userData.email || 'Unknown Email';
    if (joinDate) joinDate.textContent = formatDate(userData.createdAt) || '-';
    if (totalUsers) totalUsers.textContent = userData.totalUsers || '0';
    setUserAvatar(userData.name || userData.email || 'U');
}

async function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading users...</td></tr>';

    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').limit(20).get();
        const rows = [];
        snapshot.forEach(doc => {
            const user = doc.data();
            rows.push(`
                <tr>
                    <td>${user.name || 'Anonymous'}</td>
                    <td>${user.email || '-'}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>${user.provider || 'email'}</td>
                    <td>${user.status || 'active'}</td>
                </tr>
            `);
        });

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
        } else {
            tbody.innerHTML = rows.join('');
        }
    } catch (error) {
        console.error('Failed to load users', error);
        tbody.innerHTML = '<tr><td colspan="5">Unable to load user data.</td></tr>';
    }
}

async function refreshDashboard(user) {
    try {
        const [userDoc, usersSnapshot] = await Promise.all([
            db.collection('users').doc(user.uid).get(),
            db.collection('users').get()
        ]);

        const userData = userDoc.exists ? userDoc.data() : {
            name: user.displayName || user.email,
            email: user.email,
            createdAt: user.metadata ? user.metadata.creationTime : null,
            provider: 'email',
            status: 'active'
        };

        populateUserInfo({
            ...userData,
            totalUsers: usersSnapshot.size
        });
        await loadUsersTable();
    } catch (error) {
        console.error('Dashboard refresh failed', error);
    }
}

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'regester.html';
        return;
    }
    refreshDashboard(user);
});
