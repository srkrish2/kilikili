import { Text, View } from 'react-native';
import { Body, Card, Page } from '../../components/UI';
import { curriculumLetters, initialLetterProgress, letterStatus } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R } from '../../theme';
import { Gate } from './Gate';
import { STATUS_BG, STATUS_FG, STATUS_LABEL } from './status';
import { useGate } from './useGate';

export function LettersDashboard() {
  const [open, pass] = useGate();
  const { state } = useApp();
  if (!open) return <Gate onPass={pass} />;
  const { scoring, letters: lr } = content.rules;
  return (
    <Page title="Letters" back>
      <Card>
        <Body muted>Letters are scored like words: only Nandu's “find the letter” rounds count, corrected for guessing. Known means 90%+ and right on two different days. The order is a proposal; review it with a Tamil teacher.</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {curriculumLetters(content.curriculum).map((l) => {
            const st = letterStatus(state, l.glyph, scoring);
            const p = state.letters[l.glyph] ?? initialLetterProgress(lr);
            const lessons = state.lessonsDone[l.glyph] ?? 0;
            return (
              <View key={l.glyph} style={{ width: 150, flexGrow: 1, padding: 10, borderRadius: R.sm, backgroundColor: STATUS_BG[st], borderWidth: 2, borderStyle: st === 'new' ? 'dashed' : 'solid', borderColor: st === 'new' ? C.cardShadow : 'transparent' }}>
                <Text style={{ fontFamily: F.heavy, fontSize: 40, color: STATUS_FG[st], lineHeight: 52 }}>{l.glyph}</Text>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>{l.n}. “{l.sound}” · {l.anchor.ta}</Text>
                <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.inkSoft }}>{STATUS_LABEL[st]}{p.n ? ` · ${Math.round(p.p * 100)}% · ${p.c}/${p.n}` : ''} · {lessons} lesson{lessons === 1 ? '' : 's'}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </Page>
  );
}
