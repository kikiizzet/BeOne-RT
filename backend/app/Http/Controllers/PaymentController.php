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
        $year = $request->query('year', date('Y'));

        $houses = \App\Models\House::with('residents')->where('status', 'dihuni')->get();
        $payments = Payment::where('month', $month)->where('year', $year)->get();

        // Get all custom fee types for this month
        $customFeeTypes = $payments->whereNotIn('fee_type', ['satpam', 'kebersihan'])
                                   ->pluck('fee_type')
                                   ->unique()
                                   ->values();

        $status = $houses->map(function ($house) use ($payments, $customFeeTypes) {
            $housePayments = $payments->where('house_id', $house->id);
            
            $fees = [
                'satpam' => [
                    'status' => $housePayments->where('fee_type', 'satpam')->where('status', 'paid')->first() ? 'paid' : 'pending',
                    'amount' => 100000,
                    'payment_id' => $housePayments->where('fee_type', 'satpam')->first()?->id
                ],
                'kebersihan' => [
                    'status' => $housePayments->where('fee_type', 'kebersihan')->where('status', 'paid')->first() ? 'paid' : 'pending',
                    'amount' => 15000,
                    'payment_id' => $housePayments->where('fee_type', 'kebersihan')->first()?->id
                ]
            ];

            foreach ($customFeeTypes as $type) {
                $p = $housePayments->where('fee_type', $type)->first();
                $fees[$type] = [
                    'status' => $p?->status ?? 'none', // none if they aren't billed for this custom fee
                    'amount' => $p?->amount ?? 0,
                    'payment_id' => $p?->id
                ];
            }

            return [
                'house_id' => $house->id,
                'house_number' => $house->house_number,
                'resident' => $house->residents->first(),
                'fees' => $fees
            ];
        });

        return response()->json([
            'status' => $status,
            'custom_types' => $customFeeTypes
        ]);
    }

    public function confirm(Payment $payment)
    {
        $payment->update([
            'status' => 'paid',
            'payment_date' => now()
        ]);
        return response()->json($payment);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'house_id' => 'required|exists:houses,id',
            'resident_id' => 'required|exists:residents,id',
            'fee_type' => 'required|string',
            'amount' => 'required|numeric',
            'payment_date' => 'required|date',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $validated['status'] = 'paid'; // Manual store is always paid

        $payment = Payment::create($validated);
        return response()->json($payment, 201);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'house_ids' => 'required|array',
            'house_ids.*' => 'exists:houses,id',
            'fee_type' => 'required|string',
            'amount' => 'required|numeric',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $payments = [];
        foreach ($validated['house_ids'] as $houseId) {
            $house = \App\Models\House::with('residents')->find($houseId);
            if ($house && $house->residents->first()) {
                $payments[] = Payment::create([
                    'house_id' => $houseId,
                    'resident_id' => $house->residents->first()->id,
                    'fee_type' => $validated['fee_type'],
                    'amount' => $validated['amount'],
                    'payment_date' => now(),
                    'month' => $validated['month'],
                    'year' => $validated['year'],
                    'status' => 'pending' // Bulk billing starts as pending
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
            'amount' => 'required|numeric',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
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
                        'status' => 'paid',
                        'payment_date' => now()
                    ]);
                }
            } else {
                Payment::create([
                    'house_id' => $house->id,
                    'resident_id' => $resident->id,
                    'fee_type' => $validated['fee_type'],
                    'amount' => $validated['amount'],
                    'payment_date' => now(),
                    'month' => $validated['month'],
                    'year' => $validated['year'],
                    'status' => 'paid'
                ]);
            }
        }

        return response()->json(['message' => 'Bulk confirm successful']);
    }
}
