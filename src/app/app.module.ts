import { AppComponent } from './app.component';
import { NgModule, isDevMode } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';

import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; 
import {ToastrModule} from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { MaterialModule } from './material-module';
import { NgxSpinnerModule } from 'ngx-spinner';

import { GoogleMapsModule } from '@angular/google-maps';
import { ServiceWorkerModule } from '@angular/service-worker';

// import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// Naye rxjs imports add karein:
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// export function HttpLoaderFactory(http: HttpClient) {
//   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
// }
// 1. Yeh naya Custom Loader banayein (Yeh error ko catch karega)
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`).pipe(
      // Error aane par crash nahi hoga, khali object {} return karega
      catchError(() => of({})) 
    );
  }
}

// 2. Apne purane HttpLoaderFactory ko update karein
export function HttpLoaderFactory(http: HttpClient) {
  // Purana code hata dein: return new TranslateHttpLoader(...)
  // Uski jagah ye likhein:
  return new CustomTranslateLoader(http); 
}
@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,FormsModule,ReactiveFormsModule,
    BrowserAnimationsModule,NgbCollapseModule
    // , MatTableExporterModule
    ,MaterialModule, 
    GoogleMapsModule,
     NgxSpinnerModule.forRoot({ type: 'ball-clip-rotate' }),
     TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
     ServiceWorkerModule.register('ngsw-worker.js', {
       enabled: !isDevMode(),
       registrationStrategy: 'registerWhenStable:30000'
     }),
     ToastrModule.forRoot(),

    //  ServiceWorkerModule.register('ngsw-worker.js', {
    //   enabled: environment.production,
    // }),
    //  NgxSpinnerModule.forRoot({ type: 'line-scale-party' }),
  ],
  // providers: [provideHttpClient(),{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  providers: [provideHttpClient()],
  // providers: [DatePipe, { provide: APP_BASE_HREF, useValue: '/mdang/' }, provideHttpClient(withInterceptorsFromDi())] })
  bootstrap: [AppComponent]
})
export class AppModule { }
