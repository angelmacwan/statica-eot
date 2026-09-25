import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyDvHpz-cpeRbz9C0qq3QmZqcyuk2YtafEs',
	authDomain: 'statica-eot.firebaseapp.com',
	projectId: 'statica-eot',
	storageBucket: 'statica-eot.firebasestorage.app',
	messagingSenderId: '378588634942',
	appId: '1:378588634942:web:c7683ebf5c9a0cbc1c166f',
};

export const app =
	getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
