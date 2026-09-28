import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { say } from '../audio/voice';
import { deleteRecording, saveRecording } from '../audio/voiceStore';
import { useApp } from '../state/AppState';
import { C, F, R } from '../theme';

/**
 * One recorder for a whole screen. start(key) records the current slot's voice for
 * `key`; stop() keeps it on the device and notes it in SavedState.voices.
 */
export function useVoiceRecorder(slot: string) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { update } = useApp();
  const [active, setActive] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const start = useCallback(async (key: string) => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) { setDenied(true); return; }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setActive(key);
  }, [recorder]);

  const stop = useCallback(async () => {
    const key = active;
    if (!key) return;
    setActive(null);
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (!recorder.uri) return;
    await saveRecording(slot, key, recorder.uri);
    update((s) => {
      const have = s.voices[key] ?? [];
      return have.includes(slot) ? s : { ...s, voices: { ...s.voices, [key]: [...have, slot] } };
    });
  }, [active, recorder, slot, update]);

  const remove = useCallback(async (key: string) => {
    await deleteRecording(slot, key);
    update((s) => ({ ...s, voices: { ...s.voices, [key]: (s.voices[key] ?? []).filter((x) => x !== slot) } }));
  }, [slot, update]);

  return { active, denied, start, stop, remove };
}

/** A word to record: Tamil, transliteration, and record / play / delete. */
export function RecordRow({ recKey, ta, sub, slot, rec }: {
  recKey: string; ta: string; sub: string; slot: string; rec: ReturnType<typeof useVoiceRecorder>;
}) {
  const { state } = useApp();
  const has = (state.voices[recKey] ?? []).includes(slot);
  const recording = rec.active === recKey;
  const busy = rec.active !== null && !recording;
  // Play exactly this slot's clip, not the preferred voice.
  const playMine = () => say({ ...state, voices: { ...state.voices, [recKey]: [slot] } }, recKey, ta);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderColor: C.jasmine }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.ink }}>{ta}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>{sub}</Text>
      </View>
      {has && !recording && <SmallButton label="▶" onPress={playMine} disabled={busy} a11y={`Play ${sub}`} />}
      {has && !recording && <SmallButton label="🗑" onPress={() => rec.remove(recKey)} disabled={busy} a11y={`Delete ${sub}`} />}
      <SmallButton
        label={recording ? '■ Stop' : has ? '● Redo' : '● Record'}
        onPress={() => (recording ? rec.stop() : rec.start(recKey))}
        disabled={busy}
        color={recording ? C.kumkum : has ? '#FFFFFF' : C.kumkumDeep}
        text={recording || !has ? '#FFFFFF' : C.ink}
        a11y={`${recording ? 'Stop recording' : 'Record'} ${sub}`}
      />
    </View>
  );
}

export function SmallButton({ label, onPress, disabled, color = '#FFFFFF', text = C.ink, a11y }: {
  label: string; onPress: () => void; disabled?: boolean; color?: string; text?: string; a11y?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={a11y ?? label}
      style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center',
        backgroundColor: color, borderWidth: 2, borderColor: color === '#FFFFFF' ? C.cardShadow : color, opacity: disabled ? 0.4 : 1 }}>
      <Text style={{ fontFamily: F.heavy, fontSize: 15, color: text }}>{label}</Text>
    </Pressable>
  );
}
