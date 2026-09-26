import { Text, View } from 'react-native';
import { WordPicture } from '../components/Art';
import { ChunkyButton } from '../components/Buttons';
import type { TripState } from '../core';
import { content } from '../generated/content';
import { C, F, R, drop } from '../theme';

/** One shared celebration screen for every session type (wireframe decision). */
export function DoneScreen({ trip, onHome }: { trip: TripState; onHome: () => void }) {
  const byId = new Map(content.words.words.map((w) => [w.id, w]));
  const { stats } = trip;
  let line = `${stats.firstTry} of ${stats.pictureStops} picture stops right on the first tap`;
  if (stats.actionStops) line += `; ${stats.didAction} of ${stats.actionStops} actions without a demo`;
  return (
    <View style={{ flex: 1, backgroundColor: C.jasmine, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 44, color: C.ink }}>சூப்பர்!</Text>
      <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.inkSoft }}>Koo's wagons are full.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {trip.cargo.map((id, i) => (
          <View key={`${id}-${i}`} style={{ width: 76, height: 76, borderRadius: R.md, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...drop(C.cardShadow, 4) }}>
            <WordPicture word={byId.get(id)!} size={56} />
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.inkMuted, textAlign: 'center' }}>For grown-ups: {line}.</Text>
      <ChunkyButton label="Back to the station" onPress={onHome} />
    </View>
  );
}
