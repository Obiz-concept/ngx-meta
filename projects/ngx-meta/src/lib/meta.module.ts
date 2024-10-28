import { EnvironmentProviders, ModuleWithProviders, NgModule, Optional, Provider, SkipSelf } from '@angular/core';
import { MetaLoader, MetaStaticLoader } from './factories/meta.loader';
import { MetaService } from './services/meta.service';

export const metaFactory = () => new MetaStaticLoader();

@NgModule()
export class MetaModule {
    static forRoot(
        configuredProvider: Provider | EnvironmentProviders = {
            provide: MetaLoader,
            useFactory: metaFactory
        }
    ): ModuleWithProviders<MetaModule> {
        return {
            ngModule: MetaModule,
            providers: [
                configuredProvider,
                MetaService
            ]
        };
    }

    constructor(@Optional() @SkipSelf() parentModule?: MetaModule) {
        if (parentModule) {
            throw new Error('MetaModule already loaded; import in root module only.');
        }
    }
}
