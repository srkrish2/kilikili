import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Art, Koo } from '../../components/Art';
import { ChunkyButton } from '../../components/Buttons';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F } from '../../theme';

/** First launch only (and from Grown-ups › Settings). */
export function Welcome() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.jasmine }} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, alignItems: 'center', gap: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 38, color: C.ink }}>Tamil Train</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.inkSoft }}>தமிழ் ரயில்</Text>
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 240, width: '100%', maxWidth: 420, borderRadius: 40, backgroundColor: C.skyPale, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, backgroundColor: C.grass }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 40 }}>
          <Art name="char-anil" width={80} />
          <Koo colour={content.rules.yard.engineColours[0]} width={210} />
          <Art name="char-kili" width={70} />
        </View>
      </View>
      <Text style={{ fontFamily: F.bold, fontSize: 19, color: C.ink, textAlign: 'center', maxWidth: 380, lineHeight: 28 }}>
        Learn Tamil together, 10 minutes a day. You say the words. The app keeps score.
      </Text>
      <View style={{ marginTop: 'auto', width: '100%', maxWidth: 380, gap: 10 }}>
        <ChunkyButton label="Set up (for grown-ups)" style={{ minHeight: 56 }} onPress={() => router.push('/setup/profile')} />
        {state.onboarded ? (
          <Pressable onPress={() => router.replace('/')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.indigo }}>Back to the station</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/grownups/data')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.inkMuted }}>Used Tamil Train on another device? Load progress</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
