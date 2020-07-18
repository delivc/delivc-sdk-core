import { AxiosStatic, AxiosProxyConfig, AxiosRequestConfig } from 'axios'
import { isNode, getNodeVersion } from './utils'
var qs = require('qs')
import rateLimit from './rate-limit'
import { httpClientConfig } from './types'



// Matches 'sub.host:port' or 'host:port' and extracts hostname and port
// Also enforces toplevel domain specified, no spaces and no protocol
const HOST_REGEX = /^(?!\w+:\/\/)([^\s:]+\.?[^\s:]+)(?::(\d+))?(?!:)$/

const defaultLogHandler = (level: string, data: Error) => {
    if (level === 'error' && data) {
        const title = [data.name, data.message].filter((a) => a).join(' - ')
        console.error(`[error] ${title}`)
        console.error(data)
        return
    }
    console.log(`[${level}] ${data}`)
}

export default function createHttpClient(axios: AxiosStatic, options: httpClientConfig) {
    const httpConfig: httpClientConfig = {
        accessToken: options.accessToken,
        headers: options.headers ?? {},
        insecure: options.insecure ?? false,
        host: options.host,
        logHandler: options.logHandler ?? defaultLogHandler,
        responseLogger: options.responseLogger ?? defaultLogHandler,
        requestLogger: options.requestLogger ?? defaultLogHandler,
        basePath: options.basePath ?? '',
        baseURL: options.baseURL ?? '',
        httpAgent: options.httpAgent,
        httpsAgent: options.httpsAgent,
        proxy: options.proxy ?? false,
        timeout: options.timeout ?? 30000,
        maxContentLength: options.maxContentLength ?? 1073741824,
        defaultHostname: options.defaultHostname ?? '',
        retryOnError: options.retryOnError ?? false,
        retryLimit: options.retryLimit ?? 5
    }

    if (!httpConfig.accessToken) {
        const missingAccessTokenError = new TypeError("Expected paramter accessToken")
        httpConfig.logHandler('error', missingAccessTokenError)
        throw missingAccessTokenError
    }

    // construct axios baseURL option
    const protocol = httpConfig.insecure ? 'http' : 'https'
    let hostname = httpConfig.defaultHostname
    let port: string | number = httpConfig.insecure ? 80 : 443
    if (httpConfig.host && HOST_REGEX.test(httpConfig.host)) {
        const parsed = httpConfig.host.split(':')
        if (parsed.length === 2) {
            [hostname, port] = parsed
        } else {
            hostname = parsed[0]
        }
    }

    if (httpConfig.basePath) {
        httpConfig.basePath = `/${httpConfig.basePath.split('/').filter(Boolean).join('/')}`
    }

    const baseURL = options.baseURL || `${protocol}://${hostname}:${port}${httpConfig.basePath}`

    if (!httpConfig.headers['dc-access-key']) {
        httpConfig.headers['dc-access-key'] = httpConfig.accessToken
    }

    // Set these headers only for node because browsers don't like it when you
    // override user-agent or accept-encoding.
    // The SDKs should set their own X-Contentful-User-Agent.
    if (isNode()) {
        httpConfig.headers['user-agent'] = 'node.js/' + getNodeVersion()
        httpConfig.headers['Accept-Encoding'] = 'gzip'
    }

    const axiosOptions: AxiosRequestConfig = {
        // Axios
        baseURL,
        headers: httpConfig.headers,
        httpAgent: httpConfig.httpAgent,
        httpsAgent: httpConfig.httpsAgent,
        paramsSerializer: qs.stringify,
        proxy: httpConfig.proxy as AxiosProxyConfig | false,
        timeout: httpConfig.timeout,
        adapter: httpConfig.adapter,
        maxContentLength: httpConfig.maxContentLength,
    }

    const instance = axios.create(axiosOptions)
    rateLimit(instance, httpConfig)

    return instance
}