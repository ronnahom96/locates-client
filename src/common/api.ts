import axios, { AxiosError, AxiosResponse } from 'axios';

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
const baseURL = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session';

export const allocateFromBroker = (sessionId: string, symbol: string, quantity: number) => {
    const params = { symbol, quantity };
    return axios.post(`${baseURL}/${sessionId}/broker`, null, { params });
};

export const updateLocates = (sessionId: string, newAllocation: Record<string, Record<string, number>>): Promise<AxiosResponse<any>> => {
    return axios.put(`${baseURL}/${sessionId}/locates`, newAllocation);
};

export const executeMultipleRequest = async (requests: Promise<unknown>[], delayMs: number = 1000) => {
    let responseArray: unknown[] = [];

    async function executeRequest(request: Promise<unknown> | undefined) {
        if (requests.length === 0) return responseArray;

        try {
            const response = await request;
            responseArray = [...responseArray, response];
            const nextRequest = requests.shift();
            await executeRequest(nextRequest);
        } catch (error: unknown) {
            if (error instanceof AxiosError && error.response && error.response.status === 429) {
                await delay(delayMs);
                const nextRequest = requests.shift();
                await executeRequest(nextRequest);
            } else {
                throw error;
            }
        }
    }

    const request = requests.shift();
    await executeRequest(request);

    return responseArray;
}
