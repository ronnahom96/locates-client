import axios from 'axios';

const baseUrl = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session';

export const allocateFromBroker = (sessionId: string | null, symbol: string, quantity: number) => {
    if (!sessionId) return console.error("Still don't have session id");

    const params = { symbol, quantity };
    return axios.post(`${baseUrl}/${sessionId}/broker`, null, {
        params
    });
};