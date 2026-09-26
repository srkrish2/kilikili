import { useState } from 'react';
import { Text } from 'react-native';
import { letterKey, readingKey, VOICE_SLOTS } from '../../audio/voice';
import { Body, Card, Label, Page, Segmented } from '../../components/UI';
import { RecordRow, useVoiceRecorder } from '../../components/VoiceRecorder';
import { curriculumLetters } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F } from '../../theme';
import { Gate } from './Gate';
import { useGate } from './useGate';

/** Record Amma / Appa / Paatti per word. Clips stay on this device. */
export function Voices() {
  const [open, pass] = useGate();
  const { state } = useApp();
  const [slot, setSlot] = useState(state.profile.speakers[0] ?? VOICE_SLOTS[0].id);
  const rec = useVoiceRecorder(slot);
  if (!open) return <Gate onPass={pass} />;
  const slotName = (id: string) => VOICE_SLOTS.find((v) => v.id === id)?.ta ?? id;
  const count = Object.values(state.voices).filter((v) => v.includes(slot)).length;

  return (
    <Page title="Family voices" back>
      <Card>
        <Body>He learns best from voices he loves. Record each word once, clearly, the way you say it at home. The recording plays on the ticket and in games. If a word has no recording, the phone's Tamil voice is used when it has one.</Body>
        <Body muted>Recordings stay on this device. Exporting progress doesn't include them.</Body>
        <Segmented label="Whose voice?" value={slot} options={VOICE_SLOTS.map((v) => v.id)} onChange={(v) => { if (!rec.active) setSlot(v); }} render={slotName} />
        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.inkMuted }}>{count} recorded for {slotName(slot)}</Text>
        {rec.denied && <Body>Microphone access is off. Turn it on for Tamil Train in the phone's Settings to record.</Body>}
      </Card>

      {content.words.categories.map((cat) => (
        <Card key={cat.id}>
          <Label>{cat.en.toUpperCase()} · {cat.ta}</Label>
          {content.words.words.filter((w) => w.category === cat.id).map((w) => (
            <RecordRow key={w.id} recKey={w.id} ta={w.ta} sub={`${w.translit} · ${w.en}`} slot={slot} rec={rec} />
          ))}
        </Card>
      ))}

      <Card>
        <Label>LETTER SOUNDS · எழுத்துகள்</Label>
        <Body muted>Say just the sound, short and clear (அ = “a”).</Body>
        {curriculumLetters(content.curriculum).map((l) => (
          <RecordRow key={l.glyph} recKey={letterKey(l.n)} ta={l.glyph} sub={`“${l.sound}” · letter ${l.n}`} slot={slot} rec={rec} />
        ))}
      </Card>

      <Card>
        <Label>READING WORDS · படிக்கும் சொற்கள்</Label>
        {content.reading.words.map((w) => (
          <RecordRow key={w.id} recKey={readingKey(w.id)} ta={w.ta} sub={`${w.translit} · ${w.en}`} slot={slot} rec={rec} />
        ))}
      </Card>
    </Page>
  );
}
