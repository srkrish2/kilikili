import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { art, type ArtName } from '../generated/art';
import type { Word } from '../core';

export function Art({ name, width, height }: { name: ArtName; width: number; height?: number }) {
  return <SvgXml xml={art[name]} width={width} height={height ?? width} />;
}

/** Illustrated word picture, or the emoji until the art exists. */
export function WordPicture({ word, size }: { word: Word; size: number }) {
  const name = `word-${word.id}` as ArtName;
  if (word.art && name in art) return <Art name={name} width={size} />;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.7 }}>{word.emoji}</Text>
    </View>
  );
}
