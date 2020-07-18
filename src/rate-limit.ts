import { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { httpClientConfig, httpClientError } from './types';

const attempts: any = {}
let networkErrorAttempts = 0

export default function rateLimit (
    instance: AxiosInstance,
    config: httpClientConfig
) {
    const { requestLogger, responseLogger } = config

    instance.interceptors.request.use(function (config: AxiosRequestConfig) {
        return config
    }, function (error) {
        return Promise.reject(error)
    })

    instance.interceptors.response.use((response) => {
        return response
    }, (error: httpClientError) => {
        let { response, config: RequestConfig } = error

        if (!config || !config.retryOnError) {
            return Promise.reject(error)
        }
        let retryErrorType = null
        let wait = 0

        // Errors without response did not recieve anything from the server
        if (!response) {
            retryErrorType = 'Connection'
            networkErrorAttempts++

            if (networkErrorAttempts > config.retryLimit) {
                error.attempts
                return Promise.reject(error)
            }

            wait = Math.pow(Math.SQRT2, networkErrorAttempts)
            response = {} as AxiosResponse
        } else {
            networkErrorAttempts = 0
        }

        if (response.status >= 500 && response.status < 600) {
            // 5** errors are server related
            retryErrorType = `Server ${response.status}`
            const headers = response.headers || {}
            const requestId = headers['x-delivc-request-id'] || null
            attempts[requestId] = attempts[requestId] || 0
            attempts[requestId]++

            // we reject if there are too many errors with the same
            // request id or request id is not defined
            if (attempts[requestId] > config.retryLimit || !requestId) {
                error.attempts = attempts[requestId]
                return Promise.reject(error)
            }
            wait = Math.pow(Math.SQRT2, attempts[requestId])
        } else if (response.status === 429) {
            // 429 errors are exceeded rate limit exceptions
            retryErrorType = 'Rate limit'
            // all headers are lowercased by axios https://github.com/mzabriskie/axios/issues/413
            if (response.headers && error.response.headers['x-delivc-ratelimit-reset']) {
                wait = response.headers['x-delivc-ratelimit-reset']
            }
        }
        const delay = (ms: number) => new Promise((resolve) => {
            setTimeout(resolve, ms)
        })

        if (retryErrorType) {
            // convert to ms and add jitter
            wait = Math.floor(wait * 1000 + (Math.random() * 200) + 500)
            config.logHandler('warning', `${retryErrorType} error occurred. Waiting for ${wait} ms before retrying...`)
        
            /* Somehow between the interceptor and retrying the request the httpAgent/httpsAgent
             * gets transformed from an Agent-like object to a regular object,
             * causing failures on retries after rate limits.
             * Removing these properties here fixes the error, but retry
             * requests still use the original http/httpsAgent property
             */
            delete RequestConfig.httpAgent
            delete RequestConfig.httpsAgent
        
            return delay(wait).then(() => instance(RequestConfig))
        }

        return Promise.reject(error)
    })
}