import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Switch, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, drop } from '../theme';

/** Scrollable grown-up page with a title and an optional back button. */
export function Page({ title, back, children }: { title: string; back?: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.jasmine }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40, paddingHorizontal: 16 }}>
      <View style={{ maxWidth: 760, width: '100%', alignSelf: 'center', gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {back && (
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/grownups'))} accessibilityRole="button" accessibilityLabel="Back"
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.ink }}>‹</Text>
            </Pressable>
          )}
          <Text style={{ fontFamily: F.heavy, fontSize: 28, color: C.ink, flex: 1 }}>{title}</Text>
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ backgroundColor: '#FFFFFF', borderRadius: R.lg, padding: 16, gap: 10, ...drop(C.cardShadow, 4) }, style]}>{children}</View>;
}

export function Label({ children, color = C.inkMuted }: { children: ReactNode; color?: string }) {
  return <Text style={{ fontFamily: F.heavy, fontSize: 13, letterSpacing: 1.2, color }}>{children}</Text>;
}

export function Body({ children, muted, size = 16 }: { children: ReactNode; muted?: boolean; size?: number }) {
  return <Text style={{ fontFamily: F.medium, fontSize: size, color: muted ? C.inkMuted : C.inkSoft, lineHeight: size * 1.4 }}>{children}</Text>;
}

/** A tappable row that opens another grown-up page. */
export function LinkRow({ icon, title, sub, href }: { icon: string; title: string; sub?: string; href: string }) {
  return (
    <Pressable onPress={() => router.push(href as never)} accessibilityRole="link"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? 0.6 : 1, minHeight: 56 })}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.heavy, fontSize: 18, color: C.ink }}>{title}</Text>
        {sub ? <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.inkMuted }}>{sub}</Text> : null}
      </View>
      <Text style={{ fontFamily: F.heavy, fontSize: 22, color: C.inkMuted }}>›</Text>
    </Pressable>
  );
}

export function Segmented<T extends string | number>({ label, value, options, onChange, render }: {
  label: string; value: T; options: readonly T[]; onChange: (v: T) => void; render?: (v: T) => string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', minHeight: 48 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink, flexShrink: 1 }}>{label}</Text>
      <View style={{ flexDirection: 'row', borderRadius: R.pill, backgroundColor: C.jasmine, padding: 3 }} accessibilityRole="radiogroup">
        {options.map((o) => (
          <Pressable key={String(o)} onPress={() => onChange(o)} accessibilityRole="radio" accessibilityState={{ checked: o === value }}
            style={{ minWidth: 48, minHeight: 40, paddingHorizontal: 12, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: o === value ? C.ink : 'transparent' }}>
            <Text style={{ fontFamily: F.heavy, fontSize: 15, color: o === value ? '#FFFFFF' : C.ink }}>{render ? render(o) : String(o)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ToggleRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>{label}</Text>
        {sub ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.inkMuted }}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.peacock, false: C.cardShadow }} accessibilityLabel={label} />
    </View>
  );
}
