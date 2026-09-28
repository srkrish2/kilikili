import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Body, Page } from '../../components/UI';
import { availableBooks, readingLetters } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';

/** Decodable books: each uses only letters he knows. Rereading is the reward. */
export function ShelfScreen() {
  const { state } = useApp();
  const open = new Set(availableBooks(content.reading, readingLetters(state, content)).map((b) => b.id));
  return (
    <Page title="Books" back>
      <Body muted>Each book uses only letters he has learned. Read them again and again: rereading is how reading gets easy.</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {content.reading.books.map((b) => {
          const reads = state.booksRead[b.id] ?? 0;
          const ok = open.has(b.id);
          return (
            <Pressable key={b.id} disabled={!ok} onPress={() => router.push(`/book/${b.id}`)} accessibilityLabel={`${b.titleEn}${ok ? '' : ', locked'}`}
              style={{ width: 160, flexGrow: 1, gap: 6, opacity: ok ? 1 : 0.5 }}>
              <View style={{ height: 180, borderRadius: R.md, backgroundColor: ok ? '#FFFFFF' : C.cardShadow, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 12, borderLeftColor: C.kumkum, ...drop(C.cardShadow, 5) }}>
                <Text style={{ fontSize: 72 }}>{ok ? b.cover : '🔒'}</Text>
              </View>
              <Text style={{ fontFamily: F.heavy, fontSize: 20, color: C.ink }}>{b.title}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>{!ok ? 'Needs more letters' : reads ? `Read ${reads} time${reads === 1 ? '' : 's'}` : 'New'} · {b.titleEn}</Text>
            </Pressable>
          );
        })}
      </View>
    </Page>
  );
}
