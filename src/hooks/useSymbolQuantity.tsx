import { useState, useEffect } from 'react';
import { Locate } from '../common/interfaces';

// TODO: check how to improve it
function fromLocatesToSymbolQuantity(locates: Locate[]) {
  const symbolQuantity: Record<string, number> = {};
  locates.forEach(({symbol, quantity}) => {
    symbolQuantity[symbol] = symbolQuantity[symbol] ? symbolQuantity[symbol] + quantity : quantity
  })

  return symbolQuantity;
}

const useSymbolQuantity = (locates: Locate[] | null) => {
  const [symbolQuantity, setSymbolQuantity] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!locates) return console.error("still don't have locates");
    setSymbolQuantity(fromLocatesToSymbolQuantity(locates));
  }, [locates]);

  return symbolQuantity;
};

export default useSymbolQuantity;
