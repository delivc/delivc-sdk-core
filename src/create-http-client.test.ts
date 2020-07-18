import createHttpClient from './create-http-client'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)


function teardown() {
    mock.reset()
}
// jest.mock('axios')

describe('testing createHttpClient', () => {
    test('Calls axios with expected default URL', () => {
        const client = createHttpClient(axios, {
            accessToken: 'clientAccessToken',
            defaultHostname: 'defaulthost'
        })

        expect(client.defaults.baseURL).toEqual('https://defaulthost:443')
        teardown()
    })

    test('Calls axios based on passed host', () => {
        const client = createHttpClient(axios, {
            accessToken: 'clientAccessToken',
            host: 'delivc.com:8080',
        })
        expect(client.defaults.baseURL).toEqual('https://delivc.com:8080')
        teardown()
    })

    test('Calls axios based on passed host with insecure flag', () => {
        const client = createHttpClient(axios, {
            accessToken: 'clientAccessToken',
            host: 'delivc.com:321',
            insecure: true,
        })

        expect(client.defaults.baseURL).toEqual('http://delivc.com:321')
        teardown()
    })

    test('Calls axios based on passed hostname with insecure flag', () => {
        const client = createHttpClient(axios, {
            accessToken: 'clientAccessToken',
            host: 'delivc.com',
            insecure: true,
        })

        expect(client.defaults.baseURL).toEqual('http://delivc.com:80')
        teardown()
    })

    test('Calls axios based on passed headers', () => {
        const client = createHttpClient(axios, {
            accessToken: 'clientAccessToken',
            headers: {
                'X-Custom-Header': 'example',
                Authorization: 'Basic customAuth'
            }
        })

        expect(client.defaults.headers['X-Custom-Header']).toEqual('example')
        expect(client.defaults.headers['Authorization']).toEqual('Basic customAuth')
    })

    test('Fails with missing access token', () => {

        expect(() => {
            createHttpClient(axios, {} as any)
        }).toThrow()
    })
})