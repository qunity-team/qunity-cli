/**
 * Created by rockyl on 2018/7/5.
 */
/// <reference types="node" />
export declare function exit(err: any, code?: number): void;
export declare function childProcess(cmd: any, params: any, cwd: any, printLog?: boolean): import("child_process").ChildProcessWithoutNullStreams;
export declare function childProcessSync(cmd: any, params: any, cwd: any, printLog?: boolean): Promise<unknown>;
export declare function gitClone(url: any, path: any): Promise<unknown>;
export declare function npmInstall(path: any): Promise<unknown>;
export declare function npmRun(path: any, scriptName: any): Promise<unknown>;
export declare function getMd5(fileOrBuffer: any): string;
