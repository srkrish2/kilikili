import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { say, sayAll, stopVoice, useCanSay } from '../../audio/voice';
import { Script, SessionShell } from '../../components/Session';
import { blendParts, pageWords, type Book } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, NO_SELECT, R, drop } from '../../theme';

export function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = content.reading.books.find((b) => b.id === id);
  if (!book) return <Redirect href="/shelf" />;
  return <Reader book={book} />;
}

/** Page by page: he reads (written Tamil), scratches off the picture, grown-up asks (spoken Tamil). */
function Reader({ book }: { book: Book }) {
  const { state, update, finishSession } = useApp();
  const [page, setPage] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [scratched, setScratched] = useState(0);
  const started = useRef(Date.now());
  const p = book.pages[page];
  const words = pageWords(p.ta);
  const voice = useCanSay(state, null);
  useEffect(() => { setScratched(0); setLit(null); stopVoice(); }, [page]);

  // Tap a word: its sounds, then the word (the same stretch as blending).
  const hear = async (i: number) => {
    setLit(i);
    const parts = blendParts(words[i].spoken).map((x) => x.syllable);
    await sayAll(state, [...parts.map((t) => ({ key: null, text: t })), { key: null, text: words[i].spoken }], 120);
    setLit(null);
  };

  const next = () => {
    if (page + 1 < book.pages.length) return setPage(page + 1);
    update((s) => ({ ...s, booksRead: { ...s.booksRead, [book.id]: (s.booksRead[book.id] ?? 0) + 1 } }));
    finishSession(
      { kind: 'book', label: book.id, secs: (Date.now() - started.current) / 1000 },
      { kind: 'book', title: 'சபாஷ்!', subtitle: `He read “${book.title}”!`, cargo: book.pages.map((x, i) => ({ key: `${i}`, emoji: Array.from(x.art)[0] })), grownupLine: `read “${book.title}” (${book.pages.length} pages)` },
    );
    router.replace('/done');
  };

  const cover = Math.max(0, 1 - scratched / 600);
  return (
    <SessionShell step={page} steps={book.pages.length} color={C.kumkum} onExit={() => router.back()}>
      <View>
        <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.ink }}>{book.title}</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.inkMuted }}>{book.titleEn} · page {page + 1} of {book.pages.length}</Text>
      </View>
      <View style={{ height: 210, borderRadius: R.lg, backgroundColor: C.skyPale, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...drop(C.cardShadow, 5) }}>
        <Text style={{ fontSize: 96 }}>{p.art}</Text>
        {cover > 0 && (
          <View
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderMove={(e) => setScratched((d) => d + Math.abs(e.nativeEvent.locationX % 7) + 4)}
            accessibilityLabel="Scratch to see the picture"
            style={{ ...NO_SELECT, position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', backgroundColor: C.cardShadow, opacity: cover, alignItems: 'center', justifyContent: 'center', borderRightWidth: 3, borderStyle: 'dashed', borderColor: C.inkMuted }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 4 }}>
              <Text selectable={false} style={{ fontFamily: F.heavy, fontSize: 15, color: C.ink }}>Scratch to see!</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {words.map((w, i) => (
          <Pressable key={i} onPress={() => hear(i)} accessibilityLabel={`${w.spoken}. Tap to hear it`}
            style={{ borderRadius: 8, paddingHorizontal: 6, backgroundColor: lit === i ? '#FCEBB8' : 'transparent', borderBottomWidth: 4, borderColor: lit === i ? C.marigold : C.cardShadow }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 38, color: C.ink, lineHeight: 52 }}>{w.display}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>{voice ? 'Tap a word to hear it sounded out, then blended.' : 'He reads; you help with a word by sounding it out.'}</Text>
      {p.ask && <Script label="AFTER THE PAGE, ASK" ta={`“${p.ask.ta}”`} note={p.ask.en} />}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <RoundButton label="‹" a11y="Previous page" disabled={page === 0} onPress={() => setPage(page - 1)} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {book.pages.map((_, i) => <View key={i} style={{ width: i === page ? 22 : 10, height: 10, borderRadius: 5, backgroundColor: i === page ? C.kumkum : i < page ? C.ink : C.cardShadow }} />)}
        </View>
        <RoundButton label="›" a11y={page + 1 < book.pages.length ? 'Next page' : 'Finish the book'} primary onPress={next} />
      </View>
    </SessionShell>
  );
}

function RoundButton({ label, a11y, onPress, disabled, primary }: { label: string; a11y: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={a11y}
      style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1,
        backgroundColor: primary ? C.kumkum : '#FFFFFF', ...drop(primary ? C.kumkumDeep : C.cardShadow, 4) }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 30, color: primary ? '#FFFFFF' : C.ink, lineHeight: 36 }}>{label}</Text>
    </Pressable>
  );
}
