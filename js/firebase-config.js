// Firebase Configuration for StudySnap AI
var auth = null;
var database = null;
var googleProvider = null;

var firebaseConfig = {
  apiKey: "AIzaSyA4GAhjXHDiN94Y2otqxd09YHMMASH6qOg",
  authDomain: "study-snap-ai-752f1.firebaseapp.com",
  databaseURL: "https://study-snap-ai-752f1-default-rtdb.firebaseio.com",
  projectId: "study-snap-ai-752f1",
  storageBucket: "study-snap-ai-752f1.firebasestorage.app",
  messagingSenderId: "315205729637",
  appId: "1:315205729637:web:f2ab5c72e245e33893358c"
};

// Initialize Firebase
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    database = firebase.database();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    console.log('Firebase initialized OK');
  } else {
    console.error('Firebase SDK not loaded');
  }
} catch(e) {
  console.error('Firebase init error:', e);
}
