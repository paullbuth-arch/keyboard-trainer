// src/features/typing-test/components/VirtualKeyboard.tsx
'use client';

import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypingStore } from '../store/typingStore';
import { KEYBOARD_LAYOUT, FINGER_THEME, getActiveKeyId, FingerTheme, KeyConfig, FingerId } from '../utils/keyboardData';

// --- 子组件 1: 全息机械手 (Holographic Hands) ---
// 这是一个纯视觉组件，用于直观显示哪根手指高亮
const HolographicHands = ({ activeFingerId, activeColor }: { activeFingerId: FingerId | null, activeColor: string }) => {
    // 简化的手指路径数据 (示意图)
    // 0-4: 左手 (小指 -> 拇指), 5-8: 右手 (食指 -> 小指)
    // 注意：这里用简单的圆点和线条模拟手指关节，形成"赛博义肢"的感觉

    const fingers = [
        { id: 0, x: 20, y: 40, h: 25 }, // L-Pinky
        { id: 1, x: 45, y: 25, h: 40 }, // L-Ring
        { id: 2, x: 70, y: 15, h: 50 }, // L-Middle
        { id: 3, x: 95, y: 25, h: 40 }, // L-Index
        { id: 4, x: 125, y: 55, h: 25 }, // L-Thumb (Thumb is distinct)

        { id: 5, x: 175, y: 25, h: 40 }, // R-Index
        { id: 6, x: 200, y: 15, h: 50 }, // R-Middle
        { id: 7, x: 225, y: 25, h: 40 }, // R-Ring
        { id: 8, x: 250, y: 40, h: 25 }, // R-Pinky
    ];

    return (
        <div className="relative h-24 w-80 mx-auto opacity-80">
            <svg viewBox="0 0 270 100" className="w-full h-full drop-shadow-lg">
                {/* 手掌基座连接线 */}
                <path d="M 30 90 Q 75 70 120 90" stroke="#334155" strokeWidth="2" fill="none" />
                <path d="M 180 90 Q 225 70 270 90" stroke="#334155" strokeWidth="2" fill="none" />

                {fingers.map((f) => {
                    const isActive = f.id === activeFingerId;
                    // 右手拇指通常共用 Space，这里简单处理：如果是 Space(4)，左右拇指都亮? 
                    // 根据数据定义 4 是 Thumb (通用)，我们让左手拇指亮，或者可以在右边也加一个虚拟拇指。
                    // 暂时按标准键位图：4=Left/Common Thumb.

                    return (
                        <g key={f.id}>
                            {/* 关节连线 */}
                            <line
                                x1={f.x} y1={90} x2={f.x} y2={f.y}
                                stroke={isActive ? activeColor : "#334155"}
                                strokeWidth={isActive ? 3 : 1}
                                className="transition-colors duration-300"
                            />
                            {/* 指尖节点 */}
                            <circle
                                cx={f.x} cy={f.y} r={isActive ? 6 : 3}
                                fill={isActive ? activeColor : "#1e293b"}
                                stroke={isActive ? "white" : "#334155"}
                                strokeWidth={2}
                                className="transition-all duration-300"
                            >
                                {isActive && (
                                    <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite" />
                                )}
                            </circle>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// --- 子组件 2: 记忆化的键帽 (Memoized KeyCap) ---
// 只有当 isActive, isPressed 或 theme 改变时才重绘，极大提升性能
interface KeyCapProps {
    config: KeyConfig;
    isActive: boolean;
    isPressed: boolean;
    theme: FingerTheme;
}

const KeyCap = memo(({ config, isActive, isPressed, theme }: KeyCapProps) => {
    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: `${config.width! * 54}px`, height: '54px' }}
        >
            <motion.div
                animate={{
                    y: isPressed ? 4 : 0,
                    borderBottomWidth: isPressed ? 0 : 4
                }}
                transition={{ type: 'spring', stiffness: 600, damping: 30 }} // 更脆的机械手感
                className={`
          absolute inset-0 
          flex flex-col items-center justify-center
          rounded-lg border-b-4
          transition-colors duration-100
          ${isActive
                        ? `text-white z-10 ${theme.bgClass}`
                        : 'bg-slate-800 border-slate-950 text-slate-500'
                    }
        `}
                style={{
                    // 霓虹光晕：仅在激活时显示
                    boxShadow: isActive ? `0 0 20px ${theme.hex}, 0 0 4px ${theme.hex} inset` : 'none',
                    borderColor: isActive ? theme.hex : undefined
                }}
            >
                {config.sub && (
                    <span className={`absolute top-1 left-2 text-[10px] ${isActive ? 'opacity-80' : 'opacity-40'}`}>
                        {config.sub}
                    </span>
                )}
                <span className={`font-mono font-bold ${config.label.length > 1 ? 'text-xs' : 'text-xl'}`}>
                    {config.label}
                </span>
            </motion.div>

            {/* 键槽阴影 */}
            <div className="absolute inset-x-1 -bottom-2 h-2 bg-black/50 rounded-b-lg -z-10 blur-[1px]" />
        </div>
    );
}, (prev, next) => {
    // 自定义比较函数：只比较关键属性，避免对象引用变化导致的重绘
    return (
        prev.isActive === next.isActive &&
        prev.isPressed === next.isPressed &&
        prev.config.id === next.config.id
    );
});
KeyCap.displayName = 'KeyCap';


// --- 主组件 ---
export const VirtualKeyboard = () => {
    const { typedText, targetText } = useTypingStore();
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    // 计算逻辑
    const currentChar = targetText[typedText.length] || '';
    const activeKeyCode = getActiveKeyId(currentChar);

    // 查找手指信息
    let activeKeyConfig = null;
    let activeFingerInfo = null;

    if (activeKeyCode) {
        for (const row of KEYBOARD_LAYOUT) {
            const key = row.find((k) => k.code === activeKeyCode);
            if (key) {
                activeKeyConfig = key;
                activeFingerInfo = FINGER_THEME[key.finger];
                break;
            }
        }
    }

    // 键盘监听
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
        <div className="flex flex-col items-center gap-2 w-full max-w-5xl mx-auto p-4 mt-4 select-none">

            {/* --- HUD 区域：全息手 + 文字提示 --- */}
            <div className="relative h-32 w-full flex flex-col items-center justify-end pb-4">
                <AnimatePresence mode="wait">
                    {currentChar && activeFingerInfo ? (
                        <motion.div
                            key="hud-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-1"
                        >
                            {/* 1. 全息手可视化 */}
                            <HolographicHands
                                activeFingerId={activeKeyConfig?.finger ?? null}
                                activeColor={activeFingerInfo.hex}
                            />

                            {/* 2. 文字提示胶囊 */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center gap-3 bg-black/80 backdrop-blur border px-5 py-1.5 rounded-full shadow-2xl z-20"
                                style={{ borderColor: activeFingerInfo.hex, boxShadow: `0 0 15px -5px ${activeFingerInfo.hex}` }}
                            >
                                <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded text-black uppercase tracking-wider"
                                    style={{ backgroundColor: activeFingerInfo.hex }}
                                >
                                    {activeFingerInfo.name}
                                </span>
                                <span className="text-slate-400 text-xs font-mono">
                                    PRESS <span className="text-white text-base font-bold mx-1">{currentChar === ' ' ? 'SPACE' : currentChar}</span>
                                </span>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <div className="h-24" /> // 占位
                    )}
                </AnimatePresence>
            </div>

            {/* --- 键盘主体容器 --- */}
            <div className="relative bg-black/60 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden group">

                {/* 视觉增强 1: 全息扫描线 (Scanline) */}
                <div className="scanline-overlay" />

                {/* 视觉增强 2: 容器边缘微光 */}
                <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />

                <div className="flex flex-col gap-3 relative z-10">
                    {KEYBOARD_LAYOUT.map((row, i) => (
                        <div key={i} className="flex gap-2 justify-center">
                            {row.map((key) => (
                                <KeyCap
                                    key={key.id}
                                    config={key}
                                    isActive={key.code === activeKeyCode}
                                    isPressed={pressedKeys.has(key.code)}
                                    theme={FINGER_THEME[key.finger]}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VirtualKeyboard;