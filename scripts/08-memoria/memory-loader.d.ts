export interface ProjectMemories {
    initial: any;
    technical: any;
    code: any;
    loadedAt: string;
}
export declare function loadProjectMemories(): ProjectMemories;
export declare function getProjectSummary(): {
    name: string;
    version: string;
    description: string;
    framework: string;
    database: string[];
    testing: {
        framework: string;
        coverage: string;
    };
};
export default loadProjectMemories;
//# sourceMappingURL=memory-loader.d.ts.map