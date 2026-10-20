const {searchAddress,ledger}=require('./lib');const assert=require('assert');
const J=(o)=>async()=>({ok:true,json:async()=>o});
(async()=>{
 const a=await searchAddress('서현동 88','K',J({results:{common:{errorCode:'0'},juso:[{roadAddr:'성남대로 1',jibunAddr:'경기도 성남시 분당구 서현동 88-2',bdNm:'중앙빌딩',admCd:'4113510300',lnbrMnnm:'88',lnbrSlno:'2',mtYn:'0'}]}}));
 assert.equal(a[0].admCd,'4113510300');
 await assert.rejects(()=>searchAddress('가','K',J({})),/두 글자/);
 await assert.rejects(()=>searchAddress('서현동','K',J({results:{common:{errorCode:'E0001',errorMessage:'승인되지 않은 KEY'}}})),/승인되지/);
 const urls=[];
 const fx=async(u)=>{urls.push(u);const t=u.includes('Title');return{ok:true,json:async()=>({response:{header:{resultCode:'00'},body:{items:{item:t?
  {bldNm:'중앙빌딩',dongNm:'',mainPurpsCdNm:'업무시설',heit:'27.6',grndFlrCnt:'6',ugrndFlrCnt:'2',mainAtchGbCd:'0'}:
  [{flrGbCdNm:'지상',flrNo:'1',area:'300',mainPurpsCdNm:'업무시설',etcPurps:'사무소',mainAtchGbCd:'0'},{flrGbCdNm:'지상',flrNo:'1',area:'220',etcPurps:'로비',mainAtchGbCd:'0'},
   {flrGbCdNm:'지하',flrNo:'1',area:'560',etcPurps:'주차장',mainAtchGbCd:'0'},{flrGbCdNm:'옥탑',flrNo:'1',area:'20',mainAtchGbCd:'0'},{flrGbCdNm:'지상',flrNo:'2',area:'480',etcPurps:'사무소',mainAtchGbCd:'0'}]}}}})}};
 const r=await ledger({admCd:'4113510300',lnbrMnnm:'88',lnbrSlno:'2',mtYn:'0'},'K',fx);
 const b=r.buildings[0];assert.equal(b.use,'업무시설');assert.deepEqual(b.floors.map(f=>f.key),['2F','1F','B1']);
 assert.equal(b.floors[1].area,520);assert.equal(b.floors[1].use,'사무소');assert.equal(b.floors[0].h,4.6);
 assert(urls[0].includes('bun=0088')&&urls[0].includes('ji=0002')&&urls[0].includes('sigunguCd=41135')&&urls[0].includes('bjdongCd=10300'));
 await assert.rejects(()=>ledger({admCd:'1'},'K',fx),/admCd/);
 console.log('server tests ok');
})().catch(e=>{console.error(e);process.exit(1)});
