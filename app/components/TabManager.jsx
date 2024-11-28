"use client";

import { useState, useRef } from "react";

const TabManager = ({ initialData, keys: initialKeys }) => {
  const [data, setData] = useState(initialData || {});
  const [keys, setKeys] = useState(initialKeys || []); // Keys for dynamic tabs
  const [activeData, setActiveData] = useState(data); // Active data for each tab
  const [activeTab, setActiveTab] = useState(0); // Track the active tab index
  const inputRefs = useRef({});
  const [searchQuery, setSearchQuery] = useState("");
  const [columns, setColumns] = useState(
    Object.fromEntries(
      keys.map((key) => [key, Object.keys(data[key]?.[0] || {})])
    )
  );

  // Save all data to Google Drive
  const saveData = async () => {
    try {
      const response = await fetch("/api/driveData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeData), // Send the updated data
      });

      if (response.ok) {
        setData(activeData); // Update the local state with saved data
      } else {
        const error = await response.json();
        alert(`Failed to save data: ${error.error}`);
      }
    } catch (err) {
      alert("An error occurred while saving data.");
      console.error(err);
    }
  };

  // Handle cell updates dynamically for a specific tab
  const handleUpdate = (tabKey, index, field, value) => {
    const updatedTabData = [...activeData[tabKey]];
    updatedTabData[index][field] = value;

    setActiveData({
      ...activeData,
      [tabKey]: updatedTabData,
    });
  };

  const addRow = (tabKey) => {
    const newRow = {};
    const currentColumns = columns[tabKey] || [];
    currentColumns.forEach((col) => {
      newRow[col] = col === "id" ? activeData[tabKey].length + 1 : ""; // Default ID or empty
    });

    setActiveData({
      ...activeData,
      [tabKey]: [...activeData[tabKey], newRow],
    });

    saveData();
  };

  const addColumn = (tabKey) => {
    const newColumn = prompt("Enter column name:");
    if (newColumn) {
      const updatedColumns = [...(columns[tabKey] || []), newColumn];
      const updatedTabData = activeData[tabKey].map((row) => ({
        ...row,
        [newColumn]: "",
      }));

      setColumns({
        ...columns,
        [tabKey]: updatedColumns,
      });

      setActiveData({
        ...activeData,
        [tabKey]: updatedTabData,
      });
    }
  };

  const deleteRow = (tabKey, index) => {
    const updatedTabData = activeData[tabKey].filter((_, i) => i !== index);
    setActiveData({
      ...activeData,
      [tabKey]: updatedTabData,
    });
  };

  const deleteColumn = (tabKey, col) => {
    const updatedColumns = columns[tabKey].filter((column) => column !== col);
    const updatedTabData = activeData[tabKey].map((row) => {
      const { [col]: _, ...rest } = row; // Remove the column from each row
      return rest;
    });

    setColumns({
      ...columns,
      [tabKey]: updatedColumns,
    });

    setActiveData({
      ...activeData,
      [tabKey]: updatedTabData,
    });
  };

  const deleteTab = (tabKey) => {
    const updatedKeys = keys.filter((key) => key !== tabKey);
    const updatedData = { ...activeData };
    delete updatedData[tabKey];

    setKeys(updatedKeys);
    setActiveData(updatedData);
    setActiveTab(0);
  };

  const addTab = () => {
    const newTabName = prompt("Enter new tab name:");
    if (newTabName) {
      setKeys((prevKeys) => [...prevKeys, newTabName]);
      setColumns((prevColumns) => ({
        ...prevColumns,
        [newTabName]: ["id", "name"],
      }));
      setActiveData({
        ...activeData,
        [newTabName]: [{ id: 1, name: "" }],
      });

      saveData();
    }
  };

  const handleKeyDown = (e, rowIndex, colIndex, tabKey) => {
    if (e.key === "Enter") {
      const nextRowIndex = rowIndex + 1;
      const nextInput = inputRefs.current[tabKey]?.[nextRowIndex]?.[colIndex];

      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const autoResize = (textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  const filteredRows =
    activeData[keys[activeTab]]?.filter((row) =>
      columns[keys[activeTab]].some((col) =>
        String(row[col]).toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) || [];

  return (
    <div className="p-4 text-xs">
      <h1 className="text-2xl font-bold mb-4">Manage Your Projects</h1>
      {/* Tabs Header */}
      <div className="flex gap-4 mb-4 overflow-auto">
        {keys.map((key, index) => (
          <button
            key={key}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 rounded-md ${
              activeTab === index ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}>
            {key
              .split("_")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")}
          </button>
        ))}
        <button
          onClick={addTab}
          className="bg-green-500 text-white p-2 rounded-md ml-4">
          Add Tab
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative  w-full max-w-[420px] bg-[#eee]">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-md w-full max-w-[400px] bg-[#eee]"
        />
        <button
          className="text-xl absolute right-2"
          onClick={() => setSearchQuery("")}>
          &times;
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {keys[activeTab] && (
          <div>
            <div className="sticky top-0 bg-white">
              <h2 className="text-xl font-bold mb-2">
                {keys[activeTab]
                  .split("_")
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  )
                  .join(" ")}
              </h2>
              <div className="flex items-center my-1">
                <button
                  onClick={() => addRow(keys[activeTab])}
                  className="bg-blue-500 text-white px-4 p-2 rounded mr-5">
                  Add Row
                </button>
                <button
                  onClick={() => addColumn(keys[activeTab])}
                  className="bg-yellow-500 text-white px-6 p-2 rounded mr-5">
                  Add Column
                </button>
                <button
                  onClick={saveData}
                  className="bg-green-500 text-white p-2 rounded">
                  Save Changes
                </button>
                <button
                  onClick={() => deleteTab(keys[activeTab])}
                  className="bg-red-500 text-white p-2 rounded ml-4">
                  Delete Tab
                </button>
              </div>
            </div>

            {/* Table Content for Active Tab */}
            <div className="flex overflow-auto">
              <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                  {/* Total Row */}
                  <tr className="bg-gray-100 font-bold">
                    <th className="border border-gray-300 px-4 py-2 min-w-[50px]">
                      Sr No.
                    </th>
                    {columns[keys[activeTab]]?.map((col) => {
                      if (col === "id") return null; // Hide ID column
                      const total = activeData[keys[activeTab]]?.reduce(
                        (sum, row) =>
                          isNaN(Number(row[col]))
                            ? sum
                            : sum + Number(row[col]),
                        0
                      );
                      return (
                        <th
                          key={`total-${col}`}
                          className="border border-gray-300 px-4 py-2 min-w-[150px]">
                          {isNaN(total) || total === 0 ? "" : total}
                        </th>
                      );
                    })}
                  </tr>
                  {/* Header Row */}
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 min-w-[50px]">
                      Sr No.
                    </th>
                    {columns[keys[activeTab]]?.map((col) =>
                      col === "id" ? null : (
                        <th
                          key={col}
                          className="border border-gray-300 px-4 py-2 min-w-[150px]">
                          <div className="flex items-center justify-center">
                            {col
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase()
                              )
                              .join(" ")}
                            <button
                              onClick={() => deleteColumn(keys[activeTab], col)}
                              className="ml-2 text-red-500 text-xl">
                              &times;
                            </button>
                          </div>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <div className="flex items-center justify-center">
                          {rowIndex + 1}
                          <button
                            onClick={() => deleteRow(keys[activeTab], rowIndex)}
                            className="ml-2 text-red-500 text-xl">
                            &times;
                          </button>
                        </div>
                      </td>
                      {columns[keys[activeTab]]?.map((col, colIndex) =>
                        col === "id" ? null : (
                          <td
                            key={col}
                            className="border border-gray-300 px-2 py-1">
                            <textarea
                              value={row[col]}
                              rows={3}
                              onChange={(e) => {
                                handleUpdate(
                                  keys[activeTab],
                                  rowIndex,
                                  col,
                                  e.target.value
                                );
                                autoResize(e.target);
                              }}
                              className="w-full p-2 resize-none overflow-hidden text-start align-top"
                              ref={(el) => {
                                if (!inputRefs.current[keys[activeTab]]) {
                                  inputRefs.current[keys[activeTab]] = [];
                                }
                                if (
                                  !inputRefs.current[keys[activeTab]][rowIndex]
                                ) {
                                  inputRefs.current[keys[activeTab]][rowIndex] =
                                    [];
                                }
                                inputRefs.current[keys[activeTab]][rowIndex][
                                  colIndex
                                ] = el;
                              }}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  !e.shiftKey &&
                                  !e.ctrlKey
                                ) {
                                  e.preventDefault();
                                  handleKeyDown(
                                    e,
                                    rowIndex,
                                    colIndex,
                                    keys[activeTab]
                                  );
                                } else if (
                                  (e.ctrlKey && e.key === "Enter") ||
                                  (e.shiftKey && e.key === "Enter")
                                ) {
                                  e.preventDefault();
                                  const target = e.target;
                                  const cursorPosition = target.selectionStart;
                                  const value = target.value;

                                  const newValue =
                                    value.slice(0, cursorPosition) +
                                    "\n" +
                                    value.slice(cursorPosition);
                                  handleUpdate(
                                    keys[activeTab],
                                    rowIndex,
                                    col,
                                    newValue
                                  );

                                  setTimeout(() => {
                                    target.value = newValue;
                                    target.selectionStart =
                                      target.selectionEnd = cursorPosition + 1;
                                    autoResize(target);
                                  }, 0);
                                }
                              }}
                            />
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabManager;
