import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot } from '@angular/router';
import { MetaService } from './meta.service';
export declare class MetaGuard implements CanActivate, CanActivateChild {
    private readonly meta;
    constructor(meta: MetaService);
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean;
    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean;
}
