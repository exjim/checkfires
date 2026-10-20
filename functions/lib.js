'use strict';
// 주소 검색(도로명주소 API)과 건축물대장(건축HUB) 조회. fetch를 주입받아 키 없이도 테스트할 수 있다.
const pad = (v, n) => String(v == null ? 0 : v).padStart(n, '0');
const arr = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? [x] : []);
const HUB = 'https://apis.data.go.kr/1613000/BldRgstHubService/';

async function getJson(fetchFn, url) {
  const r = await fetchFn(url);
  if (!r.ok) throw Object.assign(new Error('upstream HTTP ' + r.status), { status: 502 });
  return r.json();
}

// q: 검색어 → [{road,lot,bd,admCd,lnbrMnnm,lnbrSlno,mtYn}]
async function searchAddress(q, key, fetchFn = fetch) {
  q = String(q || '').trim();
  if (q.length < 2) throw Object.assign(new Error('검색어는 두 글자 이상'), { status: 400 });
  if (!key) throw Object.assign(new Error('JUSO_KEY 미설정'), { status: 500 });
  const u = 'https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=' + encodeURIComponent(key) +
    '&currentPage=1&countPerPage=10&resultType=json&keyword=' + encodeURIComponent(q);
  const j = await getJson(fetchFn, u);
  const c = j.results && j.results.common;
  if (c && c.errorCode !== '0') throw Object.assign(new Error('juso: ' + (c.errorMessage || c.errorCode)), { status: 502 });
  return arr(j.results && j.results.juso).map((x) => ({
    road: x.roadAddr, lot: x.jibunAddr, bd: x.bdNm || '',
    admCd: x.admCd, lnbrMnnm: x.lnbrMnnm, lnbrSlno: x.lnbrSlno, mtYn: x.mtYn,
  }));
}

function hubQuery(op, p, key) {
  const qs = new URLSearchParams({
    serviceKey: key, sigunguCd: String(p.admCd).slice(0, 5), bjdongCd: String(p.admCd).slice(5, 10),
    platGbCd: String(p.mtYn) === '1' ? '1' : '0', bun: pad(p.lnbrMnnm, 4), ji: pad(p.lnbrSlno, 4),
    numOfRows: '200', pageNo: '1', _type: 'json',
  });
  return HUB + op + '?' + qs.toString();
}
function hubItems(j) {
  const h = j.response && j.response.header;
  if (h && h.resultCode && h.resultCode !== '00') {
    throw Object.assign(new Error('hub: ' + (h.resultMsg || h.resultCode)), { status: 502 });
  }
  return arr(j.response && j.response.body && j.response.body.items && j.response.body.items.item);
}

// 표제부 + 층별개요 → 동별 {dong,name,use,heit,floors:[{key,lvl,b,area,use,h}]}
function buildLedger(titles, flrs) {
  const dongs = new Map();
  const get = (d) => { if (!dongs.has(d)) dongs.set(d, { dong: d, name: '', use: '', heit: 0, up: 0, down: 0, f: new Map() }); return dongs.get(d); };
  titles.filter((t) => String(t.mainAtchGbCd) !== '1').forEach((t) => {
    const d = get(t.dongNm || '');
    d.name = t.bldNm || d.name; d.use = t.mainPurpsCdNm || d.use;
    d.heit = Number(t.heit) || d.heit; d.up = Number(t.grndFlrCnt) || d.up; d.down = Number(t.ugrndFlrCnt) || d.down;
  });
  flrs.filter((f) => String(f.mainAtchGbCd) !== '1' && (f.flrGbCdNm === '지상' || f.flrGbCdNm === '지하')).forEach((f) => {
    const d = get(f.dongNm || ''), n = Number(f.flrNo);
    if (!n) return;
    const below = f.flrGbCdNm === '지하', key = below ? 'B' + n : n + 'F';
    const e = d.f.get(key) || { key, lvl: below ? -n : n, b: below, area: 0, uses: new Map() };
    const a = Number(f.area) || 0;
    e.area += a;
    const u = f.etcPurps || f.mainPurpsCdNm || '';
    e.uses.set(u, (e.uses.get(u) || 0) + a);
    d.f.set(key, e);
  });
  return [...dongs.values()].filter((d) => d.f.size).map((d) => {
    const up = d.up || [...d.f.values()].filter((x) => !x.b).length;
    const h = d.heit && up ? Math.round((d.heit / up) * 10) / 10 : 3;
    const floors = [...d.f.values()].sort((a, b) => b.lvl - a.lvl).map((e) => ({
      key: e.key, lvl: e.lvl, b: e.b, area: Math.round(e.area * 100) / 100,
      use: [...e.uses.entries()].sort((a, b) => b[1] - a[1])[0][0], h: Math.min(8, Math.max(2.4, h)),
    }));
    return { dong: d.dong, name: d.name, use: d.use, heit: d.heit, floors };
  });
}

async function ledger(p, key, fetchFn = fetch) {
  if (!key) throw Object.assign(new Error('HUB_KEY 미설정'), { status: 500 });
  if (!p.admCd || String(p.admCd).length !== 10) throw Object.assign(new Error('admCd 필요'), { status: 400 });
  const [t, f] = await Promise.all([
    getJson(fetchFn, hubQuery('getBrTitleInfo', p, key)),
    getJson(fetchFn, hubQuery('getBrFlrOulnInfo', p, key)),
  ]);
  return { buildings: buildLedger(hubItems(t), hubItems(f)) };
}
module.exports = { searchAddress, ledger, buildLedger, hubQuery };
