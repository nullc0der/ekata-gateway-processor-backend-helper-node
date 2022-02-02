import { create } from 'apisauce'
import get from 'lodash/get'
import crypto from 'crypto'

import {
    EKATA_GATEWAY_PROCESSOR_MAINNET_API_URL,
    EKATA_GATEWAY_PROCESSOR_TESTNET_API_URL,
} from './constants'

export interface CreatePaymentFormData {
    amount: Number
    fiatCurrency: string
    projectID: string
    apiKey: string
    testnet?: boolean
}

export interface PaymentFormData {
    id: string
    createdOn: string
}

export interface VerifyPayloadData {
    payload: any
    signatureSecret: string
}

interface InvalidArgs {
    amount?: string
    fiatCurrency?: string
    projectID?: string
    apiKey?: string
}

class GatewayError extends Error {
    invalidArgs?: InvalidArgs
}

export function createPaymentForm(
    createPaymentFormData: CreatePaymentFormData
) {
    const api = create({
        baseURL: !createPaymentFormData.testnet
            ? EKATA_GATEWAY_PROCESSOR_MAINNET_API_URL
            : EKATA_GATEWAY_PROCESSOR_TESTNET_API_URL,
        headers: { Accept: 'application/json' },
    })
    const data = {
        amount_requested: createPaymentFormData.amount,
        fiat_currency: createPaymentFormData.fiatCurrency,
        project_id: createPaymentFormData.projectID,
        api_key: createPaymentFormData.apiKey,
    }
    return new Promise<PaymentFormData>((resolve, reject) => {
        api.post<PaymentFormData, any>('/payment-form/create', data).then(
            (response) => {
                if (response.ok) {
                    const paymentFormData: PaymentFormData = {
                        id: get(response.data, 'id', ''),
                        createdOn: get(response.data, 'created_on', ''),
                    }
                    resolve(paymentFormData)
                } else {
                    if (response.status === 422) {
                        let invalidArgs: InvalidArgs = {}
                        for (const detail of get(response.data, 'detail', [])) {
                            if (detail.loc[1] === 'amount_requested') {
                                invalidArgs = {
                                    ...invalidArgs,
                                    amount: detail.msg,
                                }
                            }
                            if (detail.loc[1] === 'fiat_currency') {
                                invalidArgs = {
                                    ...invalidArgs,
                                    fiatCurrency: detail.msg,
                                }
                            }
                            if (detail.loc[1] === 'project_id') {
                                invalidArgs = {
                                    ...invalidArgs,
                                    projectID: detail.msg,
                                }
                            }
                            if (detail.loc[1] === 'api_key') {
                                invalidArgs = {
                                    ...invalidArgs,
                                    apiKey: detail.msg,
                                }
                            }
                        }
                        let error = new GatewayError('Invalid Args')
                        error.invalidArgs = invalidArgs
                        reject(error)
                    }
                    if (response.status === 404) {
                        reject(
                            new GatewayError(get(response.data, 'detail', ''))
                        )
                    }
                    if (response.status === 400) {
                        reject(
                            new GatewayError(get(response.data, 'detail', ''))
                        )
                    }
                    if (
                        response.problem === 'NETWORK_ERROR' ||
                        response.problem === 'CONNECTION_ERROR' ||
                        response.problem === 'TIMEOUT_ERROR'
                    ) {
                        reject(new GatewayError('Network issue'))
                    }
                }
            }
        )
    })
}

export function verifyPayload(verifyPayloadData: VerifyPayloadData) {
    const message = `${verifyPayloadData.payload.payment_id}${verifyPayloadData.payload.wallet_address}${verifyPayloadData.payload.currency_name}`
    const signature = crypto
        .createHmac('sha256', verifyPayloadData.signatureSecret)
        .update(message)
        .digest('hex')
    return verifyPayloadData.payload.signature === signature
}
