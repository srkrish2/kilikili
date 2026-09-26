import { Text, View } from 'react-native';
import { C, F } from '../../theme';

export default function Placeholder() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.jasmine }}><Text style={{ fontFamily: F.heavy, fontSize: 24, color: C.ink }}>grownups</Text></View>;
}
