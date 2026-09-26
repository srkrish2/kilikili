// Family recordings on the device: audio/<slot>/<key>.m4a in the app's documents.
// Nothing here leaves the device (Kids-category rule).
import { Directory, File, Paths } from 'expo-file-system';

function dir(slot: string): Directory {
  const d = new Directory(Paths.document, 'audio', slot);
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

/** Keep a finished recording (the recorder's temp file) as this slot's voice for `key`. */
export async function saveRecording(slot: string, key: string, tempUri: string): Promise<void> {
  const dest = new File(dir(slot), `${key}.m4a`);
  if (dest.exists) dest.delete();
  await new File(tempUri).move(dest);
}

export async function recordingUri(slot: string, key: string): Promise<string | null> {
  const f = new File(Paths.document, 'audio', slot, `${key}.m4a`);
  return f.exists ? f.uri : null;
}

export async function deleteRecording(slot: string, key: string): Promise<void> {
  const f = new File(Paths.document, 'audio', slot, `${key}.m4a`);
  if (f.exists) f.delete();
}
