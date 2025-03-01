import { mergeApplicationConfig, ApplicationConfig } from '@angular/core'
import { provideServerRendering } from '@angular/platform-server'
import { provideServerRoutesConfig } from '@angular/ssr'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { appConfig } from './app.config'
import { serverRoutes } from './app.routes.server'

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRoutesConfig(serverRoutes),
    provideHttpClient(withFetch()) // ✅ Enable Fetch API for SSR
  ]
}

export const config = mergeApplicationConfig(appConfig, serverConfig)
