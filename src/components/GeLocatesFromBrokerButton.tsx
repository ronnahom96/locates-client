/* eslint-disable */
import React, { useCallback, useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { Locates, MachineRequest } from '../common/types';
import { BrokerAllocate } from '../common/interfaces';

const baseUrl = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session';

interface GeLocatesFromBrokerButtonProps {
  sessionId: string | null;
  locates: Locates | null;
}

const GeLocatesFromBrokerButton: React.FC<GeLocatesFromBrokerButtonProps> = ({ sessionId, locates }) => {
  const [symbolRequests, setSymbolRequests] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!locates) return;

    // TODO: need to improve it
    const symbolToQuantity: Record<string, number> = {};
    const machineRequests: MachineRequest[] = Object.values(locates);
    machineRequests.forEach((machineRequest) => {
      Object.entries(machineRequest).forEach(([symbol, quantity]) => {
        symbolToQuantity[symbol] = symbolToQuantity[symbol] ? symbolToQuantity[symbol] + quantity : quantity;
      });
    });

    console.log(symbolToQuantity);
    setSymbolRequests(symbolToQuantity);
  }, [locates]);

  const handleRequestClick = async () => {
    const allRequests = Object.entries(symbolRequests).map(([symbol, quantity]) => getLocateFromBroker(symbol, quantity));
    const responseArray: AxiosResponse<BrokerAllocate>[] = (await Promise.all(allRequests)) as AxiosResponse<BrokerAllocate>[];
    const brokerAllocations: BrokerAllocate[] = responseArray.map((response) => response.data);
    console.log(brokerAllocations);
  };

  const getLocateFromBroker = useCallback(
    (symbol: string, quantity: number) => {
      if (!sessionId) return console.error("Still don't have session id");

      const params = { symbol, quantity };
      return axios.post(`${baseUrl}/${sessionId}/broker`, null, {
        params
      });
    },
    [sessionId]
  );

  return <button onClick={handleRequestClick}>Get Locates From Broker</button>;
};

export default GeLocatesFromBrokerButton;
