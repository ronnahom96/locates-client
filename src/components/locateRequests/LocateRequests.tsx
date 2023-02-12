/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { updateLocates } from '../../common/api';
import { ProportionLocate } from '../../common/interfaces';
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
        console.log('response.data');
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

      const locatesCounter = { ...brokerAllocations };
      let proportionLocates = buildProportionLocates(locates, totalRequireSymbol);
      proportionLocates = sortProportionLocates(proportionLocates);

      for (const { machine, symbol, proportion } of proportionLocates) {
        newAllocation[machine] = newAllocation[machine] ? newAllocation[machine] : {};
        const requiredQuantity = proportion * brokerAllocations[symbol];
        console.log(machine, symbol, proportion, brokerAllocations[symbol], requiredQuantity);
        const allocatedQuantity = Math.min(requiredQuantity, locatesCounter[symbol]);

        locatesCounter[symbol] -= allocatedQuantity;
        newAllocation[machine][symbol] = Math.floor((newAllocation[machine][symbol] | 0) + allocatedQuantity);
      }

      newAllocation = calculateAllocationShortage(newAllocation, proportionLocates, locatesCounter);

      return newAllocation;
    },
    []
  );

  const calculateAllocationShortage = (
    newAllocation: Locates,
    proportionLocates: ProportionLocate[],
    locatesCounter: Record<string, number>
  ) => {
    for (const [locateSymbolCounter] of Object.entries(locatesCounter)) {
      const locate = proportionLocates.find(
        ({ machine, symbol, quantity }) => symbol === locateSymbolCounter && quantity && newAllocation[machine][symbol] < quantity
      );

      if (locate) {
        newAllocation[locate.machine][locate.symbol] += locatesCounter[locateSymbolCounter];
      }
    }

    return newAllocation;
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

      const brokerAllocationsClone = JSON.parse(JSON.stringify(brokerAllocations));
      const totalRequireSymbolClone = JSON.parse(JSON.stringify(totalRequireSymbol));
      const locateClone = JSON.parse(JSON.stringify(locates));
      const newAllocation = calculateNewAllocation(brokerAllocationsClone, totalRequireSymbolClone, locateClone);

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
