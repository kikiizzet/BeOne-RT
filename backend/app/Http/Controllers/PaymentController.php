<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{

    public function index(Request $request)
    {
        $query = Payment::with(['house', 'resident'])->latest();

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        return response()->json($query->get());
    }

    public function billingStatus(Request $request)
    {
        $month = $request->query('month', date('n'));
        $year  = $request->query('year', date('Y'));

        $houses   = \App\Models\House::with('residents')->where('status', 'dihuni')->get();
        $payments = Payment::where('month', $month)->where('year', $year)->get();

        $totalHouses = $houses->count();

        // Get all custom fee types for this month
        $customFeeTypes = $payments->whereNotIn('fee_type', ['satpam', 'kebersihan'])
                                   ->pluck('fee_type')
                                   ->unique()
                                   ->values();

        // Fixed fee amounts
        $fixedAmounts = [
            'satpam'     => 100000,
            'kebersihan' => 15000,
        ];

        $status = $houses->map(function ($house) use ($payments, $customFeeTypes) {
            $housePayments = $payments->where('house_id', $house->id);

            $fees = [
                'satpam' => [
                    'status'     => $housePayments->where('fee_type', 'satpam')->where('status', 'paid')->first() ? 'paid' : 'pending',
                    'amount'     => 100000,
                    'payment_id' => $housePayments->where('fee_type', 'satpam')->first()?->id,
                    'paid_date'  => $housePayments->where('fee_type', 'satpam')->where('status', 'paid')->first()?->payment_date,
                ],
                'kebersihan' => [
                    'status'     => $housePayments->where('fee_type', 'kebersihan')->where('status', 'paid')->first() ? 'paid' : 'pending',
                    'amount'     => 15000,
                    'payment_id' => $housePayments->where('fee_type', 'kebersihan')->first()?->id,
                    'paid_date'  => $housePayments->where('fee_type', 'kebersihan')->where('status', 'paid')->first()?->payment_date,
                ],
            ];

            foreach ($customFeeTypes as $type) {
                $p = $housePayments->where('fee_type', $type)->first();
                $fees[$type] = [
                    'status'     => $p?->status ?? 'none',
                    'amount'     => $p?->amount ?? 0,
                    'payment_id' => $p?->id,
                    'paid_date'  => $p?->payment_date,
                ];
            }

            return [
                'house_id'     => $house->id,
                'house_number' => $house->house_number,
                'resident'     => $house->residents->first(),
                'fees'         => $fees,
            ];
        });

        // Build summary per fee type
        $allFeeTypes = array_merge(['satpam', 'kebersihan'], $customFeeTypes->toArray());
        $summary = [];

        foreach ($allFeeTypes as $type) {
            $paidCount    = $status->filter(fn($s) => ($s['fees'][$type]['status'] ?? 'none') === 'paid')->count();
            $pendingCount = $totalHouses - $paidCount;
            $feeAmount    = $fixedAmounts[$type] ?? ($status->first()?->{'fees'}[$type]['amount'] ?? 0);
            // For custom types, use the amount from the first billing record
            if (!isset($fixedAmounts[$type])) {
                $firstPayment = $payments->where('fee_type', $type)->first();
                $feeAmount = $firstPayment ? (float) $firstPayment->amount : 0;
            }

            $summary[$type] = [
                'total'            => $totalHouses,
                'paid'             => $paidCount,
                'pending'          => $pendingCount,
                'percentage'       => $totalHouses > 0 ? round(($paidCount / $totalHouses) * 100) : 0,
                'fee_amount'       => $feeAmount,
                'target_amount'    => $feeAmount * $totalHouses,
                'collected_amount' => $feeAmount * $paidCount,
            ];
        }

        // Who hasn't paid — grouped by fee type
        $unpaidByType = [];
        foreach ($allFeeTypes as $type) {
            $unpaid = $status->filter(fn($s) => ($s['fees'][$type]['status'] ?? 'none') !== 'paid' && ($s['fees'][$type]['status'] ?? 'none') !== 'none');
            $unpaidByType[$type] = $unpaid->map(fn($s) => [
                'house_id'     => $s['house_id'],
                'house_number' => $s['house_number'],
                'resident'     => $s['resident'],
            ])->values();
        }

        return response()->json([
            'status'         => $status,
            'custom_types'   => $customFeeTypes,
            'summary'        => $summary,
            'unpaid_by_type' => $unpaidByType,
        ]);
    }

    public function confirm(Payment $payment)
    {
        $payment->update([
            'status'       => 'paid',
            'payment_date' => now(),
        ]);
        return response()->json($payment);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'house_id'     => 'required|exists:houses,id',
            'resident_id'  => 'required|exists:residents,id',
            'fee_type'     => 'required|string',
            'amount'       => 'required|numeric',
            'payment_date' => 'required|date',
            'month'        => 'required|integer|between:1,12',
            'year'         => 'required|integer',
        ]);

        $validated['status'] = 'paid'; // Manual store is always paid

        $payment = Payment::create($validated);
        return response()->json($payment, 201);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'house_ids'   => 'required|array',
            'house_ids.*' => 'exists:houses,id',
            'fee_type'    => 'required|string',
            'amount'      => 'required|numeric',
            'month'       => 'required|integer|between:1,12',
            'year'        => 'required|integer',
        ]);

        $payments = [];
        foreach ($validated['house_ids'] as $houseId) {
            $house = \App\Models\House::with('residents')->find($houseId);
            if ($house && $house->residents->first()) {
                $payments[] = Payment::create([
                    'house_id'    => $houseId,
                    'resident_id' => $house->residents->first()->id,
                    'fee_type'    => $validated['fee_type'],
                    'amount'      => $validated['amount'],
                    'payment_date' => now(),
                    'month'       => $validated['month'],
                    'year'        => $validated['year'],
                    'status'      => 'pending', // Bulk billing starts as pending
                ]);
            }
        }

        return response()->json($payments, 201);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();
        return response()->json(['message' => 'Payment deleted successfully']);
    }

    public function destroyAll()
    {
        Payment::query()->delete();
        return response()->json(['message' => 'All payments deleted successfully']);
    }

    public function bulkConfirm(Request $request)
    {
        $validated = $request->validate([
            'fee_type' => 'required|string',
            'amount'   => 'required|numeric',
            'month'    => 'required|integer|between:1,12',
            'year'     => 'required|integer',
        ]);

        $houses = \App\Models\House::with('residents')->where('status', 'dihuni')->get();

        foreach ($houses as $house) {
            $resident = $house->residents->first();
            if (!$resident) continue;

            $payment = Payment::where('house_id', $house->id)
                ->where('fee_type', $validated['fee_type'])
                ->where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->first();

            if ($payment) {
                if ($payment->status === 'pending') {
                    $payment->update([
                        'status'       => 'paid',
                        'payment_date' => now(),
                    ]);
                }
            } else {
                Payment::create([
                    'house_id'     => $house->id,
                    'resident_id'  => $resident->id,
                    'fee_type'     => $validated['fee_type'],
                    'amount'       => $validated['amount'],
                    'payment_date' => now(),
                    'month'        => $validated['month'],
                    'year'         => $validated['year'],
                    'status'       => 'paid',
                ]);
            }
        }

        return response()->json(['message' => 'Bulk confirm successful']);
    }
    public function bulkConfirmSelected(Request $request)
    {
        $validated = $request->validate([
            'selections'   => 'required|array',
            'selections.*.house_id' => 'required|exists:houses,id',
            'selections.*.fee_type' => 'required|string',
            'month'        => 'required|integer',
            'year'         => 'required|integer',
        ]);

        foreach ($validated['selections'] as $sel) {
            $house = \App\Models\House::with('residents')->find($sel['house_id']);
            if (!$house || !$house->residents->first()) continue;

            $payment = Payment::where('house_id', $sel['house_id'])
                ->where('fee_type', $sel['fee_type'])
                ->where('month', $validated['month'])
                ->where('year', $validated['year'])
                ->first();

            if ($payment) {
                if ($payment->status === 'pending') {
                    $payment->update([
                        'status'       => 'paid',
                        'payment_date' => now(),
                    ]);
                }
            } else {
                // Get default amount for fixed fees
                $amount = 0;
                if ($sel['fee_type'] === 'satpam') $amount = 100000;
                elseif ($sel['fee_type'] === 'kebersihan') $amount = 15000;
                else {
                    // Try to find amount from other payments of same type/month
                    $other = Payment::where('fee_type', $sel['fee_type'])
                                    ->where('month', $validated['month'])
                                    ->where('year', $validated['year'])
                                    ->first();
                    $amount = $other ? $other->amount : 0;
                }

                Payment::create([
                    'house_id'     => $sel['house_id'],
                    'resident_id'  => $house->residents->first()->id,
                    'fee_type'     => $sel['fee_type'],
                    'amount'       => $amount,
                    'payment_date' => now(),
                    'month'        => $validated['month'],
                    'year'         => $validated['year'],
                    'status'       => 'paid',
                ]);
            }
        }

        return response()->json(['message' => 'Selected payments confirmed successfully']);
    }
}
