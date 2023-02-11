import { useState, useEffect } from 'react';
import { Locates } from '../common/types';

function fromLocatesToTotalRequireSymbol(locates: Locates) {
  const totalRequireSymbol: Record<string, number> = {};

  Object.entries(locates)
    .map(([, symbols]) => Object.entries(symbols))
    .flat()
    .forEach(([symbol, quantity]) => (totalRequireSymbol[symbol] = (totalRequireSymbol[symbol] || 0) + quantity));

  return totalRequireSymbol;
}

const useTotalRequireSymbol = (locates: Locates | null) => {
  const [totalRequireSymbol, setTotalRequireSymbol] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!locates) return console.error("still don't have locates");
    setTotalRequireSymbol(fromLocatesToTotalRequireSymbol(locates));
  }, [locates]);

  return totalRequireSymbol;
};

export default useTotalRequireSymbol;
