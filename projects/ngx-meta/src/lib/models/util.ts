import { Observable } from 'rxjs';

export const isPromise = (obj: {then:() => void;}): obj is Promise<unknown> => !!obj && typeof obj.then === 'function';

export const isObservable = (obj: {subscribe: () => void} | Observable<unknown>): obj is Observable<unknown> => !!obj && typeof obj.subscribe === 'function';
