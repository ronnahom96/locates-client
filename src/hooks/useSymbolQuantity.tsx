import { useState, useEffect } from 'react';
import { Locates } from '../common/types';

function fromLocatesToSymbolQuantity(locates: Locates) {
  const symbolQuantity: Record<string, number> = {};

  Object.entries(locates)
    .map(([, symbols]) => Object.entries(symbols))
    .flat()
    .forEach(([symbol, quantity]) => (symbolQuantity[symbol] = (symbolQuantity[symbol] || 0) + quantity));

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
