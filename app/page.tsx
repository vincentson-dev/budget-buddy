"use client"

import { useEffect, useState } from "react";
import { handleSubmit } from "./handleSubmit";
import { createClient } from '@/utils/supabase/client';
import Swal from 'sweetalert2';

export default function Home() {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "income",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Edit modal state
  const [editMode, setEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState("");

  // Animation state for modal
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch entries on mount and after adding a new entry
  const fetchEntries = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('finance-tracker')
      .select()
      .eq('rec_status', true);
    setEntries(data || []);
    // Calculate balance
    const bal =
      data?.reduce((acc: number, entry: any) => {
        if (entry.income) return acc + Number(entry.income);
        if (entry.savings) return acc + Number(entry.savings);
        if (entry.emergency_fund) return acc + Number(entry.emergency_fund);
        if (entry.expense) return acc - Number(entry.expense);
        return acc;
      }, 0) ?? 0;
    setBalance(bal);
    setLoading(false);
  };

  const deleteEntry = async (recId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('finance-tracker')
      .update({ rec_status: false })
      .eq('recId', recId);

    if (error) {
      console.error('Error deleting entry:', error);
    }
    await fetchEntries();
  };

  const editEntryDescription = async (recId: number, newDescription: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('finance-tracker')
      .update({ description: newDescription })
      .eq('recId', recId);

    if (error) {
      console.error('Error editing entry:', error);
    }
    await fetchEntries();
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Modal animation logic
  useEffect(() => {
    if (modalOpen) {
      setModalVisible(true);
    } else {
      const timeout = setTimeout(() => setModalVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [modalOpen]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const { error } = await handleSubmit({
      description: form.description,
      amount: Number(form.amount),
      type: form.type as "expense" | "income" | "Savings" | "Emergency Fund",
      date: form.date,
    });

    if (error) {
      setMessage("Failed to add entry.");
    } else {
      setMessage("Entry added successfully!");
      setForm({
        description: "",
        amount: "",
        type: "expense",
        date: new Date().toISOString().split("T")[0],
      });
      await fetchEntries();
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Entry added successfully!',
        confirmButtonColor: '#14b8a6'
      });
    }
    setSubmitting(false);
  };

  const filteredEntries = entries.filter((entry: any) => {
    if (filter === "All") return true;
    if (filter === "Expense" && entry.expense) return true;
    if (filter === "Income" && entry.income) return true;
    if (filter === "Savings" && entry.savings) return true;
    if (filter === "Emergency Fund" && entry.emergency_fund) return true;
    return false;
  });

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEntry(null);
    setEditMode(false);
    setEditDescription("");
  };

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center py-10">
      <h1 className="text-4xl font-extrabold mb-10 text-teal-700 tracking-tight drop-shadow">
        Finance Tracker
      </h1>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col md:flex-row overflow-hidden border border-teal-100">
        {/* Entry Form */}
        <div className="md:w-1/2 w-full p-10 border-b md:border-b-0 md:border-r border-teal-100 bg-teal-50">
          <h2 className="text-2xl font-semibold mb-6 text-teal-800">Add Entry</h2>
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <input
              name="description"
              type="text"
              placeholder="Description"
              className="px-4 py-3 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 placeholder:text-gray-600"
              value={form.description}
              onChange={onChange}
              required
            />
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              className="px-4 py-3 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700 placeholder:text-gray-600"
              value={form.amount}
              onChange={onChange}
              required
            />
            <select
              name="type"
              className="px-4 py-3 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-700"
              value={form.type}
              onChange={onChange}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="Savings">Savings</option>
              <option value="Emergency Fund">Emergency Fund</option>
            </select>
            <input
              name="date"
              type="date"
              className="px-4 py-3 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-teal-900"
              value={form.date}
              onChange={onChange}
              required
            />
            <button
              type="submit"
              className="bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition shadow-md"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Entry"}
            </button>
          </form>
        </div>
        {/* Entries List */}
        <div className="md:w-1/2 w-full p-10 bg-white">
          <h2 className="text-2xl font-semibold mb-6 text-teal-800">
            Balance:{" "}
            <span className="text-teal-600">
              ₱ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </h2>
          {/* Filter Buttons */}
          <div className="mb-4 flex flex-nowrap gap-2">
            {["All", "Income", "Savings", "Expense", "Emergency Fund"].map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full text-sm font-semibold border transition
                  ${
                    filter === type
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                  }
                `}
                onClick={() => setFilter(type)}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
          {/* Make the entries list scrollable */}
          <div className="max-h-80 overflow-y-auto">
            <ul className="space-y-4 min-h-[48px] flex flex-col justify-center">
              {loading ? (
                <li className="flex justify-center items-center py-8 w-full">
                  <svg className="animate-spin h-8 w-8 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                </li>
              ) : filteredEntries && filteredEntries.length > 0 ? (
                [...filteredEntries]
                  .sort((a, b) =>
                    new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
                  )
                  .map((entry: any) => {
                    let type = "";
                    if (entry.expense) type = "Expense";
                    else if (entry.income) type = "Income";
                    else if (entry.savings) type = "Savings";
                    else if (entry.emergency_fund) type = "Emergency Fund";

                    return (
                      <li
                        key={entry.recId || entry.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-teal-50 border border-teal-100 rounded-lg px-4 py-3 cursor-pointer"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setModalOpen(true);
                        }}
                      >
                        <div>
                          <div className="font-medium text-teal-900">{entry.description}</div>
                          <div className="text-xs text-teal-500">{entry.date}</div>
                          <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs text-gray-700 font-semibold
                            ${type === 'Expense' ? 'bg-red-100 text-red-600' : ''}
                            ${type === 'Income' ? 'bg-green-100 text-green-700' : ''}
                            ${type === 'Savings' ? 'bg-blue-100 text-blue-700' : ''}
                            ${type === 'Emergency Fund' ? 'bg-yellow-100 text-yellow-700' : ''}`
                          }>
                            {type}
                          </div>
                        </div>
                        <div
                          className={
                            entry.expense
                              ? "text-red-500 font-semibold text-lg"
                              : "text-teal-700 font-semibold text-lg"
                          }
                        >
                          {entry.expense
                            ? `-₱${Number(entry.expense).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : entry.income
                            ? `+₱${Number(entry.income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : entry.savings
                            ? `+₱${Number(entry.savings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : entry.emergency_fund
                            ? `+₱${Number(entry.emergency_fund).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : ""}
                        </div>
                      </li>
                    );
                  })
              ) : (
                <li className="flex justify-center items-center py-8 w-full">
                  <span className="text-gray-500 text-2xl text-center w-full">No entries yet.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal for entry details with animation */}
      {(modalOpen || modalVisible) && selectedEntry && (
        <div
          className={`
            fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm
            transition-opacity duration-200
            ${modalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <div
            className={`
              relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-teal-200
              transition-all duration-200
              ${modalOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"}
            `}
            style={{ willChange: "transform, opacity" }}
          >
            <button
              className="absolute top-4 right-4 text-teal-400 hover:text-teal-600 text-2xl font-bold transition"
              onClick={closeModal}
              aria-label="Close"
              tabIndex={0}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-6 text-teal-700 text-center tracking-tight border-b border-teal-100 pb-4">
              Entry Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium w-28 text-gray-600">Description:</span>
                {editMode ? (
                  <input
                    className="border border-teal-200 text-gray-700 rounded px-2 py-1 flex-1 focus:ring-2 focus:ring-teal-400 outline-none transition"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span className="text-teal-900 truncate">{selectedEntry.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium w-28 text-gray-600">Type:</span>
                <span className={
                  selectedEntry.expense
                    ? "bg-red-50 text-red-600 px-2 py-1 rounded font-semibold text-xs border border-red-100"
                    : selectedEntry.income
                    ? "bg-green-50 text-green-700 px-2 py-1 rounded font-semibold text-xs border border-green-100"
                    : selectedEntry.savings
                    ? "bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold text-xs border border-blue-100"
                    : selectedEntry.emergency_fund
                    ? "bg-yellow-50 text-yellow-700 px-2 py-1 rounded font-semibold text-xs border border-yellow-100"
                    : "bg-gray-100 text-gray-500 px-2 py-1 rounded font-semibold text-xs border"
                }>
                  {selectedEntry.expense
                    ? "Expense"
                    : selectedEntry.income
                    ? "Income"
                    : selectedEntry.savings
                    ? "Savings"
                    : selectedEntry.emergency_fund
                    ? "Emergency Fund"
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium w-28 text-gray-600">Amount:</span>
                <span className={
                  selectedEntry.expense
                    ? "text-red-500 font-bold"
                    : "text-teal-700 font-bold"
                }>
                  {selectedEntry.expense
                    ? `-₱${Number(selectedEntry.expense).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : selectedEntry.income
                    ? `+₱${Number(selectedEntry.income).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : selectedEntry.savings
                    ? `+₱${Number(selectedEntry.savings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : selectedEntry.emergency_fund
                    ? `+₱${Number(selectedEntry.emergency_fund).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium w-28 text-gray-600">Date:</span>
                <span className="text-gray-700">
                  {selectedEntry.created_at
                    ? new Date(selectedEntry.created_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : selectedEntry.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium w-28 text-gray-600">Record ID:</span>
                <span className="text-gray-400">{selectedEntry.recId || selectedEntry.id}</span>
              </div>
            </div>
            {/* Edit & Delete Buttons */}
            <div className="flex justify-end mt-8 gap-2 border-t border-teal-100 pt-4">
              {editMode ? (
                <>
                  <button
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow transition"
                    onClick={async () => {
                      await editEntryDescription(selectedEntry.recId, editDescription);
                      setEditMode(false);
                      setSelectedEntry({ ...selectedEntry, description: editDescription });
                      await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Entry successfully edited!',
                        confirmButtonColor: '#14b8a6',
                        timer: 2000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didClose: () => closeModal()
                      });
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow transition"
                    onClick={() => {
                      setEditMode(false);
                      setEditDescription(selectedEntry.description);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow transition"
                  onClick={() => {
                    setEditMode(true);
                    setEditDescription(selectedEntry.description);
                  }}
                >
                  Edit
                </button>
              )}
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow transition"
                onClick={async () => {
                  const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: "This entry will be deleted.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#e11d48',
                    cancelButtonColor: '#14b8a6',
                    confirmButtonText: 'Yes, delete it!',
                    cancelButtonText: 'Cancel'
                  });
                  if (result.isConfirmed) {
                    await deleteEntry(selectedEntry.recId);
                    closeModal();
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};