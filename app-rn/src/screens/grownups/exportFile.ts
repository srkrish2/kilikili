import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Hand the progress JSON to the share sheet (AirDrop, Files, email to yourself). */
export async function shareJson(name: string, text: string): Promise<string> {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(text);
  if (!(await Sharing.isAvailableAsync())) return 'Sharing is not available on this device. Use “Copy” instead.';
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Save Tamil Train progress' });
  return 'Progress file ready.';
}

export async function readPicked(uri: string): Promise<string> {
  return new File(uri).text();
}
