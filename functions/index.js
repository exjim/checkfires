'use strict';
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { searchAddress, ledger } = require('./lib');

if (!admin.apps.length) admin.initializeApp();
const JUSO_KEY = defineSecret('JUSO_KEY');
const HUB_KEY = defineSecret('HUB_KEY');

// 로그인한 사용자 중 사용 중인 관리자·점검자만 허용 (users/{uid}.active, role)
async function allowed(req) {
  const m = /^Bearer (.+)$/.exec(req.get('Authorization') || '');
  if (!m) return false;
  try {
    const t = await admin.auth().verifyIdToken(m[1]);
    const d = await admin.firestore().collection('users').doc(t.uid).get();
    const u = d.exists ? d.data() : null;
    return !!(u && u.active === true && (u.role === 'admin' || u.role === 'inspector'));
  } catch (e) { return false; }
}
const wrap = (fn) => async (req, res) => {
  try {
    if (!(await allowed(req))) return res.status(401).json({ error: '로그인이 필요합니다.' });
    res.set('Cache-Control', 'private, max-age=300').json(await fn(req));
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
};
const opt = { region: 'asia-northeast3', maxInstances: 5 };
exports.addr = onRequest({ ...opt, secrets: [JUSO_KEY] }, wrap((req) => searchAddress(req.query.q, JUSO_KEY.value())));
exports.ledger = onRequest({ ...opt, secrets: [HUB_KEY] }, wrap((req) => ledger(req.query, HUB_KEY.value())));
