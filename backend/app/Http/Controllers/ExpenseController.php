<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::orderBy('expense_date', 'desc');

        // Optional month/year filter
        if ($request->has('month') && $request->month) {
            $query->whereMonth('expense_date', $request->month);
        }
        if ($request->has('year') && $request->year) {
            $query->whereYear('expense_date', $request->year);
        }
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        $expenses = $query->get();

        // Build summary
        $summary = [
            'total_amount'   => $expenses->sum('amount'),
            'total_count'    => $expenses->count(),
            'by_category'    => $expenses->groupBy('category')->map(fn($items) => [
                'count'  => $items->count(),
                'amount' => $items->sum('amount'),
            ]),
        ];

        return response()->json([
            'data'    => $expenses,
            'summary' => $summary,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'  => 'required|string',
            'category'     => 'required|string',
            'amount'       => 'required|numeric',
            'expense_date' => 'required|date',
            'is_recurring' => 'boolean',
        ]);

        $expense = Expense::create($validated);
        return response()->json($expense, 201);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'description'  => 'sometimes|required|string',
            'category'     => 'sometimes|required|string',
            'amount'       => 'sometimes|required|numeric',
            'expense_date' => 'sometimes|required|date',
            'is_recurring' => 'sometimes|boolean',
        ]);

        $expense->update($validated);
        return response()->json($expense);
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return response()->json(null, 204);
    }
}
