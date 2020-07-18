import { AxiosProxyConfig, AxiosAdapter, AxiosError } from 'axios';

export interface httpClientError<T = any> extends AxiosError<T> {
    attempts?: number
}

export interface httpClientConfig {
    accessToken: string
    headers?: any
    // If we should use http instead
    insecure?: boolean
    host?: string
    // Alternate host
    defaultHostname?: string
    logHandler?: (level: string, data: Error | string) => void
    requestLogger?: (level: string, data: Error | string) => void
    responseLogger?: (level: string, data: Error | string) => void
    basePath?: string,
    httpAgent?: string
    httpsAgent?: string
    proxy?: AxiosProxyConfig | false
    timeout?: number
    adapter?: AxiosAdapter
    maxContentLength?: number
    baseURL?: string
    retryOnError?: boolean
    retryLimit?: number
}