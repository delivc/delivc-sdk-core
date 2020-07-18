import getUserAgent from './get-user-agent'

const headerRegEx = /(app|sdk|platform|integration|os) \S+(\/\d+.\d+.\d+(-[\w\d-]+)?)?;/igm

describe('testing getUserAgent', () => {

    test('Parse node user agent correctly', () => {
        const userAgent = getUserAgent("delivc.js/1.0.0", "myApplication/1.0.0", "myIntegration/1.0.0")
        expect(userAgent.match(headerRegEx).length).toEqual(5)
        expect(userAgent.indexOf('platform node.js/') !== -1).toBeTruthy()
        expect(userAgent.match(/node\.js\/\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/)).toBeTruthy()
    })

    
    test('Parse browser user agent correctly', () => {
        const userAgent = getUserAgent('delivc.js/1.0.0', 'myApplication/1.0.0', 'myIntegration/1.0.0')
        expect(userAgent.match(headerRegEx).length).toEqual(5)
        // expect(userAgent.indexOf('os macOS') !== -1).toBeTruthy()

    })

    test('fake browser environment', () => {
        const userAgent = getUserAgent('contentful.js/1.0.0', 'myApplication/1.0.0', 'myIntegration/1.0.0')
    })
})