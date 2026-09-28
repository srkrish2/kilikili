import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { VOICE_SLOTS } from '../../audio/voice';
import { ChunkyButton } from '../../components/Buttons';
import { Body, Card, Page, Segmented } from '../../components/UI';
import { RecordRow, useVoiceRecorder } from '../../components/VoiceRecorder';
import { firstWordsToRecord } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F } from '../../theme';

/** Optional: record the first words so games can play them when you're not reading aloud. */
export function VoiceSetup() {
  const { state, update } = useApp();
  const speakers = state.profile.speakers.length ? state.profile.speakers : VOICE_SLOTS.map((v) => v.id);
  const [slot, setSlot] = useState(speakers[0]);
  const rec = useVoiceRecorder(slot);
  const words = firstWordsToRecord(content.words.words, content.rules.onboarding.voiceSetupWords);
  const finish = () => { update((s) => ({ ...s, onboarded: true })); router.replace('/'); };
  const name = (id: string) => VOICE_SLOTS.find((v) => v.id === id)?.ta ?? id;
  return (
    <Page title="Record your voice">
      <Body>Optional. Record the first {words.length} words so games can play them when you're not reading aloud. It takes about two minutes.</Body>
      {speakers.length > 1 && <Segmented label="Whose voice?" value={slot} options={speakers} onChange={(v) => { if (!rec.active) setSlot(v); }} render={name} />}
      {rec.denied && <Body>Microphone access is off. You can record later from Grown-ups › Family voices.</Body>}
      <Card>
        {words.map((w) => <RecordRow key={w.id} recKey={w.id} ta={w.ta} sub={`${w.translit} · ${w.en}`} slot={slot} rec={rec} />)}
      </Card>
      <View style={{ gap: 10 }}>
        <ChunkyButton label="Done" style={{ minHeight: 56 }} onPress={finish} disabled={!!rec.active} />
        <Pressable onPress={finish} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.inkMuted }}>Later (also in Grown-ups › Family voices)</Text>
        </Pressable>
      </View>
    </Page>
  );
}
