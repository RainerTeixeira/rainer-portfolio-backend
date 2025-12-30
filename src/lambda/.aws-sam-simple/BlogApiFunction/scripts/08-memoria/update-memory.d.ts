interface ProjectInfo {
    name: string;
    version: string;
    description: string;
    framework: string;
    language: string;
    database: string[];
    auth: string;
    testing: {
        framework: string;
        coverage: string;
        totalTests: number;
    };
    deployment: string;
    structure: {
        tests: string;
        docs: string;
        scripts: string;
        memories: string;
    };
}
declare function collectProjectInfo(): ProjectInfo;
declare function main(): void;
export { main, collectProjectInfo };
//# sourceMappingURL=update-memory.d.ts.map