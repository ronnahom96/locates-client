import axios, { AxiosResponse } from 'axios';
import { Locate } from './interfaces';

const baseUrl = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session';

export const allocateFromBroker = (sessionId: string, symbol: string, quantity: number) => {
    const params = { symbol, quantity };
    return axios.post(`${baseUrl}/${sessionId}/broker`, null, {
        params
    });
};

export const updateLocates = (sessionId: string, locates: Locate[]): Promise<AxiosResponse<any>> => {
    const machineRequests: Record<string, Record<string, number>> = {};

    for (const { machine, symbol, quantity } of locates) {
        if (!machineRequests[machine]) {
            machineRequests[machine] = {};
        }

        machineRequests[machine][symbol] = quantity;
    }

    return axios.put(`${baseUrl}/${sessionId}/locates`, machineRequests);
};