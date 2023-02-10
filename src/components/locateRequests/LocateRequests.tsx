import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { updateLocates } from '../../common/api';
import { Locate } from '../../common/interfaces';
import useSymbolQuantity from '../../hooks/useSymbolQuantity';
import BrokerAllocationButton from '../BrokerAllocationButton';
import './LocateRequests.css';

const baseUrl = 'https://9g7qfsq0qk.execute-api.us-east-1.amazonaws.com/v1/session'; //"https://task.qspark.trade/v1/session";

function fromResponseToLocates(data: Record<string, Record<string, number>>): Locate[] {
  return Object.entries(data)
    .map(([machine, symbols]) => Object.entries(symbols).map(([symbol, quantity]) => ({ machine, quantity, symbol })))
    .flat();
}

const LocateRequests: React.FC = () => {
  const [sessionId, setSessionId] = useState(null);
  const [locates, setLocates] = useState<Locate[]>([]);
  const [newAllocation, setNewAllocation] = useState<Locate[]>([]);
  const symbolQuantity = useSymbolQuantity(locates);

  // const machineLocatesMap = useMemo<MachineLocatesMap>(() => {
  //   const machineMap: MachineLocatesMap = {};
  //   locates.forEach((locate) => {
  //     machineMap[locate.machine] = machineMap[locate.machine] ? [...machineMap[locate.machine], locate] : [locate];
  //   });

  //   return machineMap;
  // }, [locates]);

  // const symbolLocatesMap = useMemo<SymbolLocatesMap>(() => {
  //   const symbolMap: SymbolLocatesMap = {};
  //   locates.forEach((locate) => {
  //     symbolMap[locate.symbol] = symbolMap[locate.symbol] ? [...symbolMap[locate.symbol], locate] : [locate];
  //   });

  //   return symbolMap;
  // }, [locates]);

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
        setLocates(fromResponseToLocates(response.data));
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const updateNewLocates = useCallback(
    (brokerAllocations: Record<string, number>) => {
      console.log('brokerAllocations', brokerAllocations);
      let newAllocation: Locate[] = [];

      for (const { machine, symbol, quantity } of locates) {
        const currentSymbolQuantity = symbolQuantity[symbol];
        const proportion = currentSymbolQuantity !== 0 ? quantity / currentSymbolQuantity : 0;
        const newQuantity = Math.round(proportion * brokerAllocations[symbol]);
        brokerAllocations[symbol] -= newQuantity;
        const newLocate: Locate = { machine, symbol, quantity: newQuantity };
        newAllocation = [...newAllocation, newLocate];
      }

      if (!sessionId) return console.error('No Session found');

      updateLocates(sessionId, newAllocation)
        .then((response): any => {
          if (response.status === 200) {
            console.log('Congratulations! You have successfully update the new locates!');
          }
        })
        .catch(console.error);

      setNewAllocation(newAllocation);
    },
    [sessionId, locates, symbolQuantity]
  );

  return (
    <div>
      <h1>Session ID: {sessionId}</h1>
      <button onClick={handleRequestClick}>Retrieve Locate Requests</button>
      <BrokerAllocationButton locates={locates} sessionId={sessionId} updateNewLocates={updateNewLocates} />
      <div className="container">
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Symbol</th>
              <th>Locates</th>
            </tr>
          </thead>
          <tbody>
            {locates.map(({ machine, symbol, quantity }) => (
              <tr key={`${machine},${symbol}`}>
                <td>{machine}</td>
                <td>{symbol}</td>
                <td>{quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Allocations</h2>
        <table>
          <thead>
            <tr>
              <th>Machine</th>
              <th>Symbol</th>
              <th>Locates</th>
            </tr>
          </thead>
          <tbody>
            {newAllocation.map(({ machine, symbol, quantity }) => (
              <tr key={`${machine},${symbol}`}>
                <td>{machine}</td>
                <td>{symbol}</td>
                <td>{quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocateRequests;
