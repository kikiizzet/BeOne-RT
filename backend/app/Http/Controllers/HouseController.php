<?php

namespace App\Http\Controllers;

use App\Models\House;
use App\Models\HouseResident;
use Illuminate\Http\Request;

class HouseController extends Controller
{
    public function index()
    {
        return response()->json(House::with(['residents' => function($q) {
            $q->wherePivot('is_current', true);
        }])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'house_number' => 'required|string|unique:houses',
            'status' => 'required|in:dihuni,tidak_dihuni',
        ]);

        $house = House::create($validated);
        return response()->json($house, 201);
    }

    public function show(House $house)
    {
        $house->load(['residents' => function($q) {
            $q->orderByPivot('created_at', 'desc')
              ->withPivot('start_date', 'end_date', 'is_current');
        }]);

        return response()->json($house);
    }


    public function update(Request $request, House $house)
    {
        $validated = $request->validate([
            'house_number' => 'sometimes|required|string|unique:houses,house_number,' . $house->id,
            'status' => 'sometimes|required|in:dihuni,tidak_dihuni',
        ]);

        $house->update($validated);
        return response()->json($house);
    }

    public function assignResident(Request $request, House $house)
    {
        $validated = $request->validate([
            'resident_id' => 'required|exists:residents,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Mark current resident as old
        HouseResident::where('house_id', $house->id)
            ->where('is_current', true)
            ->update(['is_current' => false, 'end_date' => now()]);

        // Assign new resident
        $houseResident = HouseResident::create([
            'house_id' => $house->id,
            'resident_id' => $validated['resident_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'is_current' => true,
        ]);

        $house->update(['status' => 'dihuni']);

        return response()->json($houseResident, 201);
    }

    public function checkoutResident(House $house)
    {
        // Mark current resident as old
        HouseResident::where('house_id', $house->id)
            ->where('is_current', true)
            ->update([
                'is_current' => false, 
                'end_date' => now()
            ]);

        $house->update(['status' => 'tidak_dihuni']);

        return response()->json(['message' => 'Resident checked out successfully']);
    }

    public function destroy(House $house)
    {
        $house->delete();
        return response()->json(null, 204);
    }
}
