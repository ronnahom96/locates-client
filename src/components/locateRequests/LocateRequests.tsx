import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { updateLocates } from '../../common/api';
import { Locates } from '../../common/types';
import useTotalRequireSymbol from '../../hooks/useTotalRequireSymbol';
import BrokerAllocationButton from '../brokerAllocationButton/BrokerAllocationButton';
import './LocateRequests.css';

const baseUrl = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session'; //"https://task.qspark.trade/v1/session";

const LocateRequests: React.FC = () => {
  const [sessionId, setSessionId] = useState(null);
  const [locates, setLocates] = useState<Locates>({});
  const [newAllocation, setNewAllocation] = useState<Locates>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const totalRequireSymbol = useTotalRequireSymbol(locates);

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
        console.log(response.data);
        setLocates(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const isCanAllocate = (allocations: Record<string, number>, symbolRequired: Record<string, number>): boolean => {
    for (const [symbol, quantity] of Object.entries(allocations)) {
      if (quantity >= 100 && symbolRequired[symbol] >= 100) return true;
    }

    return false;
  };

  const calculateNewAllocation = useCallback(
    (brokerAllocations: Record<string, number>, totalRequireSymbol: Record<string, number>, locates: Locates) => {
      const newAllocation: Locates = {};

      while (isCanAllocate(brokerAllocations, totalRequireSymbol)) {
        for (const [machine, symbols] of Object.entries(locates)) {
          newAllocation[machine] = newAllocation[machine] ? newAllocation[machine] : {};

          for (const [symbol, quantity] of Object.entries(symbols)) {
            const currentTotalRequireSymbol = totalRequireSymbol[symbol];
            if (currentTotalRequireSymbol === 0) break;
            const proportion = Math.round((quantity / currentTotalRequireSymbol + Number.EPSILON) * 100) / 100;
            const requiredQuantity = proportion * brokerAllocations[symbol];
            const allocatedQuantity = Math.min(requiredQuantity, brokerAllocations[symbol]);

            locates[machine][symbol] -= allocatedQuantity;
            brokerAllocations[symbol] -= allocatedQuantity;
            totalRequireSymbol[symbol] -= allocatedQuantity;

            newAllocation[machine][symbol] = Math.floor((newAllocation[machine][symbol] | 0) + allocatedQuantity);
          }
        }
      }

      return newAllocation;
    },
    []
  );

  const updateNewLocates = useCallback(
    (brokerAllocations: Record<string, number>) => {
      if (!sessionId) return console.error('No Session found');

      console.log('brokerAllocations', brokerAllocations);

      const brokerAllocationsClone = JSON.parse(JSON.stringify(brokerAllocations));
      const totalRequireSymbolClone = JSON.parse(JSON.stringify(totalRequireSymbol));
      const locateClone = JSON.parse(JSON.stringify(locates));
      const newAllocation = calculateNewAllocation(brokerAllocationsClone, totalRequireSymbolClone, locateClone);

      updateLocates(sessionId, newAllocation)
        .then((response): any => {
          if (response.status === 200) {
            setShowSuccessMessage(true);
          }
        })
        .catch((error) => {
          setShowSuccessMessage(false);
          console.error(error);
        });

      setNewAllocation(newAllocation);
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
                  <tr key={`${machine},${symbol}`}>
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
