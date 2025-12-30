declare function readMemory(path: string): any | null;
declare function readAllMemories(): Record<string, any>;
export declare function getMemories(): Record<string, any>;
export declare function getMemory(type: 'initial' | 'technical' | 'code'): any;
export { readAllMemories, readMemory };
//# sourceMappingURL=read-memory.d.ts.map