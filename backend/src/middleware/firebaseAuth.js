import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();


// Initialize Firebase Admin (make sure env vars or serviceAccount are configured)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const firebaseAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // contains uid
    next();
  } catch (err) {
    console.error('Firebase auth error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export default firebaseAuth;
