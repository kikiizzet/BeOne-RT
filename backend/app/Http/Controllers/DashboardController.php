<?php

namespace App\Http\Controllers;

use App\Models\Resident;
use App\Models\House;
use App\Models\Payment;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $totalResidents = Resident::count();
        $occupiedHouses = House::where('status', 'dihuni')->count();
        $totalIncome = Payment::where('status', 'paid')->sum('amount');
        $totalExpenses = Expense::sum('amount');
        $totalHouses = House::count();
        $balance = $totalIncome - $totalExpenses;

        $currentMonth = date('n');
        $currentYear = date('Y');
        
        // Unpaid houses count for current month
        $pendingPayments = Payment::where('month', $currentMonth)
                                  ->where('year', $currentYear)
                                  ->where('status', 'pending')
                                  ->count();

        // Recent 5 transactions (mixed income and expenses)
        $recentIncomes = Payment::with('house')
                                ->where('status', 'paid')
                                ->orderBy('payment_date', 'desc')
                                ->take(5)
                                ->get()
                                ->map(function($item) {
                                    return [
                                        'type' => 'income',
                                        'description' => 'Iuran ' . $item->fee_type . ' (Rumah ' . $item->house->house_number . ')',
                                        'amount' => $item->amount,
                                        'date' => $item->payment_date
                                    ];
                                });

        $recentExpenses = Expense::orderBy('expense_date', 'desc')
                                 ->take(5)
                                 ->get()
                                 ->map(function($item) {
                                     return [
                                         'type' => 'expense',
                                         'description' => $item->description,
                                         'amount' => $item->amount,
                                         'date' => $item->expense_date
                                     ];
                                 });

        $recentTransactions = $recentIncomes->concat($recentExpenses)
                                            ->sortByDesc('date')
                                            ->take(5)
                                            ->values();

        return response()->json([
            'total_residents' => $totalResidents,
            'occupied_houses' => $occupiedHouses,
            'total_houses' => $totalHouses,
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'balance' => $balance,
            'pending_payments' => $pendingPayments,
            'recent_transactions' => $recentTransactions
        ]);
    }

    public function chartData()
    {
        // Monthly income vs expenses for the current year
        $income = Payment::select(
            DB::raw('sum(amount) as total'),
            'month'
        )
        ->where('year', date('Y'))
        ->where('status', 'paid')
        ->groupBy('month')
        ->orderBy('month', 'asc')
        ->get();

        $expenses = Expense::select(
            DB::raw('sum(amount) as total'),
            DB::raw('MONTH(expense_date) as month')
        )
        ->whereYear('expense_date', date('Y'))
        ->groupBy('month')
        ->orderBy('month', 'asc')
        ->get();

        return response()->json([
            'income' => $income,
            'expenses' => $expenses
        ]);
    }

    public function detailedReport(Request $request)
    {
        $month = $request->query('month', date('n'));
        $year = $request->query('year', date('Y'));

        $payments = Payment::with(['house', 'resident'])
            ->where('month', $month)
            ->where('year', $year)
            ->get();

        $expenses = Expense::whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month)
            ->get();

        return response()->json([
            'payments' => $payments,
            'expenses' => $expenses
        ]);
    }
}
