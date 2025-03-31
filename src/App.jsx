import React, { useState, useEffect, lazy, Suspense, useMemo, useRef } from 'react'; // Added useMemo, useRef
// import DatePicker from 'react-datepicker'; // Removed direct import
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse'; // Import papaparse

const DatePicker = lazy(() => import('react-datepicker')); // Lazy load DatePicker

const CurrencyConverter = () => {
  // Load initial state from localStorage or use defaults
  const [sarAmount, setSarAmount] = useState(() => localStorage.getItem('sarAmount') || '');
  const [sdgAmount, setSdgAmount] = useState(() => localStorage.getItem('sdgAmount') || '');
  const [sdgToSarRate, setSdgToSarRate] = useState(() => parseFloat(localStorage.getItem('sdgToSarRate')) || 0.001471); // User-editable rate
  const [sarToSdgRate, setSarToSdgRate] = useState(() => parseFloat(localStorage.getItem('sarToSdgRate')) || 680.87); // User-editable rate
  const [calculatedSdgToSar, setCalculatedSdgToSar] = useState(null); // Display calculated rate
  const [calculatedSarToSdg, setCalculatedSarToSdg] = useState(null); // Display calculated rate
  const [highlightSdg, setHighlightSdg] = useState(false); // For conversion feedback
  const [highlightSar, setHighlightSar] = useState(false); // For conversion feedback
  const [conversionHistory, setConversionHistory] = useState(() => {
    const storedHistory = localStorage.getItem('conversionHistory');
    try {
      const parsed = storedHistory ? JSON.parse(storedHistory) : [];
      // Ensure dates are Date objects if stored as strings
      return parsed.map(entry => ({ ...entry, date: new Date(entry.date) }));
    } catch (e) {
      console.error("Failed to parse conversion history:", e);
      return [];
    }
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedDate, setEditedDate] = useState(new Date());
  const [filterType, setFilterType] = useState('All'); // State for filtering
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // State for sorting
  const fileInputRef = useRef(null); // Ref for file input

  // --- Save state to localStorage on change ---
  useEffect(() => {
    localStorage.setItem('sarAmount', sarAmount);
  }, [sarAmount]);

  useEffect(() => {
    localStorage.setItem('sdgAmount', sdgAmount);
  }, [sdgAmount]);

  useEffect(() => {
    localStorage.setItem('sdgToSarRate', sdgToSarRate.toString());
  }, [sdgToSarRate]);

  useEffect(() => {
    localStorage.setItem('sarToSdgRate', sarToSdgRate.toString());
  }, [sarToSdgRate]);

  useEffect(() => {
    // Store conversion history (dates as ISO strings for better consistency)
    localStorage.setItem('conversionHistory', JSON.stringify(
      conversionHistory.map(entry => ({ ...entry, date: entry.date.toISOString() }))
    ));
  }, [conversionHistory]);

  // Effect to remove highlight after a short delay
  useEffect(() => {
    let timeoutId;
    if (highlightSdg) {
      timeoutId = setTimeout(() => setHighlightSdg(false), 500); // 0.5 second highlight
    }
    return () => clearTimeout(timeoutId);
  }, [highlightSdg]);

  useEffect(() => {
    let timeoutId;
    if (highlightSar) {
      timeoutId = setTimeout(() => setHighlightSar(false), 500); // 0.5 second highlight
    }
    return () => clearTimeout(timeoutId);
  }, [highlightSar]);


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
    if (newRate !== 'N/A') {
      setCalculatedSarToSdg(parseFloat(newRate));
      // Optionally update the user-editable rate as well, or keep them separate
      // setSarToSdgRate(parseFloat(newRate));
    } else {
      setCalculatedSarToSdg(null); // Indicate calculation wasn't possible
    }
  };

  const handleSdgToSarRateCalculation = () => {
    const newRate = calculateRate('SDG', 'SAR', sdgAmount, sarAmount);
     if (newRate !== 'N/A') {
      setCalculatedSdgToSar(parseFloat(newRate));
      // Optionally update the user-editable rate as well, or keep them separate
      // setSdgToSarRate(parseFloat(newRate));
    } else {
      setCalculatedSdgToSar(null); // Indicate calculation wasn't possible
    }
  };

  const convertSarToSdg = () => {
    const sar = parseFloat(sarAmount);
    if (!isNaN(sar)) {
      const sdg = sar * sarToSdgRate;
      setSdgAmount(sdg.toFixed(2));
      saveConversionToHistory(sar, sdg, 'SAR to SDG', sarToSdgRate);
      setHighlightSdg(true); // Trigger highlight
    } else {
       setSdgAmount(''); // Clear if input is invalid
    }
  };

  const convertSdgToSar = () => {
    const sdg = parseFloat(sdgAmount);
    if (!isNaN(sdg)) {
      const sar = sdg * sdgToSarRate;
      setSarAmount(sar.toFixed(2));
      saveConversionToHistory(sdg, sar, 'SDG to SAR', sdgToSarRate);
      setHighlightSar(true); // Trigger highlight
    } else {
       setSarAmount(''); // Clear if input is invalid
    }
  };

  const saveConversionToHistory = (from, to, type, rate) => {
    const newEntry = {
      date: new Date(), // Store as Date object
      from: from.toFixed(2),
      to: to.toFixed(2),
      type,
      rate: rate
    };
    setConversionHistory(prev => [newEntry, ...prev.slice(0, 99)]); // Keep max 100 entries
  };

  const clearSarAmount = () => {
    setSarAmount('');
    setCalculatedSdgToSar(null); // Clear calculated rate too
  };

  const clearSdgAmount = () => {
    setSdgAmount('');
    setCalculatedSarToSdg(null); // Clear calculated rate too
  };

  const clearConversionHistory = () => {
    setConversionHistory([]);
  };

  const deleteConversionHistoryEntry = (indexToDelete) => {
    setConversionHistory(prevHistory => prevHistory.filter((_, index) => index !== indexToDelete));
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    // Ensure we're editing a Date object
    setEditedDate(new Date(conversionHistory[index].date));
  };

  const saveEditedDate = (index) => {
    const updatedHistory = [...conversionHistory];
    // Ensure the edited date is stored as a Date object
    updatedHistory[index] = { ...updatedHistory[index], date: editedDate };
    setConversionHistory(updatedHistory);
    setEditingIndex(null);
  };

  // Consistent date formatting function
  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString(undefined, { // Use locale default format
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Function to export history to CSV
  const exportHistoryToCsv = () => {
    if (displayedHistory.length === 0) { // Use displayedHistory
      alert("History is empty or filtered history is empty. Nothing to export.");
      return;
    }

    const headers = ["Date", "From Amount", "To Amount", "Conversion Type", "Rate Used"];
    // Use consistent date formatting and ensure rate is handled
    const csvRows = [
      headers.join(','), // Header row
      ...displayedHistory.map(entry => [ // Use displayedHistory
        `"${formatDate(entry.date)}"`, // Enclose date in quotes in case it contains commas
        entry.from,
        entry.to,
        entry.type,
        entry.rate ? entry.rate.toFixed(6) : 'N/A' // Handle potential null/undefined rate
      ].join(',')) // Join each entry's fields with commas
    ];

    const csvString = csvRows.join('\n'); // Join rows with newline characters
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "conversion_history_report.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up blob URL
    } else {
      alert("CSV export is not supported in your browser.");
    }
  };

  // --- Sorting Logic ---
  const handleSort = (key) => {
    let direction = 'asc';
    // If sorting the same key, toggle direction; otherwise, default to ascending
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key !== key) {
      // Default to descending for date, ascending for others when changing column
      direction = key === 'date' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  // --- Filtering and Sorting Derived State ---
  const displayedHistory = useMemo(() => {
    let filtered = [...conversionHistory];

    // Apply filtering
    if (filterType !== 'All') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle specific types for comparison
      if (sortConfig.key === 'date') {
        // Dates are already Date objects
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      } else if (['from', 'to', 'rate'].includes(sortConfig.key)) {
        // Convert numeric strings/numbers to numbers for proper sorting
        aValue = parseFloat(aValue || 0); // Handle potential null/undefined rate
        bValue = parseFloat(bValue || 0);
      } else if (sortConfig.key === 'type') {
         // Basic string comparison for type
         aValue = String(aValue);
         bValue = String(bValue);
      }


      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0; // Values are equal
    });

    return filtered;
  }, [conversionHistory, filterType, sortConfig]);


  // Function to export history to PDF (uses displayedHistory now)
  const exportHistoryToPdf = () => {
    if (displayedHistory.length === 0) { // Check displayed history
      alert("History is empty or filtered history is empty. Nothing to export.");
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ["Date", "From Amount", "To Amount", "Conversion Type", "Rate Used"];
    const tableRows = [];

    displayedHistory.forEach(entry => { // Use displayedHistory for export
      const rowData = [
        formatDate(entry.date),
        entry.from,
        entry.to,
        entry.type,
        entry.rate ? entry.rate.toFixed(6) : 'N/A'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20, // Start table below title
      theme: 'grid', // Optional: 'striped', 'grid', 'plain'
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] }, // Header color (teal)
    });

    doc.text("Conversion History Report", 14, 15); // Add title
    doc.save("conversion_history_report.pdf");
  };

  // --- CSV Import Logic ---
  const handleImportCsv = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    Papa.parse(file, {
      header: true, // Assumes first row is header
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parsed CSV data:", results.data); // Log parsed data
        const importedHistory = results.data.map(row => {
          // Validate and transform row data
          const date = new Date(row.Date); // Attempt to parse date string
          const from = parseFloat(row["From Amount"]);
          const to = parseFloat(row["To Amount"]);
          const type = row["Conversion Type"];
          const rate = parseFloat(row["Rate Used"]);

          // Basic validation - check if essential fields are valid
          if (isNaN(date.getTime()) || isNaN(from) || isNaN(to) || !type) {
            console.warn("Skipping invalid row:", row);
            return null; // Skip invalid rows
          }

          return {
            date: date,
            from: from.toFixed(2),
            to: to.toFixed(2),
            type: type,
            rate: !isNaN(rate) ? rate : null // Handle 'N/A' or invalid rates
          };
        }).filter(entry => entry !== null); // Remove null entries (skipped rows)

        console.log("Processed imported history:", importedHistory); // Log processed data

        // Append imported history to existing history, avoiding duplicates based on timestamp? (Simple append for now)
        // A more robust approach might check for existing entries before appending.
        setConversionHistory(prev => [...prev, ...importedHistory]);
        alert(`Successfully imported ${importedHistory.length} entries.`);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        alert(`Error parsing CSV file: ${error.message}`);
      }
    });

    // Reset file input value to allow importing the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };


  return (
    <div className="container mx-auto mt-10 p-6 bg-gradient-to-r from-blue-100 to-green-100 shadow-xl rounded-lg font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">SAR ↔ SDG Converter</h1>

      {/* Rate Calculation Section */}
      <div className="bg-white p-4 rounded-lg shadow-inner mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700 text-center">Calculate Current Rate</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">Enter amounts in both SAR and SDG fields below, then click a button to see the calculated rate based on those amounts.</p>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            onClick={handleSarToSdgRateCalculation}
            disabled={!sarAmount || !sdgAmount} // Disable if inputs are empty
          >
            Calculate SAR → SDG Rate
          </button>
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            onClick={handleSdgToSarRateCalculation}
            disabled={!sarAmount || !sdgAmount} // Disable if inputs are empty
          >
            Calculate SDG → SAR Rate
          </button>
        </div>
         {/* Display Calculated Rates */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
           <div>
             <span className="text-sm font-medium text-gray-600">Calculated SAR → SDG:</span>
             <span className="ml-2 font-semibold text-indigo-700">{calculatedSarToSdg !== null ? calculatedSarToSdg.toFixed(6) : 'N/A'}</span>
           </div>
            <div>
             <span className="text-sm font-medium text-gray-600">Calculated SDG → SAR:</span>
             <span className="ml-2 font-semibold text-indigo-700">{calculatedSdgToSar !== null ? calculatedSdgToSar.toFixed(6) : 'N/A'}</span>
           </div>
         </div>
      </div>

      {/* Conversion Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* User Editable Rates */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sdg-to-sar-rate">
            SDG → SAR Rate (Editable):
          </label>
          <input
            id="sdg-to-sar-rate"
            type="number"
            value={sdgToSarRate}
            onChange={(e) => setSdgToSarRate(parseFloat(e.target.value) || 0)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
            step="0.000001"
          />
           <p className="text-xs text-gray-500 mt-1">Rate used for SDG to SAR conversions.</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sar-to-sdg-rate">
            SAR → SDG Rate (Editable):
          </label>
          <input
            id="sar-to-sdg-rate"
            type="number"
            value={sarToSdgRate}
            onChange={(e) => setSarToSdgRate(parseFloat(e.target.value) || 0)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
            step="0.01"
          />
          <p className="text-xs text-gray-500 mt-1">Rate used for SAR to SDG conversions.</p>
        </div>

        {/* SAR Input */}
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sar-input">
            Saudi Riyals (SAR)
          </label>
          <div className="flex">
            <input
              id="sar-input"
              type="number"
              value={sarAmount}
              onChange={(e) => setSarAmount(e.target.value)}
              placeholder="Enter SAR amount"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition duration-300 ${highlightSar ? 'bg-yellow-100' : ''}`}
            />
            <button
              onClick={clearSarAmount}
              className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline transition duration-150"
              title="Clear SAR amount"
            >
              ✕
            </button>
          </div>
          <button
            onClick={convertSarToSdg}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Convert SAR → SDG
          </button>
        </div>

        {/* SDG Input */}
         <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sdg-input">
            Sudanese Pounds (SDG)
          </label>
          <div className="flex">
            <input
              id="sdg-input"
              type="number"
              value={sdgAmount}
              onChange={(e) => setSdgAmount(e.target.value)}
              placeholder="Enter SDG amount"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition duration-300 ${highlightSdg ? 'bg-yellow-100' : ''}`}
            />
            <button
              onClick={clearSdgAmount}
              className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline transition duration-150"
               title="Clear SDG amount"
           >
              ✕
            </button>
          </div>
          <button
            onClick={convertSdgToSar}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Convert SDG → SAR
          </button>
        </div>
      </div>

      {/* Conversion History Section */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Conversion History
          </h2>
          {/* Action Buttons */}
          <div className="flex space-x-2">
             {/* Hidden File Input */}
             <input
               type="file"
               accept=".csv"
               ref={fileInputRef}
               onChange={handleImportCsv}
               style={{ display: 'none' }}
             />
             {/* Import Button */}
             <button
               onClick={triggerFileInput}
               className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-sm"
             >
               Import CSV
             </button>
            <button
              onClick={exportHistoryToCsv}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-sm" // Adjusted size
              disabled={displayedHistory.length === 0} // Disable if displayed history is empty
            >
              Export CSV
            </button>
             <button
              onClick={exportHistoryToPdf}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-sm" // Adjusted size
              disabled={displayedHistory.length === 0} // Disable if displayed history is empty
            >
              Export PDF
            </button>
            <button
              onClick={clearConversionHistory}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-sm" // Adjusted size
            >
              Clear History
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-4 flex items-center space-x-2">
           <label htmlFor="filterType" className="text-sm font-medium text-gray-700">Filter by Type:</label>
           <select
             id="filterType"
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
             className="shadow-sm border border-gray-300 rounded py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
           >
             <option value="All">All</option>
             <option value="SAR to SDG">SAR → SDG</option>
             <option value="SDG to SAR">SDG → SAR</option>
           </select>
         </div>

        <div className="overflow-x-auto">
          {displayedHistory.length === 0 ? ( // Use displayedHistory length
             <p className="text-center text-gray-500 py-4">
               {conversionHistory.length > 0 ? 'No history entries match the current filter.' : 'No conversion history yet.'}
             </p>
           ) : (
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                 {/* Add onClick handlers for sorting */}
                 <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300" onClick={() => handleSort('date')}>
                   Date {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                 </th>
                 <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300" onClick={() => handleSort('from')}>
                   From {sortConfig.key === 'from' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                 </th>
                 <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300" onClick={() => handleSort('to')}>
                   To {sortConfig.key === 'to' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                 </th>
                 <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300" onClick={() => handleSort('type')}>
                   Type {sortConfig.key === 'type' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                 </th>
                 <th className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300" onClick={() => handleSort('rate')}>
                   Rate Used {sortConfig.key === 'rate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                 </th>
                <th className="py-3 px-6 text-left">Actions</th> {/* Actions column not sortable */}
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {displayedHistory.map((entry, index) => { // Iterate over displayedHistory
                 // Find original index if needed for editing/deleting (more robust ways exist, but this works for now)
                 const originalIndex = conversionHistory.findIndex(
                   histEntry => histEntry.date.getTime() === entry.date.getTime() && histEntry.from === entry.from && histEntry.to === entry.to && histEntry.type === entry.type
                 );
                 // Ensure key is unique even if entries are identical (use originalIndex + date as fallback)
                 const uniqueKey = `${originalIndex}-${entry.date.getTime()}`;
                 return (
                <tr key={uniqueKey} className="border-b border-gray-200 hover:bg-gray-50"> {/* Use unique key */}
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {editingIndex === originalIndex ? ( // Use originalIndex for editing check
                      <Suspense fallback={<div>Loading...</div>}> {/* Add Suspense fallback */}
                        <div className="flex items-center">
                          <DatePicker
                            selected={editedDate}
                            onChange={(date) => setEditedDate(date)}
                            dateFormat="dd/MM/yyyy" // Keep format consistent for picker
                            className="shadow appearance-none border rounded w-auto py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                          <button
                            onClick={() => saveEditedDate(originalIndex)} // Use originalIndex
                            className="ml-2 bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-xs"
                          >
                            Save
                          </button>
                           <button
                            onClick={() => setEditingIndex(null)} // Cancel editing
                            className="ml-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </Suspense>
                    ) : (
                      formatDate(entry.date) // Use consistent formatting function
                    )}
                  </td>
                  <td className="py-3 px-6 text-left">{entry.from}</td>
                  <td className="py-3 px-6 text-left">{entry.to}</td>
                  <td className="py-3 px-6 text-left">{entry.type}</td>
                  <td className="py-3 px-6 text-left">{entry.rate ? entry.rate.toFixed(6) : 'N/A'}</td>
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {editingIndex !== originalIndex && ( // Use originalIndex
                      <button
                        onClick={() => startEditing(originalIndex)} // Use originalIndex
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline mr-2 text-xs"
                      >
                        Edit Date
                      </button>
                    )}
                    <button
                      onClick={() => deleteConversionHistoryEntry(originalIndex)} // Use originalIndex
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
               );
              })}
            </tbody>
          </table>
           )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
