// Firebase compat initialization for auth and Firestore
const firebaseConfig = {
    apiKey: "AIzaSyCVh_MNxr4gjP-jBRk_GdOWonnMRgJ95tQ",
    authDomain: "yrg-web.firebaseapp.com",
    projectId: "yrg-web",
    storageBucket: "yrg-web.firebasestorage.app",
    messagingSenderId: "502150301286",
    appId: "1:502150301286:web:beb3f33c80fa5fe9350fa7",
    measurementId: "G-YNEWQRFVKJ"
};

if (!window.firebase) {
    throw new Error('Firebase SDK not loaded. Please include firebase-app-compat.js before js/firebase-config.js');
}

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
