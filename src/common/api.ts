import axios, { AxiosResponse } from 'axios';

const baseUrl = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session';

export const allocateFromBroker = (sessionId: string, symbol: string, quantity: number) => {
    const params = { symbol, quantity };
    return axios.post(`${baseUrl}/${sessionId}/broker`, null, { params });
};

export const updateLocates = (sessionId: string, newAllocation: Record<string, Record<string, number>>): Promise<AxiosResponse<any>> => {
    return axios.put(`${baseUrl}/${sessionId}/locates`, newAllocation);
};