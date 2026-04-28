<?php

namespace App\Http\Controllers;

use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResidentController extends Controller
{
    public function index()
    {
        return response()->json(Resident::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'photo' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'ktp_image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'status' => 'required|in:tetap,kontrak',
            'phone_number' => 'required|string',
            'is_married' => 'required',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('photos', 'public');
            $validated['photo_path'] = $path;
        }

        if ($request->hasFile('ktp_image')) {
            $path = $request->file('ktp_image')->store('ktp_images', 'public');
            $validated['ktp_image_path'] = $path;
        }

        unset($validated['photo'], $validated['ktp_image']);
        
        $validated['is_married'] = filter_var($request->is_married, FILTER_VALIDATE_BOOLEAN);

        $resident = Resident::create($validated);
        return response()->json($resident, 201);
    }

    public function show(Resident $resident)
    {
        return response()->json($resident->load('houses'));
    }

    public function update(Request $request, Resident $resident)
    {
        $validated = $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'photo' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'ktp_image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'status' => 'sometimes|required|in:tetap,kontrak',
            'phone_number' => 'sometimes|required|string',
            'is_married' => 'sometimes|required',
        ]);

        if ($request->hasFile('photo')) {
            if ($resident->photo_path) {
                Storage::disk('public')->delete($resident->photo_path);
            }
            $path = $request->file('photo')->store('photos', 'public');
            $validated['photo_path'] = $path;
        }

        if ($request->hasFile('ktp_image')) {
            if ($resident->ktp_image_path) {
                Storage::disk('public')->delete($resident->ktp_image_path);
            }
            $path = $request->file('ktp_image')->store('ktp_images', 'public');
            $validated['ktp_image_path'] = $path;
        }

        unset($validated['photo'], $validated['ktp_image']);

        if ($request->has('is_married')) {
            $validated['is_married'] = filter_var($request->is_married, FILTER_VALIDATE_BOOLEAN);
        }

        $resident->update($validated);
        return response()->json($resident);
    }

    public function destroy(Resident $resident)
    {
        if ($resident->ktp_image_path) {
            Storage::disk('public')->delete($resident->ktp_image_path);
        }
        $resident->delete();
        return response()->json(null, 204);
    }
}
