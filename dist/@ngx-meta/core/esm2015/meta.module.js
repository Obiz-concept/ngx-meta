import { NgModule, Optional, SkipSelf } from '@angular/core';
import { MetaGuard } from './meta.guard';
import { MetaLoader, MetaStaticLoader } from './meta.loader';
import { MetaService } from './meta.service';
export const metaFactory = () => new MetaStaticLoader();
export class MetaModule {
    constructor(parentModule) {
        if (parentModule) {
            throw new Error('MetaModule already loaded; import in root module only.');
        }
    }
    static forRoot(configuredProvider = {
        provide: MetaLoader,
        useFactory: metaFactory
    }) {
        return {
            ngModule: MetaModule,
            providers: [configuredProvider, MetaGuard, MetaService]
        };
    }
}
MetaModule.decorators = [
    { type: NgModule }
];
MetaModule.ctorParameters = () => [
    { type: MetaModule, decorators: [{ type: Optional }, { type: SkipSelf }] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9Abmd4LW1ldGEvY29yZS9zcmMvbWV0YS5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUF1QixRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUVsRixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLGdCQUFnQixFQUFFLENBQUM7QUFHeEQsTUFBTSxPQUFPLFVBQVU7SUFhckIsWUFBb0MsWUFBeUI7UUFDM0QsSUFBSSxZQUFZLEVBQUU7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1NBQzNFO0lBQ0gsQ0FBQztJQWhCRCxNQUFNLENBQUMsT0FBTyxDQUNaLHFCQUEwQjtRQUN4QixPQUFPLEVBQUUsVUFBVTtRQUNuQixVQUFVLEVBQUUsV0FBVztLQUN4QjtRQUVELE9BQU87WUFDTCxRQUFRLEVBQUUsVUFBVTtZQUNwQixTQUFTLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDO1NBQ3hELENBQUM7SUFDSixDQUFDOzs7WUFaRixRQUFROzs7WUFjNEMsVUFBVSx1QkFBaEQsUUFBUSxZQUFJLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSwgT3B0aW9uYWwsIFNraXBTZWxmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IE1ldGFHdWFyZCB9IGZyb20gJy4vbWV0YS5ndWFyZCc7XG5pbXBvcnQgeyBNZXRhTG9hZGVyLCBNZXRhU3RhdGljTG9hZGVyIH0gZnJvbSAnLi9tZXRhLmxvYWRlcic7XG5pbXBvcnQgeyBNZXRhU2VydmljZSB9IGZyb20gJy4vbWV0YS5zZXJ2aWNlJztcblxuZXhwb3J0IGNvbnN0IG1ldGFGYWN0b3J5ID0gKCkgPT4gbmV3IE1ldGFTdGF0aWNMb2FkZXIoKTtcblxuQE5nTW9kdWxlKClcbmV4cG9ydCBjbGFzcyBNZXRhTW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoXG4gICAgY29uZmlndXJlZFByb3ZpZGVyOiBhbnkgPSB7XG4gICAgICBwcm92aWRlOiBNZXRhTG9hZGVyLFxuICAgICAgdXNlRmFjdG9yeTogbWV0YUZhY3RvcnlcbiAgICB9XG4gICk6IE1vZHVsZVdpdGhQcm92aWRlcnM8TWV0YU1vZHVsZT4ge1xuICAgIHJldHVybiB7XG4gICAgICBuZ01vZHVsZTogTWV0YU1vZHVsZSxcbiAgICAgIHByb3ZpZGVyczogW2NvbmZpZ3VyZWRQcm92aWRlciwgTWV0YUd1YXJkLCBNZXRhU2VydmljZV1cbiAgICB9O1xuICB9XG5cbiAgY29uc3RydWN0b3IoQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcGFyZW50TW9kdWxlPzogTWV0YU1vZHVsZSkge1xuICAgIGlmIChwYXJlbnRNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWV0YU1vZHVsZSBhbHJlYWR5IGxvYWRlZDsgaW1wb3J0IGluIHJvb3QgbW9kdWxlIG9ubHkuJyk7XG4gICAgfVxuICB9XG59XG4iXX0=