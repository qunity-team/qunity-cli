/**
 * Created by rockyl on 2018/7/5.
 */
/// <reference types="node" />
export declare function exit(err: any, code?: number): void;
export declare function childProcess(cmd: any, params: any, cwd?: string, printLog?: boolean): import("child_process").ChildProcessWithoutNullStreams;
export declare function childProcessSync(cmd: any, params: any, cwd?: any, printLog?: boolean): Promise<unknown>;
export declare function gitClone(url: any, path: any, cwd?: any): Promise<unknown>;
export declare function npmInstall(cwd?: any): Promise<unknown>;
export declare function npmRun(scriptName: any, cwd?: any): Promise<unknown>;
export declare function getMd5(fileOrBuffer: any): string;
