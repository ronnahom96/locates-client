import { useState, useEffect } from 'react';

function fromLocatesToSymbolQuantity(locates: Record<string, Record<string, number>>) {
  const symbolQuantity: Record<string, number> = {};

  Object.entries(locates)
    .map(([machine, symbols]) => Object.entries(symbols).map(([symbol, quantity]) => ({ machine, quantity, symbol })))
    .flat()
    .forEach(({ symbol, quantity }) => {
      symbolQuantity[symbol] = symbolQuantity[symbol] ? symbolQuantity[symbol] + quantity : quantity;
    });

  return symbolQuantity;
}

const useSymbolQuantity = (locates: Record<string, Record<string, number>> | null) => {
  const [symbolQuantity, setSymbolQuantity] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!locates) return console.error("still don't have locates");
    setSymbolQuantity(fromLocatesToSymbolQuantity(locates));
  }, [locates]);

  return symbolQuantity;
};

export default useSymbolQuantity;
