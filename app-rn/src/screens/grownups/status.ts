import type { WordStatus } from '../../core';
import { C } from '../../theme';

export const STATUS_LABEL: Record<WordStatus, string> = { known: 'Knows it', emerging: 'Emerging', notyet: 'Not yet', new: 'Not tried' };
export const STATUS_BG: Record<WordStatus, string> = { known: '#D5F2EA', emerging: '#FCEBB8', notyet: '#FBDDE2', new: '#FFFFFF' };
export const STATUS_FG: Record<WordStatus, string> = { known: C.peacockDeep, emerging: '#9A6B00', notyet: C.kumkumDeep, new: C.inkMuted };
