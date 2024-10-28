import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { from as observableFrom, Observable, of as observableOf } from 'rxjs';

import { MetaSettings } from '../models/meta-settings';
import { PageTitlePositioning } from '../models/page-title-positioning';
import { MetaLoader } from '../factories/meta.loader';
import { isObservable, isPromise } from '../models/util';

@Injectable({
    providedIn: 'root'
})
export class MetaService {
    protected readonly settings: MetaSettings;
    private readonly isMetaTagSet: Record<string, boolean>;

    constructor(readonly loader: MetaLoader, private readonly title: Title, private readonly meta: Meta) {
        this.settings = loader.settings;
        this.isMetaTagSet = {};
    }

    setTitle(title: string, override = false): void {
        const title$ = title ? this.callback(title) : observableOf('');

        title$.subscribe((res: string | null) => {
            let fullTitle = null;

            if (!res) {
                const defaultTitle$ =
                    this.settings.defaults && this.settings.defaults.title ? this.callback(this.settings.defaults.title) : observableOf('');

                defaultTitle$.subscribe((defaultTitle: string | null) => {
                    if (!override && this.settings.pageTitleSeparator && this.settings.applicationName) {
                        this.callback(this.settings.applicationName).subscribe((applicationName: string | null) => {
                                fullTitle = applicationName ? this.getTitleWithPositioning(defaultTitle, applicationName) : defaultTitle;
                                this.updateTitle(fullTitle);
                        });
                    } else {
                        this.updateTitle(defaultTitle);
                    }
                });
            } else if (!override && this.settings.pageTitleSeparator && this.settings.applicationName) {
                this.callback(this.settings.applicationName).subscribe((applicationName: string | null) => {
                    fullTitle = applicationName ? this.getTitleWithPositioning(res, applicationName) : res;
                    this.updateTitle(fullTitle);
                });
            } else {
                this.updateTitle(res);
            }
        });
    }

    setTag(key: string, value: string): void {
        if (key === 'title') {
            throw new Error(
                `Attempt to set ${key} through "setTag": "title" is a reserved tag name. ` + 'Please use `MetaService.setTitle` instead.'
            );
        }

        const cur: string = value || ((this.settings.defaults && this.settings.defaults[key] !== undefined ? this.settings.defaults[key] : '') as string);

        const value$ = key !== 'og:locale' && key !== 'og:locale:alternate' ? this.callback(cur) : observableOf(cur);

        value$.subscribe((res: string | null) => {
            if (typeof res ===  'string') {
                this.updateTag(key, res);
            }
        });
    }


    update(
        currentUrl: string,
        metaSettings?: { [x: string]: string; disabled: string; title: string; override: string; } | undefined
    ): void {
        if (!metaSettings) {
            const fallbackTitle = this.settings.defaults?.title || this.settings.applicationName || '';

            this.setTitle(fallbackTitle, true);
        } else {
            if (metaSettings.disabled) {
                this.update(currentUrl);

                return;
            }

            this.setTitle(metaSettings.title, !!metaSettings.override);

            Object.keys(metaSettings).forEach(key => {
                let value = metaSettings[key];

                if (key === 'title' || key === 'override') {
                    return;
                } else if (key === 'og:locale') {
                    value = value.replace(/-/g, '_');
                } else if (key === 'og:locale:alternate') {
                    const currentLocale = metaSettings['og:locale'];
                    this.updateLocales(currentLocale, metaSettings[key]);

                    return;
                }

                this.setTag(key, value);
            });
        }

        if (this.settings.defaults) {
            Object.keys(this.settings.defaults).forEach(key => {
                let value = this.settings.defaults?.[key] || '';

                if ((metaSettings && (key in this.isMetaTagSet || key in metaSettings)) || key === 'title' || key === 'override') {
                    return;
                } else if (key === 'og:locale') {
                    value = value.replace(/-/g, '_');
                } else if (key === 'og:locale:alternate') {
                    const currentLocale = metaSettings ? metaSettings['og:locale'] : '';
                    this.updateLocales(currentLocale, value);

                    return;
                }

                this.setTag(key, value);
            });
        }

        const baseUrl = this.settings.applicationUrl ? this.settings.applicationUrl : '/';
        const url = `${baseUrl}${currentUrl}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2').replace(/\/$/g, '');

        this.setTag('og:url', url ? url : '/');
    }

    removeTag(key: string): void {
        this.meta.removeTag(key);
    }

    private callback(value: string): Observable<string | null> {
        if (this.settings.callback) {
            const value$ = this.settings.callback(value);

            if (!isObservable(value$)) {
                return isPromise(value$) ? observableFrom(value$) : observableOf(value$);
            }

            return value$;
        }

        return observableOf(value);
    }

    private getTitleWithPositioning(title: string | null, applicationName: string): string {
        switch (this.settings.pageTitlePositioning) {
            case PageTitlePositioning.AppendPageTitle:
                return applicationName + String(this.settings.pageTitleSeparator) + title;
            case PageTitlePositioning.PrependPageTitle:
                return title + String(this.settings.pageTitleSeparator) + applicationName;
            default:
                throw new Error(`Invalid pageTitlePositioning specified [${this.settings.pageTitlePositioning}]!`);
        }
    }

    private updateTitle(title: string | null): void {
        if (typeof title === 'string') {
            this.title.setTitle(title);
            this.meta.updateTag({
                property: 'og:title',
                content: title
            });
        }
    }

    private updateLocales(currentLocale: string, availableLocales: string): void {
        const cur = currentLocale || (this.settings.defaults ? this.settings.defaults['og:locale'] : '');

        if (cur && this.settings.defaults) {
            this.settings.defaults['og:locale'] = cur.replace(/_/g, '-');
        }

        // TODO: set HTML lang attribute - https://github.com/ngx-meta/core/issues/32
        // const html = this.document.querySelector('html');
        // html.setAttribute('lang', cur);

        const elements = this.meta.getTags('property="og:locale:alternate"');

        elements.forEach((element: HTMLMetaElement) => {
            this.meta.removeTagElement(element);
        });

        if (cur && availableLocales) {
            availableLocales.split(',').forEach((locale: string) => {
                if (cur.replace(/-/g, '_') !== locale.replace(/-/g, '_')) {
                    this.meta.addTag({
                        property: 'og:locale:alternate',
                        content: locale.replace(/-/g, '_')
                    });
                }
            });
        }
    }

    private updateTag(key: string, value: string): void {
        if (key.lastIndexOf('og:', 0) === 0) {
            this.meta.updateTag({
                property: key,
                content: key === 'og:locale' ? value.replace(/-/g, '_') : value
            });
        } else {
            this.meta.updateTag({
                name: key,
                content: value
            });
        }

        this.isMetaTagSet[key] = true;

        if (key === 'description') {
            this.meta.updateTag({
                property: 'og:description',
                content: value
            });
        } else if (key === 'author') {
            this.meta.updateTag({
                property: 'og:author',
                content: value
            });
        } else if (key === 'publisher') {
            this.meta.updateTag({
                property: 'og:publisher',
                content: value
            });
        } else if (key === 'og:locale') {
            const availableLocales = this.settings.defaults?.['og:locale:alternate'] || '';

            this.updateLocales(value, availableLocales);
            this.isMetaTagSet['og:locale:alternate'] = true;
        } else if (key === 'og:locale:alternate') {
            const currentLocale = this.meta.getTag('property="og:locale"')?.content || '';

            this.updateLocales(currentLocale, value);
            this.isMetaTagSet['og:locale'] = true;
        }
    }
}
