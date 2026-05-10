import './_load-env';
import { supabase } from '../lib/supabase';
import * as crypto from 'node:crypto';
import { loadSessionContext } from '../lib/sessionContext';
import { formatSessionContext } from '../lib/formatSessionContext';

const ids: {
  college: string | null;
  cohort: string | null;
  track: string | null;
  session: string | null;
} = { college: null, cohort: null, track: null, session: null };

async function main() {
  // 1. college
  const college = await supabase
    .from('colleges')
    .insert({ name: 'GRD College of Science', city: 'Coimbatore' })
    .select()
    .single();
  if (college.error || !college.data) {
    throw new Error(`college insert: ${college.error?.message ?? 'no row'}`);
  }
  ids.college = college.data.id;

  // 2. cohort
  const cohort = await supabase
    .from('cohorts')
    .insert({ college_id: ids.college, name: 'GRD Spring 2026' })
    .select()
    .single();
  if (cohort.error || !cohort.data) {
    throw new Error(`cohort insert: ${cohort.error?.message ?? 'no row'}`);
  }
  ids.cohort = cohort.data.id;

  // 3. track
  const track = await supabase
    .from('tracks')
    .insert({ cohort_id: ids.cohort, name: 'Blockchain Foundations', total_sessions: 6 })
    .select()
    .single();
  if (track.error || !track.data) {
    throw new Error(`track insert: ${track.error?.message ?? 'no row'}`);
  }
  ids.track = track.data.id;

  // 4. session
  const session = await supabase
    .from('sessions')
    .insert({
      track_id: ids.track,
      session_number: 1,
      date: new Date().toISOString(),
      topic: 'What is blockchain?',
    })
    .select()
    .single();
  if (session.error || !session.data) {
    throw new Error(`session insert: ${session.error?.message ?? 'no row'}`);
  }
  ids.session = session.data.id;

  // 5. read back with full join up the hierarchy
  const joined = await supabase
    .from('sessions')
    .select(
      `id, session_number, date, topic,
       track:tracks!inner (
         id, name, total_sessions,
         cohort:cohorts!inner (
           id, name,
           college:colleges!inner ( id, name, city )
         )
       )`,
    )
    .eq('id', ids.session)
    .single();
  if (joined.error || !joined.data) {
    throw new Error(`session join: ${joined.error?.message ?? 'no row'}`);
  }

  console.log('Joined session row:');
  console.log(JSON.stringify(joined.data, null, 2));

  // 6. loadSessionContext: happy path
  if (!ids.session) throw new Error('happy path precondition: ids.session not set');
  const happy = await loadSessionContext(ids.session);
  if (happy === null) throw new Error('loadSessionContext happy: returned null');
  if (happy.sessionNumber !== 1) throw new Error(`loadSessionContext happy: sessionNumber=${happy.sessionNumber} expected 1`);
  if (happy.topic !== 'What is blockchain?') throw new Error(`loadSessionContext happy: topic=${happy.topic}`);
  if (happy.brief !== null) throw new Error(`loadSessionContext happy: brief expected null, got ${JSON.stringify(happy.brief)}`);
  if (happy.trackName !== 'Blockchain Foundations') throw new Error(`loadSessionContext happy: trackName=${happy.trackName}`);
  if (happy.trackTotalSessions !== 6) throw new Error(`loadSessionContext happy: trackTotalSessions=${happy.trackTotalSessions} expected 6`);
  if (happy.cohortName !== 'GRD Spring 2026') throw new Error(`loadSessionContext happy: cohortName=${happy.cohortName}`);
  if (happy.collegeName !== 'GRD College of Science') throw new Error(`loadSessionContext happy: collegeName=${happy.collegeName}`);
  console.log('✓ loadSessionContext happy path');

  // 7. loadSessionContext: not-found path
  const notFound = await loadSessionContext(crypto.randomUUID());
  if (notFound !== null) throw new Error(`loadSessionContext not-found: expected null, got ${JSON.stringify(notFound)}`);
  console.log('✓ loadSessionContext not-found path');

  // 8. loadSessionContext: invalid-uuid path
  const invalid = await loadSessionContext('not-a-uuid');
  if (invalid !== null) throw new Error(`loadSessionContext invalid-uuid: expected null, got ${JSON.stringify(invalid)}`);
  console.log('✓ loadSessionContext invalid-uuid path');

  // 9. formatSessionContext: assert against the loaded context
  if (!happy) throw new Error('section 9 precondition: happy is null');
  const formatted = formatSessionContext(happy);

  if (!formatted.includes('What is blockchain?')) {
    throw new Error('section 9: formatted output missing topic');
  }
  if (!formatted.includes('Blockchain Foundations')) {
    throw new Error('section 9: formatted output missing track name');
  }
  if (!formatted.includes('GRD Spring 2026')) {
    throw new Error('section 9: formatted output missing cohort name');
  }
  if (!formatted.includes('GRD College of Science')) {
    throw new Error('section 9: formatted output missing college name');
  }
  if (!formatted.includes('session 1 of 6')) {
    throw new Error('section 9: formatted output missing session position');
  }
  if (!formatted.includes('co-hosting with Baz')) {
    throw new Error('section 9: formatted output missing opening line');
  }
  if (formatted.includes('Approved session brief')) {
    throw new Error('section 9: formatted output should not include brief section when brief is null');
  }

  console.log('✓ formatSessionContext output:');
  console.log(formatted);
  console.log('✓ section 9 passed');
}

async function cleanup(): Promise<string[]> {
  const failures: string[] = [];

  if (ids.session) {
    const r = await supabase.from('sessions').delete().eq('id', ids.session);
    if (r.error) failures.push(`session ${ids.session}: ${r.error.message}`);
  }
  if (ids.track) {
    const r = await supabase.from('tracks').delete().eq('id', ids.track);
    if (r.error) failures.push(`track ${ids.track}: ${r.error.message}`);
  }
  if (ids.cohort) {
    const r = await supabase.from('cohorts').delete().eq('id', ids.cohort);
    if (r.error) failures.push(`cohort ${ids.cohort}: ${r.error.message}`);
  }
  if (ids.college) {
    const r = await supabase.from('colleges').delete().eq('id', ids.college);
    if (r.error) failures.push(`college ${ids.college}: ${r.error.message}`);
  }

  return failures;
}

main()
  .then(async () => {
    const failures = await cleanup();
    if (failures.length > 0) {
      console.error('✗ Smoke test failed: cleanup left rows in database:');
      for (const f of failures) console.error('  - ' + f);
      process.exit(1);
    }
    console.log('✓ Smoke test passed');
    process.exit(0);
  })
  .catch(async (err) => {
    const failures = await cleanup();
    console.error('✗ Smoke test failed:', err instanceof Error ? err.message : err);
    if (failures.length > 0) {
      console.error('Cleanup also left rows in database:');
      for (const f of failures) console.error('  - ' + f);
    }
    process.exit(1);
  });
