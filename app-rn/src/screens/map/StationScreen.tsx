import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { say } from '../../audio/voice';
import { WordPicture } from '../../components/Art';
import { ChunkyButton } from '../../components/Buttons';
import { Body, Page } from '../../components/UI';
import { stations, status } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R, drop } from '../../theme';
import { STATUS_LABEL } from '../grownups/status';

/** One Listening Line station: its words, what he knows, and a ride of just these words. */
export function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useApp();
  const station = stations(state, content).find((s) => s.id === id);
  if (!station) return <Redirect href="/map" />;
  const words = content.words.words.filter((w) => w.category === id);
  const actions = id === 'actions';
  return (
    <Page title={`${station.ta}`} back>
      <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.inkMuted, marginTop: -10 }}>{station.en} station · {station.known} of {station.total} known</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {words.map((w) => {
          const st = status(state.progress[w.id], content.rules.scoring);
          return (
            <Pressable key={w.id} onPress={() => say(state, w.id, w.ta)} accessibilityLabel={`${w.en}: ${STATUS_LABEL[st]}. Tap to hear it`}
              style={{ width: 116, alignItems: 'center', gap: 4, padding: 8, borderRadius: R.md, backgroundColor: '#FFFFFF', borderWidth: 4,
                borderColor: st === 'known' ? C.marigold : 'transparent', borderStyle: st === 'new' ? 'dashed' : 'solid', ...drop(C.cardShadow, 4) }}>
              <WordPicture word={w} size={60} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: F.heavy, fontSize: w.ta.length > 8 ? 13 : 16, color: C.ink, textAlign: 'center' }}>{w.ta}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.inkMuted }}>{STATUS_LABEL[st]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Body muted>Tap a word to hear it. Words he knows get a gold border.</Body>
      {actions ? (
        <Body>Action words come up on every trip's action stops. Play them any time: say one, he does it.</Body>
      ) : (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <ChunkyButton label="Ride this station again" style={{ minWidth: 260, minHeight: 56 }} onPress={() => router.push(`/trip?station=${id}`)} />
          <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>A trip made only of this station's words</Text>
        </View>
      )}
    </Page>
  );
}
