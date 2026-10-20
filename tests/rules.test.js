// Firestore 규칙 시험 (에뮬레이터 필요): npm i -D @firebase/rules-unit-testing firebase && firebase emulators:exec --only firestore "node tests/rules.test.js"
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'rules-test', firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    await d.doc('users/A').set({ role: 'admin', active: true });
    await d.doc('users/I').set({ role: 'inspector', active: true });
    await d.doc('users/J').set({ role: 'inspector', active: true });
    await d.doc('mbuildings/b1').set({ name: 'x', ly: { inst: {} } });
    await d.doc('mjobs/j1').set({ who: 'I', status: '진행 중', res: {}, jobId: 'j1' });
    await d.doc('mjobs/j2').set({ who: 'J', status: '진행 중', res: {} });
    await d.doc('mjobs/j3').set({ who: 'I', status: '제출됨', res: {} });
  });
  const A = env.authenticatedContext('A').firestore(), I = env.authenticatedContext('I').firestore(), N = env.unauthenticatedContext().firestore();
  const t = [
    ['익명은 읽기 불가', assertFails(N.doc('mbuildings/b1').get())],
    ['점검자: 건물 ly만 수정', assertSucceeds(I.doc('mbuildings/b1').update({ ly: { inst: { a: 1 } } }))],
    ['점검자: 건물 이름 수정 불가', assertFails(I.doc('mbuildings/b1').update({ name: 'y' }))],
    ['점검자: 본인 작업 res 수정', assertSucceeds(I.doc('mjobs/j1').update({ res: { a: 1 } }))],
    ['점검자: 남의 작업 읽기 불가', assertFails(I.doc('mjobs/j2').get())],
    ['점검자: 제출된 작업 수정 불가', assertFails(I.doc('mjobs/j3').update({ res: { a: 2 } }))],
    ['점검자: 작업 담당자 변경 불가', assertFails(I.doc('mjobs/j1').update({ who: 'J' }))],
    ['점검자: 본인 보고서 생성', assertSucceeds(I.doc('mreports/r1').set({ by: 'I' }))],
    ['점검자: 남의 이름으로 보고서 불가', assertFails(I.doc('mreports/r2').set({ by: 'J' }))],
    ['점검자: 보고서 수정 불가', assertFails(I.doc('mreports/r1').update({ sent: true }))],
    ['점검자: 없는 사진 문서 읽기', assertSucceeds(I.doc('mphotos/j1__ext').get())],
    ['점검자: 진행 중 작업 사진 저장', assertSucceeds(I.doc('mphotos/j1__ext').set({ jobId: 'j1', who: 'I', list: [] }))],
    ['점검자: 제출된 작업 사진 저장 불가', assertFails(I.doc('mphotos/j3__ext').set({ jobId: 'j3', who: 'I', list: [] }))],
    ['관리자: 보고서 수정', assertSucceeds(A.doc('mreports/r1').update({ sent: true }))],
    ['점검자: 설정 쓰기 불가', assertFails(I.doc('mmeta/settings').set({ rules: {} }))],
  ];
  let bad = 0;
  for (const [n, p] of t) { try { await p; console.log('PASS', n); } catch (e) { bad++; console.log('FAIL', n, e.message); } }
  await env.cleanup(); process.exit(bad ? 1 : 0);
})();
