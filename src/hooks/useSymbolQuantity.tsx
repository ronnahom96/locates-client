import { useState, useEffect } from 'react';
import { Locates, MachineRequest } from '../common/types';

// TODO: check how to improve it
function fromLocatesToSymbolQuantity(locates: Locates) {
  const symbolQuantity: Record<string, number> = {};
  const machineRequests: MachineRequest[] = Object.values(locates);
  machineRequests.forEach((machineRequest) => {
    Object.entries(machineRequest).forEach(([symbol, quantity]) => {
      symbolQuantity[symbol] = symbolQuantity[symbol] ? symbolQuantity[symbol] + quantity : quantity;
    });
  });

  return symbolQuantity;
}

const useSymbolQuantity = (locates: Locates | null) => {
  const [symbolQuantity, setSymbolQuantity] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!locates) return console.error("still don't have locates");
    setSymbolQuantity(fromLocatesToSymbolQuantity(locates));
  }, [locates]);

  return symbolQuantity;
};

export default useSymbolQuantity;
