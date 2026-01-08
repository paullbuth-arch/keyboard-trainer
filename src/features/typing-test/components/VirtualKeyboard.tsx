// src/features/typing-test/components/VirtualKeyboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypingStore } from '../store/typingStore';
import { KEYBOARD_LAYOUT, FINGER_THEME, getActiveKeyId } from '../utils/keyboardData';

export const VirtualKeyboard = () => {
    // 1. 获取打字状态
    const { typedText, targetText } = useTypingStore();
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    // 2. 计算当前目标按键
    const currentChar = targetText[typedText.length] || '';
    const activeKeyCode = getActiveKeyId(currentChar);

    // 3. 查找该按键对应的手指信息
    let activeFinger = null;
    if (activeKeyCode) {
        for (const row of KEYBOARD_LAYOUT) {
            const key = row.find((k) => k.code === activeKeyCode);
            if (key) {
                activeFinger = FINGER_THEME[key.finger];
                break;
            }
        }
    }

    // 4. 监听键盘物理按压
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => setPressedKeys((prev) => new Set(prev).add(e.code));
        const handleKeyUp = (e: KeyboardEvent) => setPressedKeys((prev) => {
            const next = new Set(prev);
            next.delete(e.code);
            return next;
        });

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto p-4 mt-8 select-none">

            {/* --- HUD 顶部提示条 --- */}
            <div className="h-10 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {currentChar && activeFinger && (
                        <motion.div
                            key={currentChar}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-3 bg-black/60 backdrop-blur-sm border px-6 py-2 rounded-full shadow-lg transition-colors duration-300"
                            style={{ borderColor: activeFinger.hex }} // 动态边框色
                        >
                            {/* 手指徽章 */}
                            <span
                                className={`text-xs font-bold px-2 py-0.5 rounded text-white shadow-sm uppercase tracking-wider ${activeFinger.bgClass}`}
                                style={{ boxShadow: `0 0 10px ${activeFinger.hex}` }}
                            >
                                {activeFinger.name}
                            </span>

                            {/* 文字提示 */}
                            <span className="text-slate-300 text-sm font-medium">
                                Press <span className="text-white font-mono text-lg mx-1 font-bold">
                                    {currentChar === ' ' ? 'Space' : currentChar}
                                </span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- 键盘主体 --- */}
            <div className="relative bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex flex-col gap-2 relative z-10">
                    {KEYBOARD_LAYOUT.map((row, i) => (
                        <div key={i} className="flex gap-2 justify-center">
                            {row.map((key) => {
                                const isActive = key.code === activeKeyCode;
                                const isPressed = pressedKeys.has(key.code);
                                const theme = FINGER_THEME[key.finger];

                                return (
                                    <div
                                        key={key.id}
                                        className="relative flex items-center justify-center"
                                        style={{ width: `${key.width! * 54}px`, height: '54px' }}
                                    >
                                        <motion.div
                                            animate={{
                                                y: isPressed ? 4 : 0,
                                                borderBottomWidth: isPressed ? 0 : 4
                                            }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            className={`
                        absolute inset-0 
                        flex flex-col items-center justify-center
                        rounded-lg border-b-4
                        transition-colors duration-150
                        ${isActive
                                                    ? `text-white z-10 ${theme.bgClass}` // 激活态：使用主题背景色
                                                    : 'bg-slate-800 border-slate-950 text-slate-400' // 默认态
                                                }
                      `}
                                            style={{
                                                // 只有在激活时，才使用动态阴影和边框色
                                                boxShadow: isActive ? `0 0 25px ${theme.hex}, 0 0 5px ${theme.hex}` : 'none',
                                                borderColor: isActive ? theme.hex : undefined // 激活时底部边框也变色
                                            }}
                                        >
                                            {key.sub && (
                                                <span className="absolute top-1 left-2 text-[10px] opacity-60">
                                                    {key.sub}
                                                </span>
                                            )}
                                            <span className="font-mono font-bold text-lg">
                                                {key.label}
                                            </span>
                                        </motion.div>

                                        {/* 键槽底部阴影 */}
                                        <div className="absolute inset-x-1 -bottom-2 h-2 bg-black/50 rounded-b-lg -z-10 blur-[1px]" />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VirtualKeyboard;