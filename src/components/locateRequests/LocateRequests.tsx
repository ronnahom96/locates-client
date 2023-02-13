import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { updateLocates } from '../../common/api';
import { ProportionLocate } from '../../common/interfaces';
import { Locates } from '../../common/types';
import BrokerAllocationButton from '../brokerAllocationButton/BrokerAllocationButton';
import './LocateRequests.css';

const baseUrl = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session'; //"https://task.qspark.trade/v1/session";

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

const LocateRequests: React.FC = () => {
  const [sessionId, setSessionId] = useState(null);
  const [locates, setLocates] = useState<Locates>({});
  const [newAllocation, setNewAllocation] = useState<Locates>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const totalRequireSymbol = useMemo<Record<string, number>>(() => {
    const totalRequireSymbol: Record<string, number> = {};

    Object.values(locates)
      .map((symbols) => Object.entries(symbols))
      .flat()
      .forEach(([symbol, quantity]) => (totalRequireSymbol[symbol] = (totalRequireSymbol[symbol] || 0) + quantity));

    return totalRequireSymbol;

  }, [locates])

  useEffect(() => {
    // Create a new session when the component mounts
    axios
      .post(baseUrl)
      .then((response) => {
        setSessionId(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const handleRequestClick = () => {
    // Retrieve the locate requests when the button is clicked
    axios
      .get(`${baseUrl}/${sessionId}/locates`)
      .then((response) => {
        console.table(response.data);
        setLocates(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const calculateNewAllocation = useCallback(
    (brokerAllocations: Record<string, number>, totalRequireSymbol: Record<string, number>, locates: Locates) => {
      let newAllocation: Locates = {};

      // Deep clone for not changing the original object
      const brokerAllocationsClone = deepClone(brokerAllocations);
      const totalRequireSymbolClone = deepClone(totalRequireSymbol);
      const locateClone = deepClone(locates);

      let proportionLocates = buildProportionLocates(locateClone, totalRequireSymbolClone);
      proportionLocates = sortProportionLocates(proportionLocates);

      for (const { machine, symbol, proportion } of proportionLocates) {
        newAllocation[machine] = newAllocation[machine] ? newAllocation[machine] : {};
        const requiredQuantity = proportion * brokerAllocations[symbol];
        const allocatedQuantity = Math.min(requiredQuantity, brokerAllocationsClone[symbol]);
        const allocationQuantityRoundLot = Math.floor(allocatedQuantity / 100) * 100;

        brokerAllocationsClone[symbol] -= allocationQuantityRoundLot;
        newAllocation[machine][symbol] = Math.floor((newAllocation[machine][symbol] | 0) + allocationQuantityRoundLot);
      }

      newAllocation = calculateAllocationShortage(newAllocation, proportionLocates, brokerAllocationsClone);

      return newAllocation;
    },
    []
  );

  const calculateAllocationShortage = (
    newAllocation: Locates,
    proportionLocates: ProportionLocate[],
    locatesCounter: Record<string, number>
  ) => {
    const newAllocationClone = deepClone(newAllocation);

    for (const [locateSymbolCounter] of Object.entries(locatesCounter)) {
      const locate = proportionLocates.find(({ machine, symbol, quantity }) => locatesCounter[locateSymbolCounter] !== 0 &&
        symbol === locateSymbolCounter && newAllocationClone[machine][symbol] < quantity);

      if (locate) {
        newAllocationClone[locate.machine][locate.symbol] += Math.floor(locatesCounter[locateSymbolCounter]);
      }
    }

    return newAllocationClone;
  };

  const buildProportionLocates = (locates: Locates, totalRequireSymbol: Record<string, number>) => {
    let proportionArray: ProportionLocate[] = [];
    for (const [machine, symbols] of Object.entries(locates)) {
      for (const [symbol, quantity] of Object.entries(symbols)) {
        const currentTotalRequireSymbol = totalRequireSymbol[symbol];
        const proportion = currentTotalRequireSymbol !== 0 ? quantity / currentTotalRequireSymbol : 0;
        proportionArray = [...proportionArray, { machine, symbol, quantity, proportion }];
      }
    }

    return proportionArray;
  };

  const sortProportionLocates = (proportionLocates: ProportionLocate[]) => {
    return proportionLocates.sort((a, b) => b.proportion - a.proportion);
  };

  const updateNewLocates = useCallback(
    (brokerAllocations: Record<string, number>) => {
      if (!sessionId) return console.error('No Session found');

      console.info('brokerAllocations', brokerAllocations);
      const newAllocation = calculateNewAllocation(brokerAllocations, totalRequireSymbol, locates);

      updateLocates(sessionId, newAllocation)
        .then((response): any => {
          if (response.status === 200) {
            setNewAllocation(newAllocation);
            setShowSuccessMessage(true);
          }
        })
        .catch((error) => {
          setShowSuccessMessage(false);
          console.error(error);
        });
    },
    [sessionId, calculateNewAllocation, totalRequireSymbol, locates]
  );

  return (
    <>
      <h1>Locates Client</h1>
      {showSuccessMessage && <h2 className="success-message">Congratulations! You have successfully update the new locates!</h2>}
      <h3>Session ID: {sessionId}</h3>
      <div className="button-container">
        <button className="button" onClick={handleRequestClick}>
          Retrieve Locate Requests
        </button>
        <BrokerAllocationButton totalRequireSymbol={totalRequireSymbol} sessionId={sessionId} updateNewLocates={updateNewLocates} />
      </div>
      <div className="container">
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Symbol</th>
              <th>Locates</th>
              <th>New Locates</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(locates).map(([machine, symbols]) => (
              <React.Fragment key={machine}>
                {Object.entries(symbols).map(([symbol, locates]) => (
                  <tr key={`${machine}-${symbol}`}>
                    <td>{machine}</td>
                    <td>{symbol}</td>
                    <td>{locates}</td>
                    <td className={newAllocation[machine] != null && newAllocation[machine][symbol] !== 0 ? 'green' : 'red'}>
                      {newAllocation[machine] ? newAllocation[machine][symbol] : '-'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default LocateRequests;
