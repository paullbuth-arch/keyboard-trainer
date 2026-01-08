// src/features/typing-test/utils/keyboardData.ts

export type FingerId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface FingerTheme {
    name: string;
    label: string;
    hex: string;       // 用于内联样式 (Glow 效果)
    bgClass: string;   // 用于 Tailwind 类名 (避免动态拼接失效)
    borderClass: string;
}

export interface KeyConfig {
    id: string;
    label: string;
    sub?: string;
    width?: number;
    finger: FingerId;
    code: string;
}

// 颜色配置 (包含 HEX 以便实现精确的发光效果)
export const FINGER_THEME: Record<FingerId, FingerTheme> = {
    0: { name: 'Left Pinky', label: '左手小指', hex: '#ec4899', bgClass: 'bg-pink-500', borderClass: 'border-pink-500' },
    1: { name: 'Left Ring', label: '左手无名指', hex: '#a855f7', bgClass: 'bg-purple-500', borderClass: 'border-purple-500' },
    2: { name: 'Left Middle', label: '左手中指', hex: '#3b82f6', bgClass: 'bg-blue-500', borderClass: 'border-blue-500' },
    3: { name: 'Left Index', label: '左手食指', hex: '#06b6d4', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-500' },
    4: { name: 'Thumb', label: '拇指', hex: '#9ca3af', bgClass: 'bg-gray-400', borderClass: 'border-gray-400' },
    5: { name: 'Right Index', label: '右手食指', hex: '#14b8a6', bgClass: 'bg-teal-500', borderClass: 'border-teal-500' },
    6: { name: 'Right Middle', label: '右手中指', hex: '#22c55e', bgClass: 'bg-green-500', borderClass: 'border-green-500' },
    7: { name: 'Right Ring', label: '右手无名指', hex: '#eab308', bgClass: 'bg-yellow-500', borderClass: 'border-yellow-500' },
    8: { name: 'Right Pinky', label: '右手小指', hex: '#f97316', bgClass: 'bg-orange-500', borderClass: 'border-orange-500' },
};

const k = (label: string, finger: FingerId, code: string, width = 1, sub?: string): KeyConfig => ({
    id: code, label, finger, code, width, sub
});

// QWERTY 布局数据
export const KEYBOARD_LAYOUT: KeyConfig[][] = [
    [
        k('`', 0, 'Backquote', 1, '~'), k('1', 0, 'Digit1', 1, '!'), k('2', 1, 'Digit2', 1, '@'), k('3', 2, 'Digit3', 1, '#'), k('4', 3, 'Digit4', 1, '$'), k('5', 3, 'Digit5', 1, '%'),
        k('6', 5, 'Digit6', 1, '^'), k('7', 5, 'Digit7', 1, '&'), k('8', 6, 'Digit8', 1, '*'), k('9', 7, 'Digit9', 1, '('), k('0', 8, 'Digit0', 1, ')'),
        k('-', 8, 'Minus', 1, '_'), k('=', 8, 'Equal', 1, '+'), k('Backspace', 8, 'Backspace', 2)
    ],
    [
        k('Tab', 0, 'Tab', 1.5), k('Q', 0, 'KeyQ'), k('W', 1, 'KeyW'), k('E', 2, 'KeyE'), k('R', 3, 'KeyR'), k('T', 3, 'KeyT'),
        k('Y', 5, 'KeyY'), k('U', 5, 'KeyU'), k('I', 6, 'KeyI'), k('O', 7, 'KeyO'), k('P', 8, 'KeyP'),
        k('[', 8, 'BracketLeft', 1, '{'), k(']', 8, 'BracketRight', 1, '}'), k('\\', 8, 'Backslash', 1.5, '|')
    ],
    [
        k('Caps', 0, 'CapsLock', 1.8), k('A', 0, 'KeyA'), k('S', 1, 'KeyS'), k('D', 2, 'KeyD'), k('F', 3, 'KeyF'), k('G', 3, 'KeyG'),
        k('H', 5, 'KeyH'), k('J', 5, 'KeyJ'), k('K', 6, 'KeyK'), k('L', 7, 'KeyL'),
        k(';', 8, 'Semicolon', 1, ':'), k("'", 8, 'Quote', 1, '"'), k('Enter', 8, 'Enter', 2.2)
    ],
    [
        k('Shift', 0, 'ShiftLeft', 2.4), k('Z', 0, 'KeyZ'), k('X', 1, 'KeyX'), k('C', 2, 'KeyC'), k('V', 3, 'KeyV'), k('B', 3, 'KeyB'),
        k('N', 5, 'KeyN'), k('M', 5, 'KeyM'), k(',', 6, 'Comma', 1, '<'), k('.', 7, 'Period', 1, '>'), k('/', 8, 'Slash', 1, '?'),
        k('Shift', 8, 'ShiftRight', 2.8)
    ],
    [
        k('Space', 4, 'Space', 7)
    ]
];

export const getActiveKeyId = (char: string): string | null => {
    if (!char) return null;
    const upper = char.toUpperCase();
    const map: Record<string, string> = {
        ' ': 'Space', '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
        '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
        '_': 'Minus', '+': 'Equal', '{': 'BracketLeft', '}': 'BracketRight', '|': 'Backslash',
        ':': 'Semicolon', '"': 'Quote', '<': 'Comma', '>': 'Period', '?': 'Slash', '~': 'Backquote'
    };
    if (map[char]) return map[char];
    for (const row of KEYBOARD_LAYOUT) {
        const key = row.find(k => k.label === upper);
        if (key) return key.code;
    }
    return null;
};