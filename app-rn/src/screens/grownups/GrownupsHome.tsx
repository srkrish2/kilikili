import { Text, View } from 'react-native';
import { curriculumLetters, knownLetters, lineStatuses, status, type SessionLog, type WordStatus } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R } from '../../theme';
import { Body, Card, Label, LinkRow, Page } from '../../components/UI';
import { Gate } from './Gate';
import { STATUS_BG, STATUS_FG, STATUS_LABEL } from './status';
import { useGate } from './useGate';

const KIND: Record<SessionLog['kind'], string> = { trip: '🚂 Trip', lesson: '✏️ Letter', blend: '🐢 Blending', book: '📖 Book', game: '🦀 Game' };

export function GrownupsHome() {
  const [open, pass] = useGate();
  const { state } = useApp();
  if (!open) return <Gate onPass={pass} />;

  const counts: Record<WordStatus, number> = { known: 0, emerging: 0, notyet: 0, new: 0 };
  content.words.words.forEach((w) => counts[status(state.progress[w.id], content.rules.scoring)]++);
  const lines = lineStatuses(state, content);
  const letters = curriculumLetters(content.curriculum);
  const lettersKnown = knownLetters(state, letters, content.rules.scoring).length;
  const recorded = Object.values(state.voices).filter((v) => v.length).length;
  const name = state.profile.childName || 'your child';

  return (
    <Page title="Grown-ups">
      <Card>
        <Label>WHAT {name.toUpperCase()} UNDERSTANDS</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['known', 'emerging', 'notyet', 'new'] as const).map((k) => (
            <View key={k} style={{ flexGrow: 1, flexBasis: 120, borderRadius: R.sm, padding: 10, backgroundColor: STATUS_BG[k], borderWidth: k === 'new' ? 2 : 0, borderStyle: 'dashed', borderColor: C.cardShadow }}>
              <Text style={{ fontFamily: F.heavy, fontSize: 30, color: STATUS_FG[k] }}>{counts[k]}</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 14, color: STATUS_FG[k] }}>{STATUS_LABEL[k]}</Text>
            </View>
          ))}
        </View>
        <LinkRow icon="🗂️" title="Every word, by category" sub="How sure the app is, and why" href="/grownups/words" />
        <LinkRow icon="✏️" title="Letters" sub={`${lettersKnown} of ${letters.length} known${lines.letters.unlocked ? '' : ` · Letters Line opens at ${lines.letters.need} words (${lines.letters.have} now)`}`} href="/grownups/letters" />
      </Card>

      <Card>
        <Label>SET UP</Label>
        <LinkRow icon="🎙️" title="Family voices" sub={recorded ? `${recorded} words recorded` : 'Record Amma, Appa or Paatti saying the words'} href="/grownups/voices" />
        <LinkRow icon="⚙️" title="Trips and settings" sub={`${state.settings.length} stops · ${state.settings.choices} pictures · profile`} href="/grownups/settings" />
        <LinkRow icon="💾" title="Save or move progress" sub="Export, import, reset" href="/grownups/data" />
      </Card>

      <Card>
        <Label>RECENT SESSIONS</Label>
        {state.history.length === 0 ? <Body muted>Nothing yet. Start a trip from the Trip tab.</Body> : (
          [...state.history].reverse().slice(0, 10).map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 4 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>{KIND[h.kind]}{h.label ? ` · ${h.label}` : ''}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.inkMuted }}>{h.of ? `${h.right}/${h.of} first try · ` : ''}{h.day}</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Label>HOW TO USE IT</Label>
        <Body>Sit with {state.profile.childName || 'him'}. Say each word the way you would at home, then tap “I said it”. Don't look at or point to the right picture: kids read your eyes. One trip a day is plenty; stop while he still wants more.</Body>
        <Body muted>Only the first tap at a stop counts, corrected for lucky guesses. A word is “known” once the estimate passes 90% and he got it right on two different days.</Body>
      </Card>
    </Page>
  );
}
