import{c as v,r,j as e,S as N}from"./index-Bo22C5bG.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],D=v("send",S);function R(){const[o,c]=r.useState([{id:1,role:"assistant",content:`안녕하세요! 영양 AI 어시스턴트입니다. 🥗

식단, 영양소, 운동, 건강 관련하여 궁금하신 점이 있으시면 언제든지 물어보세요!`,timestamp:new Date}]),[a,d]=r.useState(""),[i,u]=r.useState(!1),[f,l]=r.useState(!1),m=r.useRef(null),x=r.useRef(null),s=r.useRef(null);r.useEffect(()=>{m.current?.scrollIntoView({behavior:"smooth"})},[o,i]);const b=()=>{l(!0),s.current&&clearTimeout(s.current),s.current=setTimeout(()=>{l(!1)},1e3)},h=()=>{l(!0),s.current&&clearTimeout(s.current)},p=()=>{l(!1)};r.useEffect(()=>()=>{s.current&&clearTimeout(s.current)},[]);const y=t=>{const n=t.toLowerCase();return n.includes("단백질")||n.includes("protein")?`단백질은 근육 성장과 회복에 필수적인 영양소입니다. 💪

성인의 경우 체중 1kg당 0.8~1.2g의 단백질 섭취를 권장하며, 운동을 하시는 분들은 1.2~2.0g까지 섭취하시는 것이 좋습니다.

좋은 단백질 공급원:
• 닭가슴살, 계란
• 그릭요거트, 두부
• 연어, 참치
• 렌틸콩, 병아리콩`:n.includes("칼로리")||n.includes("다이어트")||n.includes("살")?`건강한 체중 감량을 위해서는 하루 칼로리 섭취량을 점진적으로 줄이는 것이 중요합니다. 🎯

권장사항:
• 현재 섭취량에서 300-500kcal 줄이기
• 균형잡힌 영양소 비율 유지
• 주 0.5-1kg 감량 목표
• 충분한 수분 섭취 (하루 2L 이상)

급격한 다이어트보다는 지속 가능한 식습관을 만드는 것이 중요합니다!`:n.includes("운동")||n.includes("헬스")||n.includes("근육")?`규칙적인 운동은 건강한 삶의 핵심입니다! 🏃‍♂️

추천 운동 스케줄:
• 주 3-5회, 30-60분
• 유산소 + 근력 운동 병행
• 운동 전: 가벼운 탄수화물
• 운동 후: 단백질 + 탄수화물

운동 후 30분 이내에 단백질을 섭취하면 근육 회복에 도움이 됩니다.`:n.includes("아침")||n.includes("breakfast")?`건강한 아침 식사는 하루를 시작하는 에너지원입니다! ☀️

추천 아침 메뉴:
• 오트밀 + 베리 + 견과류
• 그릭요거트 + 과일 + 그래놀라
• 통밀빵 + 아보카도 + 계란
• 프로틴 스무디 + 바나나

균형잡힌 탄수화물, 단백질, 지방을 함께 섭취하세요!`:n.includes("물")||n.includes("수분")?`충분한 수분 섭취는 신진대사와 건강에 매우 중요합니다! 💧

수분 섭취 가이드:
• 하루 2-3L 권장
• 운동 시: 추가 500ml-1L
• 아침에 일어나자마자 물 한 잔
• 식사 30분 전 물 마시기

카페인 음료는 이뇨작용이 있으니, 물을 더 마셔주세요!`:n.includes("간식")||n.includes("snack")?`건강한 간식으로 하루 중 에너지를 보충하세요! 🍎

추천 간식:
• 견과류 한 줌 (아몬드, 호두)
• 그릭요거트
• 당근 스틱 + 후무스
• 과일 (사과, 바나나)
• 단백질 바

간식도 하루 총 칼로리에 포함되니, 적당량을 섭취하세요!`:`좋은 질문이네요! 😊

"${t}"에 대해 더 구체적으로 알려드리고 싶은데, 다음 중 어떤 부분이 궁금하신가요?

• 영양소 정보
• 칼로리 계산
• 식단 추천
• 운동 조언

더 자세히 말씀해주시면 맞춤형 답변을 드리겠습니다!`},g=async()=>{if(!a.trim())return;const t={id:Date.now(),role:"user",content:a.trim(),timestamp:new Date};c(n=>[...n,t]),d(""),u(!0),setTimeout(()=>{const n={id:Date.now()+1,role:"assistant",content:y(t.content),timestamp:new Date};c(k=>[...k,n]),u(!1)},1e3+Math.random()*1e3)},w=t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),g())},j=t=>t.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});return e.jsxs("div",{className:"h-full flex flex-col bg-gradient-to-b from-gray-50 to-white",children:[e.jsx("div",{className:"bg-white border-b border-gray-200 shrink-0",children:e.jsxs("div",{className:"px-5 py-4",children:[e.jsxs("div",{className:"flex items-center justify-center gap-2",children:[e.jsx("div",{className:"w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center",children:e.jsx(N,{className:"w-4.5 h-4.5 text-white"})}),e.jsx("h1",{className:"text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent",children:"AI 어시스턴트"})]}),e.jsx("p",{className:"text-xs text-gray-500 text-center mt-1",children:"영양, 식단, 운동에 대해 무엇이든 물어보세요"})]})}),e.jsxs("div",{className:`flex-1 overflow-y-auto px-5 py-5 space-y-4 transition-all ${f?"[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:opacity-100":"[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:opacity-0"} [&::-webkit-scrollbar-thumb]:transition-opacity [&::-webkit-scrollbar-thumb]:duration-300`,ref:m,onScroll:b,onMouseEnter:h,onMouseLeave:p,children:[o.map(t=>e.jsx("div",{className:`flex ${t.role==="user"?"justify-end":"justify-start"}`,children:e.jsxs("div",{className:`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${t.role==="user"?"bg-green-500 text-white":"bg-gradient-to-br from-white to-gray-50/50 text-gray-900 border border-gray-100/50"}`,children:[e.jsx("p",{className:"text-sm leading-relaxed whitespace-pre-wrap",children:t.content}),e.jsx("p",{className:`text-[10px] mt-1 ${t.role==="user"?"text-green-100":"text-gray-400"}`,children:j(t.timestamp)})]})},t.id)),i&&e.jsx("div",{className:"flex justify-start",children:e.jsx("div",{className:"bg-gradient-to-br from-white to-gray-50/50 rounded-2xl px-4 py-3 shadow-sm border border-gray-100/50",children:e.jsxs("div",{className:"flex gap-1",children:[e.jsx("div",{className:"w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce",style:{animationDelay:"0ms"}}),e.jsx("div",{className:"w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce",style:{animationDelay:"150ms"}}),e.jsx("div",{className:"w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce",style:{animationDelay:"300ms"}})]})})})]}),e.jsx("div",{className:"bg-white border-t border-gray-200 px-5 py-3 shrink-0",children:e.jsxs("div",{className:"flex items-end gap-2.5",children:[e.jsx("textarea",{ref:x,value:a,onChange:t=>d(t.target.value),onKeyDown:w,placeholder:"메시지를 입력하세요...",rows:1,className:"flex-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none max-h-32 overflow-y-auto",style:{minHeight:"44px",height:"auto"},onInput:t=>{const n=t.target;n.style.height="auto",n.style.height=`${Math.min(n.scrollHeight,128)}px`}}),e.jsx("button",{onClick:g,disabled:!a.trim()||i,className:"w-11 h-11 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:bg-green-600 transition-colors",children:e.jsx(D,{className:"w-5 h-5 text-white"})})]})})]})}export{R as default};
