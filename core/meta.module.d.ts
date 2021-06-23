import { ModuleWithProviders } from '@angular/core';
import { MetaStaticLoader } from './meta.loader';
export declare const metaFactory: () => MetaStaticLoader;
export declare class MetaModule {
    static forRoot(configuredProvider?: any): ModuleWithProviders<MetaModule>;
    constructor(parentModule?: MetaModule);
}
