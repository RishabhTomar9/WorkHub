import admin from 'firebase-admin';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // attach decoded user info
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Unauthorized' });
  }
};
