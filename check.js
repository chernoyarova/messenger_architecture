#!/usr/bin/env node
/* Проверка целостности данных тренажёра. Запуск: node check.js
   Ловит битые ссылки между курсом, тестами, карточками, картой и уровнями игры. */
'use strict';
const fs = require('fs'), path = require('path');

const window = {};
for (const f of ['questions.js', 'course.js', 'tests.js', 'mapdata.js'])
  eval(fs.readFileSync(path.join(__dirname, 'Public', f), 'utf8'));

const COURSE = window.COURSE, TESTS = window.TESTS, Q = window.QUESTIONS, MD = window.MAPDATA;
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);

/* ---- 1. Курс ---- */
const partSecs = [];
COURSE.parts.forEach(p => p.secs.forEach(s => partSecs.push(String(s))));
partSecs.forEach(s => { if (!COURSE.sections[s]) err(`Курс: раздел ${s} есть в parts, но нет в sections`); });
Object.keys(COURSE.sections).forEach(s => {
  if (!partSecs.includes(s)) warn(`Курс: раздел ${s} есть в sections, но не входит ни в одну часть`);
  const sec = COURSE.sections[s];
  if (!sec.title || !sec.md) err(`Курс: раздел ${s} без title или md`);
});
(COURSE.refs || []).forEach(r => { if (!r.id || !r.title || !r.md) err(`Справка: запись без id/title/md: ${JSON.stringify(r).slice(0, 60)}`); });
if (!COURSE.partsIntro || COURSE.partsIntro.length !== COURSE.parts.length)
  err(`Курс: partsIntro (${(COURSE.partsIntro || []).length}) не совпадает с числом частей (${COURSE.parts.length}) — вводная «О курсе» потеряет описания`);

/* ---- 2. Тесты ---- */
partSecs.forEach(s => {
  const t = TESTS[s];
  if (!t || !t.length) { err(`Тесты: нет теста для раздела ${s}`); return; }
  if (t.length !== 6) warn(`Тесты: раздел ${s} — ${t.length} вопросов (обычно 6)`);
  t.forEach((q, i) => {
    if (!q.q) err(`Тесты ${s} #${i + 1}: пустой вопрос`);
    if (!Array.isArray(q.opts) || q.opts.length < 2) err(`Тесты ${s} #${i + 1}: меньше двух вариантов ответа`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= (q.opts || []).length)
      err(`Тесты ${s} #${i + 1}: correct=${q.correct} вне диапазона вариантов`);
    if (!q.exp) warn(`Тесты ${s} #${i + 1}: нет пояснения exp`);
  });
});
Object.keys(TESTS).forEach(s => { if (!partSecs.includes(s)) warn(`Тесты: есть тест для раздела ${s}, которого нет в курсе`); });

/* ---- 3. Карточки ---- */
const seenKeys = new Set();
Q.forEach((c, i) => {
  if (!c.q || !c.a) err(`Карточки #${i}: пустой вопрос или ответ`);
  const k = c.sec + '|' + c.q; // тот же ключ, что у SR-прогресса в app.js
  if (seenKeys.has(k)) err(`Карточки: дубликат в разделе ${c.sec}: «${String(c.q).slice(0, 60)}…» — сломает ключи прогресса`);
  seenKeys.add(k);
  if (!partSecs.includes(String(c.sec))) warn(`Карточки #${i}: раздел ${c.sec} не найден в курсе`);
  if (!c.secTitle || !c.courseFile) warn(`Карточки #${i} (раздел ${c.sec}): нет secTitle или courseFile`);
});
partSecs.forEach(s => { if (!Q.some(c => String(c.sec) === s)) warn(`Карточки: у раздела ${s} нет ни одной карточки`); });

/* ---- 4. Карта ---- */
const nodeIds = new Set(Object.keys(MD.NODES));
const linkIds = new Set();
MD.LINKS.forEach(l => {
  if (linkIds.has(l.id)) err(`Карта: дубликат id связи ${l.id}`);
  linkIds.add(l.id);
  [l.a[0], l.b[0]].forEach(n => { if (!nodeIds.has(n)) err(`Карта: связь ${l.id} ссылается на несуществующий узел ${n}`); });
});
nodeIds.forEach(n => { if (!MD.INFO[n]) err(`Карта: узел ${n} без описания в INFO`); });
Object.keys(MD.INFO).forEach(n => { if (!nodeIds.has(n)) warn(`Карта: INFO для несуществующего узла ${n}`); });
nodeIds.forEach(n => { if (!MD.LAYER_NAME[MD.NODES[n].layer]) err(`Карта: у узла ${n} неизвестный слой ${MD.NODES[n].layer}`); });
MD.SCENARIOS.forEach(s => {
  if (!MD.CAT_ORDER.includes(s.cat)) err(`Сценарий ${s.id}: категория «${s.cat}» не в CAT_ORDER`);
  if (!s.steps || !s.steps.length) err(`Сценарий ${s.id}: нет шагов`);
  (s.steps || []).forEach((st, i) => {
    (st.nodes || []).forEach(n => { if (!nodeIds.has(n)) err(`Сценарий ${s.id}, шаг ${i + 1}: узел ${n} не существует`); });
    (st.links || []).forEach(l => { if (!linkIds.has(l)) err(`Сценарий ${s.id}, шаг ${i + 1}: связь ${l} не существует`); });
    if (!st.cap) warn(`Сценарий ${s.id}, шаг ${i + 1}: нет подписи cap`);
  });
});

/* ---- 5. Уровни игры «Собери схему» ---- */
const usedInLevels = new Set();
(MD.LEVELS || []).forEach(lv => {
  if (!lv.id || !lv.name || !lv.desc) err(`Уровень ${lv.id || '?'}: нет id/name/desc`);
  (lv.add || []).forEach(n => {
    if (!nodeIds.has(n)) err(`Уровень ${lv.id}: узел ${n} не существует на карте`);
    if (usedInLevels.has(n)) err(`Уровень ${lv.id}: узел ${n} уже добавлен в более раннем уровне`);
    usedInLevels.add(n);
  });
});
nodeIds.forEach(n => { if (!usedInLevels.has(n)) warn(`Узел ${n} не входит ни в один уровень игры`); });

/* ---- итог ---- */
const secCount = Object.keys(COURSE.sections).length;
const testCount = Object.values(TESTS).reduce((a, t) => a + t.length, 0);
console.log(`Данные: ${secCount} разделов · ${testCount} тестовых вопросов · ${Q.length} карточек · ${nodeIds.size} узлов · ${MD.LINKS.length} связей · ${MD.SCENARIOS.length} сценариев · ${(MD.LEVELS || []).length} уровней`);
warns.forEach(w => console.log('⚠  ' + w));
if (errors.length) {
  errors.forEach(e => console.error('✗  ' + e));
  console.error(`\n${errors.length} ошибок, ${warns.length} предупреждений`);
  process.exit(1);
}
console.log(`✓ Ошибок нет (${warns.length} предупреждений)`);
