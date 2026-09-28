export async function shareJson(name: string, text: string): Promise<string> {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'Progress file downloaded.';
}

export async function readPicked(uri: string): Promise<string> {
  return (await fetch(uri)).text();
}
