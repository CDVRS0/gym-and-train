const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app/page.js'), 'utf8');
const context = vm.createContext({ WATER_GOAL: 2500, STORAGE: 'gym-training-os-v8', Date, console });
vm.runInContext(source.slice(source.indexOf('function dateKey'), source.indexOf('function getRecovery')), context);
const exercise = { name: 'Barbell Bench Press', reps: '6–8', sets: 4 };
const entry = (reps, extra = {}) => ({ id: 'one', exercise: exercise.name, day: 'Chest', date: '2026-10-23', createdAt: '2026-10-23T10:00:00Z', plannedSets: 4, rir: 2, sets: reps.map((r) => ({ done: true, weight: 60, reps: r })), ...extra });
const recommend = (previous, ex = exercise, unit = 'kg') => context.progressionRecommendation(ex, 'Chest', [previous], unit);
test('baseline needs actual history', () => assert.equal(context.progressionRecommendation(exercise, 'Chest', []).nextLoad, null));
test('all planned sets at upper range increase load', () => assert.equal(recommend(entry([8,8,8,8])).nextLoad, 62.5));
test('incomplete workout holds load', () => assert.equal(recommend(entry([8,8,8])).kind, 'hold'));
test('failure effort holds load', () => assert.equal(recommend(entry([8,8,8,8], { rir: 0 })).kind, 'hold'));
test('mixed loads do not promote median load', () => assert.notEqual(recommend(entry([8,8,8,8], { sets: [60,40,40,40].map(weight => ({ done: true, weight, reps: 8 })) })).kind, 'up'));
test('missed minimum reps reduce load', () => assert.equal(recommend(entry([4,4,6,6])).nextLoad, 57));
test('reps in range build before increasing', () => assert.equal(recommend(entry([6,7,8,8])).kind, 'build'));
test('unchecked sets do not contribute to performance', () => assert.equal(recommend(entry([8,8,8,8], { sets: [true,true,true,false].map(done => ({ done, reps: 8, weight: 60 })) })).kind, 'hold'));
test('timed exercise never increases weight', () => assert.notEqual(recommend(entry([30,30,30,30]), { ...exercise, reps: '30 sec' }).kind, 'up'));
test('same-day chronology uses createdAt', () => assert.equal(context.getExerciseHistory([entry([8], { createdAt:'2026-10-23T11:00:00Z', id:'new' }),entry([8])], exercise.name, 'Chest')[0].id, 'new'));
test('pace rounds seconds with minute carry', () => assert.equal(context.formatPace(29.999,5), '6:00'));
test('unit conversion covers history, volume, loads and drafts', () => {
 const initial = { settings:{weightUnit:'kg'}, loads:{Bench:60}, history:[{weight:60,volume:480,sets:[{weight:60}],weights:[60]}], drafts:{Bench:{sets:[{weight:'60'},{weight:''}]}} };
 const converted = context.convertWeightUnit(initial,'lb');
 assert.equal(converted.history[0].weight,132.28);
 assert.equal(converted.loads.Bench,132.28);
 assert.equal(converted.drafts.Bench.sets[0].weight,'132.28');
 assert.equal(converted.drafts.Bench.sets[1].weight,'');
 assert.equal(context.convertWeightUnit(converted,'kg').history[0].weight,60);
});
test('untimed exercise logs count once as a workout', () => {
 const state = { history:[entry([8]), entry([8],{id:'two'})], sessions:[] };
 assert.equal(context.loggedSessions(state).length,1);
 assert.equal(context.loggedSessions(state)[0].duration,0);
});
test('finished timer and linked exercise count once', () => {
 const state = { history:[entry([8],{sessionId:'timer'})], sessions:[{id:'timer',type:'train',name:'Chest',date:'2026-10-23',duration:600}] };
 assert.equal(context.loggedSessions(state).length,1);
 assert.equal(context.loggedSessions(state)[0].duration,600);
});
test('precise cardio time accepts minutes and seconds', () => {
 assert.equal(context.parseCardioDuration('20:02') * 60, 1202);
 assert.equal(context.formatCardioTime(context.parseCardioDuration('20:02')), '20:02');
});
test('long cardio sessions round-trip hours, minutes and seconds', () => {
 assert.equal(context.parseCardioDuration('1:20:02') * 60, 4802);
 assert.equal(context.formatCardioTime(context.parseCardioDuration('1:20:02')), '1:20:02');
 assert.equal(context.formatCardioTime(context.parseCardioDuration('90:02')), '1:30:02');
});
test('invalid and zero time are rejected', () => {
 for (const value of ['', '20.02', '20:60', '1:60:00', '1:20:99', '0:00', '-20:02', '20:2', 'Infinity:00']) assert.equal(context.parseCardioDuration(value), null, value);
});
test('legacy run durations remain minutes and default to run', () => {
 assert.equal(context.formatCardioTime(28.5), '28:30');
 assert.equal(context.cardioActivity({duration:28.5}), 'Run');
 assert.equal(context.cardioSession({id:'old',date:'2026-10-23',duration:28.5}).duration,1710);
});
test('3.66km run keeps exact seconds and pace', () => {
 const duration = context.parseCardioDuration('20:02');
 assert.equal(context.formatPace(duration,3.66), '5:28');
 const session = context.cardioSession({id:'new',date:'2026-10-23',duration,activity:'Run',environment:'Outdoor'});
 assert.equal(session.duration,1202);
 assert.equal(session.name,'Outdoor Run');
 assert.equal(session.type,'run');
});
test('indoor stairmaster can log time and calories without distance', () => {
 const session = context.cardioSession({id:'stairs',date:'2026-10-23',activity:'Stairmaster',environment:'Indoor',duration:15,distance:null,calories:120});
 assert.equal(session.type,'cardio');
 assert.equal(session.name,'Indoor Stairmaster');
 assert.equal(session.duration,900);
});
test('calorie totals omit missing values and retain zero', () => {
 assert.equal(context.cardioCalories([{calories:250},{calories:null},{},{calories:0},{calories:120}]),370);
});
