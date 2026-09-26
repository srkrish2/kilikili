import { useState } from 'react';
import { useApp } from '../../state/AppState';

/** [isOpen, pass]: re-renders the page once the gate is passed. */
export function useGate(): [boolean, () => void] {
  const { gateOpen, openGate } = useApp();
  const [, bump] = useState(0);
  return [gateOpen(), () => { openGate(); bump((n) => n + 1); }];
}
