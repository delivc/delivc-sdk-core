import { AxiosStatic, AxiosProxyConfig, AxiosAdapter } from 'axios'
import { isNode, getNodeVersion } from './utils'
var qs = require('qs')
import { cloneDeep } from 'lodash'
import rateLimit from './rate-limit'

interface httpClientParams {
    accessToken: string
    // If we should use http instead
    insecure?: boolean
    // Alternate host
    defaultHostname?: string
    host?: string
    baseURL?: string
    httpAgent?: any
    httpsAgent?: any
    requestLogger?: Function
    responseLogger?: Function
    proxy?: AxiosProxyConfig | false
    adapter?: AxiosAdapter
    headers?: any
    retryLimit?: number
    logHandler?: (level: string, data: Error) => void
}

// Matches 'sub.host:port' or 'host:port' and extracts hostname and port
// Also enforces toplevel domain specified, no spaces and no protocol
const HOST_REGEX = /^(?!\w+:\/\/)([^\s:]+\.?[^\s:]+)(?::(\d+))?(?!:)$/

export default function createHttpClient(axios: AxiosStatic, options: httpClientParams) {
    const defaultConfig = {
        insecure: false,
        retryOnError: true,
        logHandler: (level: string, data: Error) => {
            if (level === 'error' && data) {
                const title = [data.name, data.message].filter((a) => a).join(' - ')
                console.error(`[error] ${title}`)
                console.error(data)
                return
            }
            console.log(`[${level}] ${data}`)
        },
        // passed to axios
        headers: {},
        httpAgent: false,
        httpsAgent: false,
        timeout: 30000,
        proxy: false,
        basePath: '',
        maxContentLength: 1073741824, // 1 GiB
        defaultHostname: ''
    }

    const config = {
        ...defaultConfig,
        ...options
    }

    if (!config.accessToken) {
        const missingAccessTokenError = new TypeError("Expected paramter accessToken")
        config.logHandler('error', missingAccessTokenError)
        throw missingAccessTokenError
    }

    // construct axios baseURL option
    const protocol = config.insecure ? 'http' : 'https'
    let hostname = config.defaultHostname
    let port: string | number = config.insecure ? 80 : 443
    if (config.host && HOST_REGEX.test(config.host)) {
        const parsed = config.host.split(':')
        if (parsed.length === 2) {
            [hostname, port] = parsed
        } else {
            hostname = parsed[0]
        }
    }

    if (config.basePath) {
        config.basePath = `/${config.basePath.split('/').filter(Boolean).join('/')}`
    }

    const baseURL = options.baseURL || `${protocol}://${hostname}:${port}${config.basePath}`

    if (!config.headers['dc-access-key']) {
        config.headers['dc-access-key'] = config.accessToken
    }

    // Set these headers only for node because browsers don't like it when you
    // override user-agent or accept-encoding.
    // The SDKs should set their own X-Contentful-User-Agent.
    if (isNode()) {
        config.headers['user-agent'] = 'node.js/' + getNodeVersion()
        config.headers['Accept-Encoding'] = 'gzip'
    }

    const axiosOptions: any = {
        // Axios
        baseURL,
        headers: config.headers,
        httpAgent: config.httpAgent,
        httpsAgent: config.httpsAgent,
        paramsSerializer: qs.stringify,
        proxy: config.proxy as AxiosProxyConfig | false,
        timeout: config.timeout,
        adapter: config.adapter,
        maxContentLength: config.maxContentLength,
        // delivc
        logHandler: config.logHandler,
        responseLogger: config.responseLogger,
        requestLogger: config.requestLogger,
        retryOnError: config.retryOnError
    }

    const instance = axios.create(axiosOptions)
    // @ts-ignore
    instance.httpClientParams = options
    /**
    * Creates a new axios instance with the same default base parameters as the
    * current one, and with any overrides passed to the newParams object
    * This is useful as the SDKs use dependency injection to get the axios library
    * and the version of the library comes from different places depending
    * on whether it's a browser build or a node.js build.
    * @private
    * @param {Object} httpClientParams - Initialization parameters for the HTTP client
    * @return {Object} Initialized axios instance
    */

    // @ts-ignore
    instance.cloneWithNewParams = function(newParams) {
        return createHttpClient(axios, {
            ...cloneDeep(options),
            ...newParams
        })
    }

    rateLimit(instance, config.retryLimit)
    return instance
}