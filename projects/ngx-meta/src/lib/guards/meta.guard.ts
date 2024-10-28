import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn } from '@angular/router';
import { MetaService } from '../services/meta.service';

export const metaGuard: CanActivateFn|CanActivateChildFn = (route, state) => {
    const url = state.url;

    const metaSettings = Object.prototype.hasOwnProperty.call(route, 'data') ? route.data?.['meta'] : null;

    inject(MetaService).update(url, metaSettings);

    return true;
};
