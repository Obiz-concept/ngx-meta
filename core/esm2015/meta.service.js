import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { from as observableFrom, of as observableOf } from 'rxjs';
import { MetaLoader } from './meta.loader';
import { PageTitlePositioning } from './models/page-title-positioning';
import { isObservable, isPromise } from './util';
import * as i0 from "@angular/core";
import * as i1 from "./meta.loader";
import * as i2 from "@angular/platform-browser";
export class MetaService {
    constructor(loader, title, meta) {
        this.loader = loader;
        this.title = title;
        this.meta = meta;
        this.settings = loader.settings;
        this.isMetaTagSet = {};
    }
    setTitle(title, override = false) {
        const title$ = title ? this.callback(title) : observableOf('');
        title$.subscribe((res) => {
            let fullTitle = '';
            if (!res) {
                const defaultTitle$ = this.settings.defaults && this.settings.defaults.title ? this.callback(this.settings.defaults.title) : observableOf('');
                defaultTitle$.subscribe((defaultTitle) => {
                    if (!override && this.settings.pageTitleSeparator && this.settings.applicationName) {
                        this.callback(this.settings.applicationName).subscribe((applicationName) => {
                            fullTitle = applicationName ? this.getTitleWithPositioning(defaultTitle, applicationName) : defaultTitle;
                            this.updateTitle(fullTitle);
                        });
                    }
                    else {
                        this.updateTitle(defaultTitle);
                    }
                });
            }
            else if (!override && this.settings.pageTitleSeparator && this.settings.applicationName) {
                this.callback(this.settings.applicationName).subscribe((applicationName) => {
                    fullTitle = applicationName ? this.getTitleWithPositioning(res, applicationName) : res;
                    this.updateTitle(fullTitle);
                });
            }
            else {
                this.updateTitle(res);
            }
        });
    }
    setTag(key, value) {
        if (key === 'title') {
            throw new Error(`Attempt to set ${key} through "setTag": "title" is a reserved tag name. ` + 'Please use `MetaService.setTitle` instead.');
        }
        const cur = value || (this.settings.defaults && this.settings.defaults[key] ? this.settings.defaults[key] : '');
        const value$ = key !== 'og:locale' && key !== 'og:locale:alternate' ? this.callback(cur) : observableOf(cur);
        value$.subscribe((res) => {
            this.updateTag(key, res);
        });
    }
    update(currentUrl, metaSettings) {
        if (!metaSettings) {
            const fallbackTitle = this.settings.defaults
                ? this.settings.defaults.title || this.settings.applicationName
                : this.settings.applicationName;
            this.setTitle(fallbackTitle, true);
        }
        else {
            if (metaSettings.disabled) {
                this.update(currentUrl);
                return;
            }
            this.setTitle(metaSettings.title, metaSettings.override);
            Object.keys(metaSettings).forEach(key => {
                let value = metaSettings[key];
                if (key === 'title' || key === 'override') {
                    return;
                }
                else if (key === 'og:locale') {
                    value = value.replace(/-/g, '_');
                }
                else if (key === 'og:locale:alternate') {
                    const currentLocale = metaSettings['og:locale'];
                    this.updateLocales(currentLocale, metaSettings[key]);
                    return;
                }
                this.setTag(key, value);
            });
        }
        if (this.settings.defaults) {
            Object.keys(this.settings.defaults).forEach(key => {
                let value = this.settings.defaults[key];
                if ((metaSettings && (key in this.isMetaTagSet || key in metaSettings)) || key === 'title' || key === 'override') {
                    return;
                }
                else if (key === 'og:locale') {
                    value = value.replace(/-/g, '_');
                }
                else if (key === 'og:locale:alternate') {
                    const currentLocale = metaSettings ? metaSettings['og:locale'] : undefined;
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
    removeTag(key) {
        this.meta.removeTag(key);
    }
    callback(value) {
        if (this.settings.callback) {
            const value$ = this.settings.callback(value);
            if (!isObservable(value$)) {
                return isPromise(value$) ? observableFrom(value$) : observableOf(value$);
            }
            return value$;
        }
        return observableOf(value);
    }
    getTitleWithPositioning(title, applicationName) {
        switch (this.settings.pageTitlePositioning) {
            case PageTitlePositioning.AppendPageTitle:
                return applicationName + String(this.settings.pageTitleSeparator) + title;
            case PageTitlePositioning.PrependPageTitle:
                return title + String(this.settings.pageTitleSeparator) + applicationName;
            default:
                throw new Error(`Invalid pageTitlePositioning specified [${this.settings.pageTitlePositioning}]!`);
        }
    }
    updateTitle(title) {
        this.title.setTitle(title);
        this.meta.updateTag({
            property: 'og:title',
            content: title
        });
    }
    updateLocales(currentLocale, availableLocales) {
        const cur = currentLocale || (this.settings.defaults ? this.settings.defaults['og:locale'] : '');
        if (cur && this.settings.defaults) {
            this.settings.defaults['og:locale'] = cur.replace(/_/g, '-');
        }
        const elements = this.meta.getTags('property="og:locale:alternate"');
        elements.forEach((element) => {
            this.meta.removeTagElement(element);
        });
        if (cur && availableLocales) {
            availableLocales.split(',').forEach((locale) => {
                if (cur.replace(/-/g, '_') !== locale.replace(/-/g, '_')) {
                    this.meta.addTag({
                        property: 'og:locale:alternate',
                        content: locale.replace(/-/g, '_')
                    });
                }
            });
        }
    }
    updateTag(key, value) {
        if (key.lastIndexOf('og:', 0) === 0) {
            this.meta.updateTag({
                property: key,
                content: key === 'og:locale' ? value.replace(/-/g, '_') : value
            });
        }
        else {
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
        }
        else if (key === 'author') {
            this.meta.updateTag({
                property: 'og:author',
                content: value
            });
        }
        else if (key === 'publisher') {
            this.meta.updateTag({
                property: 'og:publisher',
                content: value
            });
        }
        else if (key === 'og:locale') {
            const availableLocales = this.settings.defaults ? this.settings.defaults['og:locale:alternate'] : '';
            this.updateLocales(value, availableLocales);
            this.isMetaTagSet['og:locale:alternate'] = true;
        }
        else if (key === 'og:locale:alternate') {
            const currentLocale = this.meta.getTag('property="og:locale"').content;
            this.updateLocales(currentLocale, value);
            this.isMetaTagSet['og:locale'] = true;
        }
    }
}
MetaService.ɵprov = i0.ɵɵdefineInjectable({ factory: function MetaService_Factory() { return new MetaService(i0.ɵɵinject(i1.MetaLoader), i0.ɵɵinject(i2.Title), i0.ɵɵinject(i2.Meta)); }, token: MetaService, providedIn: "root" });
MetaService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
MetaService.ctorParameters = () => [
    { type: MetaLoader },
    { type: Title },
    { type: Meta }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcGFja2FnZXMvQG5neC1tZXRhL2NvcmUvc3JjL21ldGEuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzNDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDeEQsT0FBTyxFQUFFLElBQUksSUFBSSxjQUFjLEVBQWMsRUFBRSxJQUFJLFlBQVksRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUU5RSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLE1BQU0sUUFBUSxDQUFDOzs7O0FBS2pELE1BQU0sT0FBTyxXQUFXO0lBSXRCLFlBQXFCLE1BQWtCLEVBQW1CLEtBQVksRUFBbUIsSUFBVTtRQUE5RSxXQUFNLEdBQU4sTUFBTSxDQUFZO1FBQW1CLFVBQUssR0FBTCxLQUFLLENBQU87UUFBbUIsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUNqRyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDaEMsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUFhLEVBQUUsUUFBUSxHQUFHLEtBQUs7UUFDdEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFL0QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQVcsRUFBRSxFQUFFO1lBQy9CLElBQUksU0FBUyxHQUFH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U0FBUyxDQUFDO2dCQUNsQixRQUFRLEVBQUUsV0FBVztnQkFDckIsT0FBTyxFQUFFLEtBQUs7YUFDZixDQUFDLENBQUM7U0FDSjthQUFNLElBQUksR0FBRyxLQUFLLFdBQVcsRUFBRTtZQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbEIsUUFBUSxFQUFFLGNBQWM7Z0JBQ3hCLE9BQU8sRUFBRSxLQUFLO2FBQ2YsQ0FBQyxDQUFDO1NBQ0o7YUFBTSxJQUFJLEdBQUcsS0FBSyxXQUFXLEVBQUU7WUFDOUIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBRXJHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNqRDthQUFNLElBQUksR0FBRyxLQUFLLHFCQUFxQixFQUFFO1lBQ3hDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUMsT0FBTyxDQUFDO1lBRXZFLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDO1NBQ3ZDO0lBQ0gsQ0FBQzs7OztZQWpPRixVQUFVLFNBQUM7Z0JBQ1YsVUFBVSxFQUFFLE1BQU07YUFDbkI7OztZQVBRLFVBQVU7WUFISixLQUFLO1lBQVgsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE1ldGEsIFRpdGxlIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5pbXBvcnQgeyBmcm9tIGFzIG9ic2VydmFibGVGcm9tLCBPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YgfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHsgTWV0YUxvYWRlciB9IGZyb20gJy4vbWV0YS5sb2FkZXInO1xuaW1wb3J0IHsgTWV0YVNldHRpbmdzIH0gZnJvbSAnLi9tb2RlbHMvbWV0YS1zZXR0aW5ncyc7XG5pbXBvcnQgeyBQYWdlVGl0bGVQb3NpdGlvbmluZyB9IGZyb20gJy4vbW9kZWxzL3BhZ2UtdGl0bGUtcG9zaXRpb25pbmcnO1xuaW1wb3J0IHsgaXNPYnNlcnZhYmxlLCBpc1Byb21pc2UgfSBmcm9tICcuL3V0aWwnO1xuXG5ASW5qZWN0YWJsZSh7XG4gIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBNZXRhU2VydmljZSB7XG4gIHByb3RlY3RlZCByZWFkb25seSBzZXR0aW5nczogTWV0YVNldHRpbmdzO1xuICBwcml2YXRlIHJlYWRvbmx5IGlzTWV0YVRhZ1NldDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGxvYWRlcjogTWV0YUxvYWRlciwgcHJpdmF0ZSByZWFkb25seSB0aXRsZTogVGl0bGUsIHByaXZhdGUgcmVhZG9ubHkgbWV0YTogTWV0YSkge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBsb2FkZXIuc2V0dGluZ3M7XG4gICAgdGhpcy5pc01ldGFUYWdTZXQgPSB7fTtcbiAgfVxuXG4gIHNldFRpdGxlKHRpdGxlOiBzdHJpbmcsIG92ZXJyaWRlID0gZmFsc2UpOiB2b2lkIHtcbiAgICBjb25zdCB0aXRsZSQgPSB0aXRsZSA/IHRoaXMuY2FsbGJhY2sodGl0bGUpIDogb2JzZXJ2YWJsZU9mKCcnKTtcblxuICAgIHRpdGxlJC5zdWJzY3JpYmUoKHJlczogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgZnVsbFRpdGxlID0gJyc7XG5cbiAgICAgIGlmICghcmVzKSB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRUaXRsZSQgPVxuICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZGVmYXVsdHMgJiYgdGhpcy5zZXR0aW5ncy5kZWZhdWx0cy50aXRsZSA/IHRoaXMuY2FsbGJhY2sodGhpcy5zZXR0aW5ncy5kZWZhdWx0cy50aXRsZSkgOiBvYnNlcnZhYmxlT2YoJycpO1xuXG4gICAgICAgIGRlZmF1bHRUaXRsZSQuc3Vic2NyaWJlKChkZWZhdWx0VGl0bGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGlmICghb3ZlcnJpZGUgJiYgdGhpcy5zZXR0aW5ncy5wYWdlVGl0bGVTZXBhcmF0b3IgJiYgdGhpcy5zZXR0aW5ncy5hcHBsaWNhdGlvbk5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5zZXR0aW5ncy5hcHBsaWNhdGlvbk5hbWUpLnN1YnNjcmliZSgoYXBwbGljYXRpb25OYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgZnVsbFRpdGxlID0gYXBwbGljYXRpb25OYW1lID8gdGhpcy5nZXRUaXRsZVdpdGhQb3NpdGlvbmluZyhkZWZhdWx0VGl0bGUsIGFwcGxpY2F0aW9uTmFtZSkgOiBkZWZhdWx0VGl0bGU7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlVGl0bGUoZnVsbFRpdGxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVRpdGxlKGRlZmF1bHRUaXRsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoIW92ZXJyaWRlICYmIHRoaXMuc2V0dGluZ3MucGFnZVRpdGxlU2VwYXJhdG9yICYmIHRoaXMuc2V0dGluZ3MuYXBwbGljYXRpb25OYW1lKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5zZXR0aW5ncy5hcHBsaWNhdGlvbk5hbWUpLnN1YnNjcmliZSgoYXBwbGljYXRpb25OYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBmdWxsVGl0bGUgPSBhcHBsaWNhdGlvbk5hbWUgPyB0aGlzLmdldFRpdGxlV2l0aFBvc2l0aW9uaW5nKHJlcywgYXBwbGljYXRpb25OYW1lKSA6IHJlcztcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRpdGxlKGZ1bGxUaXRsZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51cGRhdGVUaXRsZShyZXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2V0VGFnKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKGtleSA9PT0gJ3RpdGxlJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQXR0ZW1wdCB0byBzZXQgJHtrZXl9IHRocm91Z2ggXCJzZXRUYWdcIjogXCJ0aXRsZVwiIGlzIGEgcmVzZXJ2ZWQgdGFnIG5hbWUuIGAgKyAnUGxlYXNlIHVzZSBgTWV0YVNlcnZpY2Uuc2V0VGl0bGVgIGluc3RlYWQuJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBjdXIgPSB2YWx1ZSB8fCAodGhpcy5zZXR0aW5ncy5kZWZhdWx0cyAmJiB0aGlzLnNldHRpbmdzLmRlZmF1bHRzW2tleV0gPyB0aGlzLnNldHRpbmdzLmRlZmF1bHRzW2tleV0gOiAnJyk7XG5cbiAgICBjb25zdCB2YWx1ZSQgPSBrZXkgIT09ICdvZzpsb2NhbGUnICYmIGtleSAhPT0gJ29nOmxvY2FsZTphbHRlcm5hdGUnID8gdGhpcy5jYWxsYmFjayhjdXIpIDogb2JzZXJ2YWJsZU9mKGN1cik7XG5cbiAgICB2YWx1ZSQuc3Vic2NyaWJlKChyZXM6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy51cGRhdGVUYWcoa2V5LCByZXMpO1xuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlKGN1cnJlbnRVcmw6IHN0cmluZywgbWV0YVNldHRpbmdzPzogYW55KTogdm9pZCB7XG4gICAgaWYgKCFtZXRhU2V0dGluZ3MpIHtcbiAgICAgIGNvbnN0IGZhbGxiYWNrVGl0bGUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRzXG4gICAgICAgID8gdGhpcy5zZXR0aW5ncy5kZWZhdWx0cy50aXRsZSB8fCB0aGlzLnNldHRpbmdzLmFwcGxpY2F0aW9uTmFtZVxuICAgICAgICA6IHRoaXMuc2V0dGluZ3MuYXBwbGljYXRpb25OYW1lO1xuXG4gICAgICB0aGlzLnNldFRpdGxlKGZhbGxiYWNrVGl0bGUsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWV0YVNldHRpbmdzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMudXBkYXRlKGN1cnJlbnRVcmwpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zZXRUaXRsZShtZXRhU2V0dGluZ3MudGl0bGUsIG1ldGFTZXR0aW5ncy5vdmVycmlkZSk7XG5cbiAgICAgIE9iamVjdC5rZXlzKG1ldGFTZXR0aW5ncykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSBtZXRhU2V0dGluZ3Nba2V5XTtcblxuICAgICAgICBpZiAoa2V5ID09PSAndGl0bGUnIHx8IGtleSA9PT0gJ292ZXJyaWRlJykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdvZzpsb2NhbGUnKSB7XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC8tL2csICdfJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnb2c6bG9jYWxlOmFsdGVybmF0ZScpIHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50TG9jYWxlID0gbWV0YVNldHRpbmdzWydvZzpsb2NhbGUnXTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUxvY2FsZXMoY3VycmVudExvY2FsZSwgbWV0YVNldHRpbmdzW2tleV0pO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRUYWcoa2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5kZWZhdWx0cykge1xuICAgICAgT2JqZWN0LmtleXModGhpcy5zZXR0aW5ncy5kZWZhdWx0cykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRzW2tleV07XG5cbiAgICAgICAgaWYgKChtZXRhU2V0dGluZ3MgJiYgKGtleSBpbiB0aGlzLmlzTWV0YVRhZ1NldCB8fCBrZXkgaW4gbWV0YVNldHRpbmdzKSkgfHwga2V5ID09PSAndGl0bGUnIHx8IGtleSA9PT0gJ292ZXJyaWRlJykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICdvZzpsb2NhbGUnKSB7XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC8tL2csICdfJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnb2c6bG9jYWxlOmFsdGVybmF0ZScpIHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50TG9jYWxlID0gbWV0YVNldHRpbmdzID8gbWV0YVNldHRpbmdzWydvZzpsb2NhbGUnXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUxvY2FsZXMoY3VycmVudExvY2FsZSwgdmFsdWUpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRUYWcoa2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5zZXR0aW5ncy5hcHBsaWNhdGlvblVybCA/IHRoaXMuc2V0dGluZ3MuYXBwbGljYXRpb25VcmwgOiAnLyc7XG4gICAgY29uc3QgdXJsID0gYCR7YmFzZVVybH0ke2N1cnJlbnRVcmx9YC5yZXBsYWNlKC8oaHR0cHM/OlxcL1xcLyl8KFxcLykrL2csICckMSQyJykucmVwbGFjZSgvXFwvJC9nLCAnJyk7XG5cbiAgICB0aGlzLnNldFRhZygnb2c6dXJsJywgdXJsID8gdXJsIDogJy8nKTtcbiAgfVxuXG4gIHJlbW92ZVRhZyhrZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMubWV0YS5yZW1vdmVUYWcoa2V5KTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsbGJhY2sodmFsdWU6IHN0cmluZyk6IE9ic2VydmFibGU8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuY2FsbGJhY2spIHtcbiAgICAgIGNvbnN0IHZhbHVlJCA9IHRoaXMuc2V0dGluZ3MuY2FsbGJhY2sodmFsdWUpO1xuXG4gICAgICBpZiAoIWlzT2JzZXJ2YWJsZSh2YWx1ZSQpKSB7XG4gICAgICAgIHJldHVybiBpc1Byb21pc2UodmFsdWUkKSA/IG9ic2VydmFibGVGcm9tKHZhbHVlJCkgOiBvYnNlcnZhYmxlT2YodmFsdWUkKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbHVlJDtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VGl0bGVXaXRoUG9zaXRpb25pbmcodGl0bGU6IHN0cmluZywgYXBwbGljYXRpb25OYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAodGhpcy5zZXR0aW5ncy5wYWdlVGl0bGVQb3NpdGlvbmluZykge1xuICAgICAgY2FzZSBQYWdlVGl0bGVQb3NpdGlvbmluZy5BcHBlbmRQYWdlVGl0bGU6XG4gICAgICAgIHJldHVybiBhcHBsaWNhdGlvbk5hbWUgKyBTdHJpbmcodGhpcy5zZXR0aW5ncy5wYWdlVGl0bGVTZXBhcmF0b3IpICsgdGl0bGU7XG4gICAgICBjYXNlIFBhZ2VUaXRsZVBvc2l0aW9uaW5nLlByZXBlbmRQYWdlVGl0bGU6XG4gICAgICAgIHJldHVybiB0aXRsZSArIFN0cmluZyh0aGlzLnNldHRpbmdzLnBhZ2VUaXRsZVNlcGFyYXRvcikgKyBhcHBsaWNhdGlvbk5hbWU7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcGFnZVRpdGxlUG9zaXRpb25pbmcgc3BlY2lmaWVkIFske3RoaXMuc2V0dGluZ3MucGFnZVRpdGxlUG9zaXRpb25pbmd9XSFgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVRpdGxlKHRpdGxlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnRpdGxlLnNldFRpdGxlKHRpdGxlKTtcbiAgICB0aGlzLm1ldGEudXBkYXRlVGFnKHtcbiAgICAgIHByb3BlcnR5OiAnb2c6dGl0bGUnLFxuICAgICAgY29udGVudDogdGl0bGVcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlTG9jYWxlcyhjdXJyZW50TG9jYWxlOiBzdHJpbmcsIGF2YWlsYWJsZUxvY2FsZXM6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGN1ciA9IGN1cnJlbnRMb2NhbGUgfHwgKHRoaXMuc2V0dGluZ3MuZGVmYXVsdHMgPyB0aGlzLnNldHRpbmdzLmRlZmF1bHRzWydvZzpsb2NhbGUnXSA6ICcnKTtcblxuICAgIGlmIChjdXIgJiYgdGhpcy5zZXR0aW5ncy5kZWZhdWx0cykge1xuICAgICAgdGhpcy5zZXR0aW5ncy5kZWZhdWx0c1snb2c6bG9jYWxlJ10gPSBjdXIucmVwbGFjZSgvXy9nLCAnLScpO1xuICAgIH1cblxuICAgIC8vIFRPRE86IHNldCBIVE1MIGxhbmcgYXR0cmlidXRlIC0gaHR0cHM6Ly9naXRodWIuY29tL25neC1tZXRhL2NvcmUvaXNzdWVzLzMyXG4gICAgLy8gY29uc3QgaHRtbCA9IHRoaXMuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaHRtbCcpO1xuICAgIC8vIGh0bWwuc2V0QXR0cmlidXRlKCdsYW5nJywgY3VyKTtcblxuICAgIGNvbnN0IGVsZW1lbnRzID0gdGhpcy5tZXRhLmdldFRhZ3MoJ3Byb3BlcnR5PVwib2c6bG9jYWxlOmFsdGVybmF0ZVwiJyk7XG5cbiAgICBlbGVtZW50cy5mb3JFYWNoKChlbGVtZW50OiBhbnkpID0+IHtcbiAgICAgIHRoaXMubWV0YS5yZW1vdmVUYWdFbGVtZW50KGVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgaWYgKGN1ciAmJiBhdmFpbGFibGVMb2NhbGVzKSB7XG4gICAgICBhdmFpbGFibGVMb2NhbGVzLnNwbGl0KCcsJykuZm9yRWFjaCgobG9jYWxlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKGN1ci5yZXBsYWNlKC8tL2csICdfJykgIT09IGxvY2FsZS5yZXBsYWNlKC8tL2csICdfJykpIHtcbiAgICAgICAgICB0aGlzLm1ldGEuYWRkVGFnKHtcbiAgICAgICAgICAgIHByb3BlcnR5OiAnb2c6bG9jYWxlOmFsdGVybmF0ZScsXG4gICAgICAgICAgICBjb250ZW50OiBsb2NhbGUucmVwbGFjZSgvLS9nLCAnXycpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlVGFnKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKGtleS5sYXN0SW5kZXhPZignb2c6JywgMCkgPT09IDApIHtcbiAgICAgIHRoaXMubWV0YS51cGRhdGVUYWcoe1xuICAgICAgICBwcm9wZXJ0eToga2V5LFxuICAgICAgICBjb250ZW50OiBrZXkgPT09ICdvZzpsb2NhbGUnID8gdmFsdWUucmVwbGFjZSgvLS9nLCAnXycpIDogdmFsdWVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1ldGEudXBkYXRlVGFnKHtcbiAgICAgICAgbmFtZToga2V5LFxuICAgICAgICBjb250ZW50OiB2YWx1ZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5pc01ldGFUYWdTZXRba2V5XSA9IHRydWU7XG5cbiAgICBpZiAoa2V5ID09PSAnZGVzY3JpcHRpb24nKSB7XG4gICAgICB0aGlzLm1ldGEudXBkYXRlVGFnKHtcbiAgICAgICAgcHJvcGVydHk6ICdvZzpkZXNjcmlwdGlvbicsXG4gICAgICAgIGNvbnRlbnQ6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2F1dGhvcicpIHtcbiAgICAgIHRoaXMubWV0YS51cGRhdGVUYWcoe1xuICAgICAgICBwcm9wZXJ0eTogJ29nOmF1dGhvcicsXG4gICAgICAgIGNvbnRlbnQ6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3B1Ymxpc2hlcicpIHtcbiAgICAgIHRoaXMubWV0YS51cGRhdGVUYWcoe1xuICAgICAgICBwcm9wZXJ0eTogJ29nOnB1Ymxpc2hlcicsXG4gICAgICAgIGNvbnRlbnQ6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ29nOmxvY2FsZScpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUxvY2FsZXMgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRzID8gdGhpcy5zZXR0aW5ncy5kZWZhdWx0c1snb2c6bG9jYWxlOmFsdGVybmF0ZSddIDogJyc7XG5cbiAgICAgIHRoaXMudXBkYXRlTG9jYWxlcyh2YWx1ZSwgYXZhaWxhYmxlTG9jYWxlcyk7XG4gICAgICB0aGlzLmlzTWV0YVRhZ1NldFsnb2c6bG9jYWxlOmFsdGVybmF0ZSddID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ29nOmxvY2FsZTphbHRlcm5hdGUnKSB7XG4gICAgICBjb25zdCBjdXJyZW50TG9jYWxlID0gdGhpcy5tZXRhLmdldFRhZygncHJvcGVydHk9XCJvZzpsb2NhbGVcIicpLmNvbnRlbnQ7XG5cbiAgICAgIHRoaXMudXBkYXRlTG9jYWxlcyhjdXJyZW50TG9jYWxlLCB2YWx1ZSk7XG4gICAgICB0aGlzLmlzTWV0YVRhZ1NldFsnb2c6bG9jYWxlJ10gPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuIl19