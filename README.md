### Ekata Gateway Processor backend helper

#### Create form id

Use this function to create a form id from your backend, if successful it will return `id` and `createdOn`.

```javascript
const { createPaymentForm } = require('@ekataio/ekata-gateway-processor-helper')

createPaymentForm({
    amount: 100,
    fiatCurrency: 'USD',
    apiKey: '',
    projectID: '',
})
    .then((formData) => {
        console.log(formData)
        res.json({ formID: formData.id })
    })
    .catch((error) => {
        console.log(error)
        res.status(500).json({ error: 'Server error' })
    })
```

#### Verify payment payload

Use this function to verify payment payload received after successful payment

```javascript
const { verifyPayload } = require('@ekataio/ekata-gateway-processor-helper')
if (
    verifyPayload({
        payload: req.body,
        signatureSecret: '',
    })
) {
    res.json({ success: true })
    // Do rest of your checkout flow
} else {
    res.json({ success: false })
    // Show error to user
}
```
