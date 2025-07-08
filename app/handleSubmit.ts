"use server";

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Define a type for the form input
export type SubmitForm = {
  description: string;
  amount: number;
  type: 'expense' | 'income' | 'Savings' | 'Emergency Fund';
  date: string;
};

// Define a type for the row to avoid 'any'
type FinanceRow = {
  description: string;
  recId: string;
  rec_status: boolean;
  created_at: string;
  expense: number | null;
  income: number | null;
  savings: number | null;
  emergency_fund: number | null;
};

export async function handleSubmit(form: SubmitForm) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Generate a random 6-digit recId as a string
  const recId = Math.floor(100000 + Math.random() * 900000).toString();

  // Prepare the row object
  const row: FinanceRow = {
    description: form.description,
    recId,
    rec_status: true,
    created_at: form.date, // Insert date into created_at column
    expense: null,
    income: null,
    savings: null,
    emergency_fund: null,
  };

  // Place the amount in the correct column based on type
  switch (form.type) {
    case 'expense':
      row.expense = form.amount;
      break;
    case 'income':
      row.income = form.amount;
      break;
    case 'Savings':
      row.savings = form.amount;
      break;
    case 'Emergency Fund':
      row.emergency_fund = form.amount;
      break;
    default:
      break;
  }

  // Insert into Supabase
  const { data, error } = await supabase
    .from('finance-tracker')
    .insert([row]);

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert successful:', data);
  }

  return { data, error };
}
