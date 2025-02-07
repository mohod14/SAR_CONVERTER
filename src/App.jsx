import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CurrencyConverter = () => {
  const [sarAmount, setSarAmount] = useState('');
  const [sdgAmount, setSdgAmount] = useState('');
  const [sdgToSarRate, setSdgToSarRate] = useState(0.001471);
  const [sarToSdgRate, setSarToSdgRate] = useState(680.87);
  const [conversionHistory, setConversionHistory] = useState(() => {
    const storedHistory = localStorage.getItem('conversionHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedDate, setEditedDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
  }, [conversionHistory]);

  const calculateRate = (fromCurrency, toCurrency, fromAmount, toAmount) => {
    const from = parseFloat(fromAmount);
    const to = parseFloat(toAmount);

    if (isNaN(from) || isNaN(to) || from === 0) {
      return 'N/A';
    }

    return (to / from).toFixed(6);
  };

  const handleSarToSdgRateCalculation = () => {
    const newRate = calculateRate('SAR', 'SDG', sarAmount, sdgAmount);
    setSarToSdgRate(newRate !== 'N/A' ? parseFloat(newRate) : sarToSdgRate);
  };

  const handleSdgToSarRateCalculation = () => {
    const newRate = calculateRate('SDG', 'SAR', sdgAmount, sarAmount);
    setSdgToSarRate(newRate !== 'N/A' ? parseFloat(newRate) : sdgToSarRate);
  };

  const convertSarToSdg = () => {
    const sar = parseFloat(sarAmount);
    if (!isNaN(sar)) {
      const sdg = sar * sarToSdgRate;
      setSdgAmount(sdg.toFixed(2));
      saveConversionToHistory(sar, sdg, 'SAR to SDG', sarToSdgRate);
    }
  };

  const convertSdgToSar = () => {
    const sdg = parseFloat(sdgAmount);
    if (!isNaN(sdg)) {
      const sar = sdg * sdgToSarRate;
      setSarAmount(sar.toFixed(2));
      saveConversionToHistory(sdg, sar, 'SDG to SAR', sdgToSarRate);
    }
  };

  const saveConversionToHistory = (from, to, type, rate) => {
    const newEntry = {
      date: new Date().toLocaleString(),
      from: from.toFixed(2),
      to: to.toFixed(2),
      type,
      rate: rate
    };
    setConversionHistory(prev => [newEntry, ...prev]);
  };

  const clearSarAmount = () => {
    setSarAmount('');
  };

  const clearSdgAmount = () => {
    setSdgAmount('');
  };

  const clearConversionHistory = () => {
    setConversionHistory([]);
  };

  const deleteConversionHistoryEntry = (indexToDelete) => {
    setConversionHistory(prevHistory => prevHistory.filter((_, index) => index !== indexToDelete));
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditedDate(new Date(conversionHistory[index].date));
  };

  const saveEditedDate = (index) => {
    const updatedHistory = [...conversionHistory];
    const dateString = editedDate.toLocaleDateString();
    updatedHistory[index] = { ...updatedHistory[index], date: dateString };
    setConversionHistory(updatedHistory);
    setEditingIndex(null);
  };

  return (
    <div className="container mx-auto mt-10 p-6 bg-gradient-to-r from-blue-100 to-green-100 shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">SAR ↔ SDG Converter</h1>

      <div className="flex justify-center space-x-4 mb-4">
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSarToSdgRateCalculation}
        >
          Calculate SAR to SDG Rate
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSdgToSarRateCalculation}
        >
          Calculate SDG to SAR Rate
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            SDG to SAR Rate:
          </label>
          <input
            type="number"
            value={sdgToSarRate}
            onChange={(e) => setSdgToSarRate(parseFloat(e.target.value))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            step="0.000001"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            SAR to SDG Rate:
          </label>
          <input
            type="number"
            value={sarToSdgRate}
            onChange={(e) => setSarToSdgRate(parseFloat(e.target.value))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Saudi Riyals (SAR)
          </label>
          <div className="flex">
            <input
              type="number"
              value={sarAmount}
              onChange={(e) => setSarAmount(e.target.value)}
              placeholder="Enter SAR amount"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              onClick={clearSarAmount}
              className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline"
            >
              Clear
            </button>
          </div>
          <button
            onClick={convertSarToSdg}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Convert to SDG
          </button>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Sudanese Pounds (SDG)
          </label>
          <div className="flex">
            <input
              type="number"
              value={sdgAmount}
              onChange={(e) => setSdgAmount(e.target.value)}
              placeholder="Enter SDG amount"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              onClick={clearSdgAmount}
              className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline"
            >
              Clear
            </button>
          </div>
          <button
            onClick={convertSdgToSar}
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Convert to SAR
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center justify-between">
          Conversion History
          <button
            onClick={clearConversionHistory}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Clear History
          </button>
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Date</th>
                <th className="py-3 px-6 text-left">From</th>
                <th className="py-3 px-6 text-left">To</th>
                <th className="py-3 px-6 text-left">Type</th>
                <th className="py-3 px-6 text-left">Rate</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {conversionHistory.map((entry, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {editingIndex === index ? (
                      <div className="flex items-center">
                        <DatePicker
                          selected={editedDate}
                          onChange={(date) => setEditedDate(date)}
                          dateFormat="dd/MM/yyyy"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <button
                          onClick={() => saveEditedDate(index)}
                          className="ml-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      entry.date
                    )}
                  </td>
                  <td className="py-3 px-6 text-left">{entry.from}</td>
                  <td className="py-3 px-6 text-left">{entry.to}</td>
                  <td className="py-3 px-6 text-left">{entry.type}</td>
                  <td className="py-3 px-6 text-left">{entry.rate ? entry.rate.toFixed(6) : 'N/A'}</td>
                  <td className="py-3 px-6 text-left">
                    {editingIndex === index ? null : (
                      <button
                        onClick={() => startEditing(index)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline mr-2"
                      >
                        Edit Date
                      </button>
                    )}
                    <button
                      onClick={() => deleteConversionHistoryEntry(index)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
