/* eslint-disable */
import { AxiosResponse } from 'axios';
import React from 'react';
import { allocateFromBroker } from '../../common/api';
import { BrokerAllocate } from '../../common/interfaces';
import { Locates } from '../../common/types';
import useSymbolQuantity from '../../hooks/useSymbolQuantity';
import './BrokerAllocationButton.css';

interface BrokerAllocationButtonProps {
  sessionId: string | null;
  locates: Locates | null;
  updateNewLocates: (brokerAllocations: Record<string, number>) => void;
}

const fromRawToBrokerAllocationMap = (brokerAllocationRaw: BrokerAllocate[]) => {
  const brokerAllocations: Record<string, number> = {};
  for (const { symbol, quantity } of brokerAllocationRaw) {
    brokerAllocations[symbol] = quantity;
  }

  return brokerAllocations;
};

const BrokerAllocationButton: React.FC<BrokerAllocationButtonProps> = ({ sessionId, locates, updateNewLocates }) => {
  const symbolQuantity = useSymbolQuantity(locates);

  const handleRequestClick = async () => {
    if (!sessionId) return console.error('No Session found');

    const allRequests = buildBrokerAllocationRequests(sessionId);
    const responseArray: AxiosResponse<BrokerAllocate>[] = (await Promise.all(allRequests)) as AxiosResponse<BrokerAllocate>[];
    const brokerAllocationRaw = responseArray.map((response) => response.data);
    const brokerAllocations = fromRawToBrokerAllocationMap(brokerAllocationRaw);

    updateNewLocates(brokerAllocations);
  };

  const buildBrokerAllocationRequests = (sessionId: string) =>
    Object.entries(symbolQuantity).map(([symbol, quantity]) => allocateFromBroker(sessionId, symbol, quantity));

  return (
    <button className="button" onClick={handleRequestClick}>
      Get Locates From Broker
    </button>
  );
};

export default BrokerAllocationButton;
