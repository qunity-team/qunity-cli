/**
 * Created by rockyl on 2020-03-16.
 */
export declare function dealScriptsDependencies(): {
    name: string;
    resolveId(id: any): any;
    load(id: any): string;
};
