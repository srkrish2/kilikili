import { router } from 'expo-router';
import { Text, TextInput } from 'react-native';
import { VOICE_SLOTS } from '../../audio/voice';
import { ChunkyButton } from '../../components/Buttons';
import { Body, Card, Label, Page, Segmented, ToggleRow } from '../../components/UI';
import { seedPriors, type Exposure } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R } from '../../theme';

const EXPOSURE: Record<Exposure, string> = { daily: 'Every day', sometimes: 'Sometimes', rarely: 'Rarely' };

export function ProfileSetup() {
  const { state, update } = useApp();
  const p = state.profile;
  const setP = (patch: Partial<typeof p>) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  const exposure = p.exposure ?? 'daily';
  return (
    <Page title="About your child" back>
      <Card>
        <Label>NAME</Label>
        <TextInput value={p.childName} onChangeText={(v) => setP({ childName: v.slice(0, 30) })} placeholder="Name" accessibilityLabel="Child's name" autoFocus
          style={{ fontFamily: F.bold, fontSize: 20, color: C.ink, borderWidth: 2, borderColor: C.cardShadow, borderRadius: R.sm, paddingHorizontal: 12, minHeight: 52 }} />
        <Segmented label="Age" value={p.age ?? 4} options={[3, 4, 5, 6] as const} onChange={(v) => setP({ age: v })} />
      </Card>
      <Card>
        <Segmented label="How often does he hear Tamil?" value={exposure} options={['daily', 'sometimes', 'rarely'] as const} onChange={(v) => setP({ exposure: v })} render={(v) => EXPOSURE[v]} />
        <Body muted>Sets the starting guess for each word. The first trips correct it quickly.</Body>
      </Card>
      <Card>
        <Label>WHO SPEAKS TAMIL TO HIM?</Label>
        {VOICE_SLOTS.map((v) => (
          <ToggleRow key={v.id} label={v.ta} value={p.speakers.includes(v.id)}
            onChange={(on) => setP({ speakers: on ? [...p.speakers, v.id] : p.speakers.filter((x) => x !== v.id) })} />
        ))}
        <Body muted>These become the voices you can record for each word.</Body>
      </Card>
      <ChunkyButton label="Next" style={{ minHeight: 56 }} onPress={() => {
        update((s) => seedPriors({ ...s, profile: { ...s.profile, age: s.profile.age ?? 4 } }, content.words.words, content.rules, exposure));
        router.push('/check');
      }} />
      <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted, textAlign: 'center' }}>Next: a quick listening check, together.</Text>
    </Page>
  );
}
