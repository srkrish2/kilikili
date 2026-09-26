import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { ChunkyButton } from '../../components/Buttons';
import { Body, Card, Label, Page } from '../../components/UI';
import { dayKey, defaultState, exportState, importState } from '../../core';
import { content } from '../../generated/content';
import { useApp } from '../../state/AppState';
import { C, F, R } from '../../theme';
import { readPicked, shareJson } from './exportFile';
import { Gate } from './Gate';
import { useGate } from './useGate';

/**
 * Export / import the SavedState JSON (the same on iOS and Android), so progress can
 * move between devices. Nothing leaves the device unless the grown-up sends it.
 */
export function DataScreen() {
  const [open, pass] = useGate();
  const { state, replaceState } = useApp();
  const [msg, setMsg] = useState('');
  const [pasted, setPasted] = useState('');
  const [resetArmed, setResetArmed] = useState(false);
  if (!open) return <Gate onPass={pass} />;

  const load = (text: string) => {
    try {
      const s = importState(text, content.rules);
      replaceState(s);
      setMsg(`Progress loaded: ${Object.keys(s.progress).length} words tracked.`);
      setPasted('');
    } catch {
      setMsg('That isn’t Tamil Train progress. Export it again and paste or pick the whole file.');
    }
  };

  return (
    <Page title="Save or move progress" back>
      <Card>
        <Label>EXPORT</Label>
        <Body>Save a copy to keep as a backup, or to move his progress to another phone or tablet (iPhone and Android use the same file).</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <ChunkyButton label="Save a file" onPress={() => shareJson(`tamil-train-${dayKey()}.json`, exportState(state)).then(setMsg).catch(() => setMsg('Could not save the file.'))} />
          <ChunkyButton label="Copy" color={C.peacock} under={C.peacockDeep} onPress={() => Clipboard.setStringAsync(exportState(state)).then(() => setMsg('Progress copied.'))} />
        </View>
      </Card>

      <Card>
        <Label>IMPORT</Label>
        <Body muted>Loading replaces the progress on this device. Family voice recordings aren't in the file; record them again on the new device.</Body>
        <ChunkyButton label="Open a progress file" color={C.inkSoft} under={C.ink} onPress={async () => {
          const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
          if (!r.canceled && r.assets[0]) load(await readPicked(r.assets[0].uri));
        }} />
        <TextInput value={pasted} onChangeText={setPasted} multiline placeholder="…or paste progress here" accessibilityLabel="Paste progress"
          style={{ minHeight: 90, fontFamily: F.medium, fontSize: 13, color: C.ink, borderWidth: 2, borderColor: C.cardShadow, borderRadius: R.sm, padding: 10, textAlignVertical: 'top' }} />
        <ChunkyButton label="Load pasted progress" disabled={!pasted.trim()} onPress={() => load(pasted)} />
      </Card>

      <Card>
        <Label color={C.kumkumDeep}>RESET</Label>
        <Body muted>Erases words, letters, books and history on this device. Settings and the profile stay.</Body>
        <ChunkyButton label={resetArmed ? 'Tap again to erase everything' : 'Reset progress'} color={C.kumkum} under={C.kumkumDeep}
          onPress={() => {
            if (!resetArmed) { setResetArmed(true); setTimeout(() => setResetArmed(false), 4000); return; }
            setResetArmed(false);
            replaceState({ ...defaultState(content.rules), settings: state.settings, profile: state.profile, grownups: state.grownups, onboarded: true, voices: state.voices });
            setMsg('Progress erased.');
          }} />
      </Card>
      {msg ? <Body>{msg}</Body> : null}
    </Page>
  );
}
