import { router } from 'expo-router';
import { Pressable, Text, TextInput } from 'react-native';
import { VOICE_SLOTS } from '../../audio/voice';
import { Body, Card, Label, Page, Segmented, ToggleRow } from '../../components/UI';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R } from '../../theme';
import { Gate } from './Gate';
import { useGate } from './useGate';

const AGES = [2, 3, 4, 5, 6, 7] as const;

export function Settings() {
  const [open, pass] = useGate();
  const { state, update } = useApp();
  if (!open) return <Gate onPass={pass} />;
  const t = content.rules.trip;
  const set = (patch: Partial<typeof state.settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const setG = (patch: Partial<typeof state.grownups>) => update((s) => ({ ...s, grownups: { ...s.grownups, ...patch } }));
  const setP = (patch: Partial<typeof state.profile>) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } }));

  return (
    <Page title="Trips and settings" back>
      <Card>
        <Label>TRIPS</Label>
        <Segmented label="Stops per trip" value={state.settings.length} options={t.lengthOptions} onChange={(v) => set({ length: v })} />
        <Segmented label="Pictures per stop" value={state.settings.choices} options={t.choiceOptions} onChange={(v) => set({ choices: v })} />
        <ToggleRow label={`Action stops (every ${content.rules.trip.actionStopEvery}th)`} sub="Gets him off the screen and moving" value={state.settings.actionStops} onChange={(v) => set({ actionStops: v })} />
        <ToggleRow label="Show English meaning on the ticket" value={state.settings.showGloss} onChange={(v) => set({ showGloss: v })} />
      </Card>

      <Card>
        <Label>VOICES</Label>
        <Segmented label="Prefer this voice" value={state.grownups.preferredVoice ?? 'any'} options={['any', ...VOICE_SLOTS.map((v) => v.id)]}
          onChange={(v) => setG({ preferredVoice: v === 'any' ? null : v })} render={(v) => (v === 'any' ? 'Any' : VOICE_SLOTS.find((x) => x.id === v)!.ta)} />
      </Card>

      <Card>
        <Label>LINES</Label>
        <ToggleRow label="Preview every line" sub={`Opens Letters and Reading now, before ${content.rules.unlocks.lettersLine.knownWords} known words / ${content.rules.unlocks.readingLine.knownLetters} known letters. For trying things out; his progress still counts.`}
          value={state.grownups.previewAllLines} onChange={(v) => setG({ previewAllLines: v })} />
      </Card>

      <Card>
        <Label>PROFILE</Label>
        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>Child's name</Text>
        <TextInput value={state.profile.childName} onChangeText={(v) => setP({ childName: v.slice(0, 30) })} placeholder="Name" accessibilityLabel="Child's name"
          style={{ fontFamily: F.bold, fontSize: 18, color: C.ink, borderWidth: 2, borderColor: C.cardShadow, borderRadius: R.sm, paddingHorizontal: 12, minHeight: 48 }} />
        <Segmented label="Age" value={state.profile.age ?? 0} options={AGES} onChange={(v) => setP({ age: v })} />
        <Body muted>Who speaks Tamil with him at home?</Body>
        {VOICE_SLOTS.map((v) => (
          <ToggleRow key={v.id} label={v.ta} value={state.profile.speakers.includes(v.id)}
            onChange={(on) => setP({ speakers: on ? [...state.profile.speakers, v.id] : state.profile.speakers.filter((x) => x !== v.id) })} />
        ))}
        <Pressable onPress={() => router.push('/welcome')} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.indigo }}>Show the welcome again</Text>
        </Pressable>
      </Card>
    </Page>
  );
}
