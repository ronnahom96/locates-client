/* eslint-disable */
import { AxiosResponse } from 'axios';
import React from 'react';
import { allocateFromBroker } from '../common/api';
import { BrokerAllocate } from '../common/interfaces';
import { Locates } from '../common/types';
import useSymbolQuantity from '../hooks/useSymbolQuantity';

interface BrokerAllocationButtonProps {
  sessionId: string | null;
  locates: Locates | null;
  updateLocates: (brokerAllocations: BrokerAllocate[]) => void;
}

const BrokerAllocationButton: React.FC<BrokerAllocationButtonProps> = ({ sessionId, locates, updateLocates }) => {
  const symbolQuantity = useSymbolQuantity(locates);

  const handleRequestClick = async () => {
    const allRequests = buildBrokerAllocationRequests();
    const responseArray: AxiosResponse<BrokerAllocate>[] = (await Promise.all(allRequests)) as AxiosResponse<BrokerAllocate>[];
    const brokerAllocations: BrokerAllocate[] = responseArray.map((response) => response.data);
    updateLocates(brokerAllocations);
  };

  const buildBrokerAllocationRequests = () =>
    Object.entries(symbolQuantity).map(([symbol, quantity]) => allocateFromBroker(sessionId, symbol, quantity));

  return <button onClick={handleRequestClick}>Get Locates From Broker</button>;
};

export default BrokerAllocationButton;
