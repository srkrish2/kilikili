import { Text, View } from 'react-native';
import { WordPicture } from '../../components/Art';
import { Card, Page } from '../../components/UI';
import { initialProgress, status } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R } from '../../theme';
import { Gate } from './Gate';
import { STATUS_BG, STATUS_FG, STATUS_LABEL } from './status';
import { useGate } from './useGate';

/** Known / emerging / not yet, per category, with the numbers behind each word. */
export function WordsDashboard() {
  const [open, pass] = useGate();
  const { state } = useApp();
  if (!open) return <Gate onPass={pass} />;
  const { scoring } = content.rules;
  return (
    <Page title="Every word" back>
      {content.words.categories.map((cat) => (
        <Card key={cat.id}>
          <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.ink }}>{cat.ta} <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.inkMuted }}>{cat.en}{cat.id === 'actions' ? ' · action stops' : ''}</Text></Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {content.words.words.filter((w) => w.category === cat.id).map((w) => {
              const p = state.progress[w.id];
              const st = status(p, scoring);
              const prob = (p ?? initialProgress(w.homeFrequency, scoring)).p;
              const meta = p && p.n ? `${Math.round(prob * 100)}% · ${p.c}/${p.n} right · ${p.days.length} day${p.days.length === 1 ? '' : 's'}` : 'not tried yet';
              return (
                <View key={w.id} accessibilityLabel={`${w.en}: ${STATUS_LABEL[st]}`}
                  style={{ flexGrow: 1, flexBasis: 200, flexDirection: 'row', gap: 8, alignItems: 'center', padding: 8, borderRadius: R.sm, backgroundColor: STATUS_BG[st], borderWidth: 2, borderColor: st === 'new' ? C.cardShadow : 'transparent', borderStyle: st === 'new' ? 'dashed' : 'solid' }}>
                  <WordPicture word={w} size={40} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: F.heavy, fontSize: 17, color: C.ink }}>{w.ta} <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>{w.translit} · {w.en}</Text></Text>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                      <View style={{ width: `${Math.round(prob * 100)}%`, height: '100%', backgroundColor: STATUS_FG[st] }} />
                    </View>
                    <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.inkSoft }}>{STATUS_LABEL[st]} · {meta}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      ))}
    </Page>
  );
}
