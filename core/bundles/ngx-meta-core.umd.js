(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/platform-browser'), require('rxjs')) :
    typeof define === 'function' && define.amd ? define('@ngx-meta/core', ['exports', '@angular/core', '@angular/platform-browser', 'rxjs'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global['ngx-meta'] = global['ngx-meta'] || {}, global['ngx-meta'].core = {}), global.ng.core, global.ng.platformBrowser, global.rxjs));
}(this, (function (exports, i0, i2, rxjs) { 'use strict';

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var i0__namespace = /*#__PURE__*/_interopNamespace(i0);
    var i2__namespace = /*#__PURE__*/_interopNamespace(i2);

    exports.PageTitlePositioning = void 0;
    (function (PageTitlePositioning) {
        PageTitlePositioning[PageTitlePositioning["AppendPageTitle"] = 0] = "AppendPageTitle";
        PageTitlePositioning[PageTitlePositioning["PrependPageTitle"] = 10] = "PrependPageTitle";
    })(exports.PageTitlePositioning || (exports.PageTitlePositioning = {}));

    var MetaLoader = /** @class */ (function () {
        function MetaLoader() {
        }
        return MetaLoader;
    }());
    var MetaStaticLoader = /** @class */ (function () {
        function MetaStaticLoader(providedSettings) {
            if (providedSettings === void 0) { providedSettings = {
                pageTitlePositioning: exports.PageTitlePositioning.PrependPageTitle,
                defaults: {}
            }; }
            this.providedSettings = providedSettings;
        }
        Object.defineProperty(MetaStaticLoader.prototype, "settings", {
            get: function () {
                return this.providedSettings;
            },
            enumerable: false,
            configurable: true
        });
        return MetaStaticLoader;
    }());

    var isPromise = function (obj) { return !!obj && typeof obj.then === 'function'; };
    var isObservable = function (obj) { return !!obj && typeof obj.subscribe === 'function'; };

    var MetaService = /** @class */ (function () {
        function MetaService(loader, title, meta) {
            this.loader = loader;
            this.title = title;
            this.meta = meta;
            this.settings = loader.settings;
            this.isMetaTagSet = {};
        }
        MetaService.prototype.setTitle = function (title, override) {
            var _this = this;
            if (override === void 0) { override = false; }
            var title$ = title ? this.callback(title) : rxjs.of('');
            title$.subscribe(function (res) {
                var fullTitle = '';
                if (!res) {
                    var defaultTitle$ = _this.settings.defaults && _this.settings.defaults.title ? _this.callback(_this.settings.defaults.title) : rxjs.of('');
                    defaultTitle$.subscribe(function (defaultTitle) {
                        if (!override && _this.settings.pageTitleSeparator && _this.settings.applicationName) {
                            _this.callback(_this.settings.applicationName).subscribe(function (applicationName) {
                                fullTitle = applicationName ? _this.getTitleWithPositioning(defaultTitle, applicationName) : defaultTitle;
                                _this.updateTitle(fullTitle);
                            });
                        }
                        else {
                            _this.updateTitle(defaultTitle);
                        }
                    });
                }
                else if (!override && _this.settings.pageTitleSeparator && _this.settings.applicationName) {
                    _this.callback(_this.settings.applicationName).subscribe(function (applicationName) {
                        fullTitle = applicationName ? _this.getTitleWithPositioning(res, applicationName) : res;
                        _this.updateTitle(fullTitle);
                    });
                }
                else {
                    _this.updateTitle(res);
                }
            });
        };
        MetaService.prototype.setTag = function (key, value) {
            var _this = this;
            if (key === 'title') {
                throw new Error("Attempt to set " + key + " through \"setTag\": \"title\" is a reserved tag name. " + 'Please use `MetaService.setTitle` instead.');
            }
            var cur = value || (this.settings.defaults && this.settings.defaults[key] ? this.settings.defaults[key] : '');
            var value$ = key !== 'og:locale' && key !== 'og:locale:alternate' ? this.callback(cur) : rxjs.of(cur);
            value$.subscribe(function (res) {
                _this.updateTag(key, res);
            });
        };
        MetaService.prototype.update = function (currentUrl, metaSettings) {
            var _this = this;
            if (!metaSettings) {
                var fallbackTitle = this.settings.defaults
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
                Object.keys(metaSettings).forEach(function (key) {
                    var value = metaSettings[key];
                    if (key === 'title' || key === 'override') {
                        return;
                    }
                    else if (key === 'og:locale') {
                        value = value.replace(/-/g, '_');
                    }
                    else if (key === 'og:locale:alternate') {
                        var currentLocale = metaSettings['og:locale'];
                        _this.updateLocales(currentLocale, metaSettings[key]);
                        return;
                    }
                    _this.setTag(key, value);
                });
            }
            if (this.settings.defaults) {
                Object.keys(this.settings.defaults).forEach(function (key) {
                    var value = _this.settings.defaults[key];
                    if ((metaSettings && (key in _this.isMetaTagSet || key in metaSettings)) || key === 'title' || key === 'override') {
                        return;
                    }
                    else if (key === 'og:locale') {
                        value = value.replace(/-/g, '_');
                    }
                    else if (key === 'og:locale:alternate') {
                        var currentLocale = metaSettings ? metaSettings['og:locale'] : undefined;
                        _this.updateLocales(currentLocale, value);
                        return;
                    }
                    _this.setTag(key, value);
                });
            }
            var baseUrl = this.settings.applicationUrl ? this.settings.applicationUrl : '/';
            var url = ("" + baseUrl + currentUrl).replace(/(https?:\/\/)|(\/)+/g, '$1$2').replace(/\/$/g, '');
            this.setTag('og:url', url ? url : '/');
        };
        MetaService.prototype.removeTag = function (key) {
            this.meta.removeTag(key);
        };
        MetaService.prototype.callback = function (value) {
            if (this.settings.callback) {
                var value$ = this.settings.callback(value);
                if (!isObservable(value$)) {
                    return isPromise(value$) ? rxjs.from(value$) : rxjs.of(value$);
                }
                return value$;
            }
            return rxjs.of(value);
        };
        MetaService.prototype.getTitleWithPositioning = function (title, applicationName) {
            switch (this.settings.pageTitlePositioning) {
                case exports.PageTitlePositioning.AppendPageTitle:
                    return applicationName + String(this.settings.pageTitleSeparator) + title;
                case exports.PageTitlePositioning.PrependPageTitle:
                    return title + String(this.settings.pageTitleSeparator) + applicationName;
                default:
                    throw new Error("Invalid pageTitlePositioning specified [" + this.settings.pageTitlePositioning + "]!");
            }
        };
        MetaService.prototype.updateTitle = function (title) {
            this.title.setTitle(title);
            this.meta.updateTag({
                property: 'og:title',
                content: title
            });
        };
        MetaService.prototype.updateLocales = function (currentLocale, availableLocales) {
            var _this = this;
            var cur = currentLocale || (this.settings.defaults ? this.settings.defaults['og:locale'] : '');
            if (cur && this.settings.defaults) {
                this.settings.defaults['og:locale'] = cur.replace(/_/g, '-');
            }
            var elements = this.meta.getTags('property="og:locale:alternate"');
            elements.forEach(function (element) {
                _this.meta.removeTagElement(element);
            });
            if (cur && availableLocales) {
                availableLocales.split(',').forEach(function (locale) {
                    if (cur.replace(/-/g, '_') !== locale.replace(/-/g, '_')) {
                        _this.meta.addTag({
                            property: 'og:locale:alternate',
                            content: locale.replace(/-/g, '_')
                        });
                    }
                });
            }
        };
        MetaService.prototype.updateTag = function (key, value) {
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
                var availableLocales = this.settings.defaults ? this.settings.defaults['og:locale:alternate'] : '';
                this.updateLocales(value, availableLocales);
                this.isMetaTagSet['og:locale:alternate'] = true;
            }
            else if (key === 'og:locale:alternate') {
                var currentLocale = this.meta.getTag('property="og:locale"').content;
                this.updateLocales(currentLocale, value);
                this.isMetaTagSet['og:locale'] = true;
            }
        };
        return MetaService;
    }());
    MetaService.ɵprov = i0__namespace.ɵɵdefineInjectable({ factory: function MetaService_Factory() { return new MetaService(i0__namespace.ɵɵinject(MetaLoader), i0__namespace.ɵɵinject(i2__namespace.Title), i0__namespace.ɵɵinject(i2__namespace.Meta)); }, token: MetaService, providedIn: "root" });
    MetaService.decorators = [
        { type: i0.Injectable, args: [{
                    providedIn: 'root'
                },] }
    ];
    MetaService.ctorParameters = function () { return [
        { type: MetaLoader },
        { type: i2.Title },
        { type: i2.Meta }
    ]; };

    var MetaGuard = /** @class */ (function () {
        function MetaGuard(meta) {
            this.meta = meta;
        }
        MetaGuard.prototype.canActivate = function (route, state) {
            var url = state.url;
            var metaSettings = route.hasOwnProperty('data') ? route.data.meta : undefined;
            this.meta.update(url, metaSettings);
            return true;
        };
        MetaGuard.prototype.canActivateChild = function (route, state) {
            return this.canActivate(route, state);
        };
        return MetaGuard;
    }());
    MetaGuard.ɵprov = i0__namespace.ɵɵdefineInjectable({ factory: function MetaGuard_Factory() { return new MetaGuard(i0__namespace.ɵɵinject(MetaService)); }, token: MetaGuard, providedIn: "root" });
    MetaGuard.decorators = [
        { type: i0.Injectable, args: [{
                    providedIn: 'root'
                },] }
    ];
    MetaGuard.ctorParameters = function () { return [
        { type: MetaService }
    ]; };

    var metaFactory = function () { return new MetaStaticLoader(); };
    var MetaModule = /** @class */ (function () {
        function MetaModule(parentModule) {
            if (parentModule) {
                throw new Error('MetaModule already loaded; import in root module only.');
            }
        }
        MetaModule.forRoot = function (configuredProvider) {
            if (configuredProvider === void 0) { configuredProvider = {
                provide: MetaLoader,
                useFactory: metaFactory
            }; }
            return {
                ngModule: MetaModule,
                providers: [configuredProvider, MetaGuard, MetaService]
            };
        };
        return MetaModule;
    }());
    MetaModule.decorators = [
        { type: i0.NgModule }
    ];
    MetaModule.ctorParameters = function () { return [
        { type: MetaModule, decorators: [{ type: i0.Optional }, { type: i0.SkipSelf }] }
    ]; };

    exports.MetaGuard = MetaGuard;
    exports.MetaLoader = MetaLoader;
    exports.MetaModule = MetaModule;
    exports.MetaService = MetaService;
    exports.MetaStaticLoader = MetaStaticLoader;
    exports.metaFactory = metaFactory;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ngx-meta-core.umd.js.map
