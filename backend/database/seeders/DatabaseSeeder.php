<?php

namespace Database\Seeders;

use App\Models\Resident;
use App\Models\House;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\HouseResident;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Residents
        $residents = [
            ['full_name' => 'Ahmad Subarjo', 'status' => 'tetap', 'phone_number' => '081234567890', 'is_married' => true],
            ['full_name' => 'Siti Aminah', 'status' => 'tetap', 'phone_number' => '081234567891', 'is_married' => true],
            ['full_name' => 'Budi Santoso', 'status' => 'kontrak', 'phone_number' => '081234567892', 'is_married' => false],
            ['full_name' => 'Dewi Lestari', 'status' => 'tetap', 'phone_number' => '081234567893', 'is_married' => true],
            ['full_name' => 'Eko Prasetyo', 'status' => 'kontrak', 'phone_number' => '081234567894', 'is_married' => false],
        ];

        foreach ($residents as $r) {
            Resident::create($r);
        }

        // 2. Create 20 Houses
        for ($i = 1; $i <= 20; $i++) {
            House::create([
                'house_number' => 'A' . str_pad($i, 2, '0', STR_PAD_LEFT),
                'status' => 'tidak_dihuni'
            ]);
        }

        // 3. Assign Residents to first 5 houses
        $allResidents = Resident::all();
        $allHouses = House::all();

        for ($i = 0; $i < 5; $i++) {
            $house = $allHouses[$i];
            $resident = $allResidents[$i];

            HouseResident::create([
                'house_id' => $house->id,
                'resident_id' => $resident->id,
                'start_date' => now()->subMonths(5),
                'is_current' => true
            ]);

            $house->update(['status' => 'dihuni']);

            // 4. Create Payments for these houses
            for ($m = 1; $m <= 4; $m++) {
                Payment::create([
                    'house_id' => $house->id,
                    'resident_id' => $resident->id,
                    'fee_type' => 'satpam',
                    'amount' => 100000,
                    'payment_date' => now()->subMonths(5-$m),
                    'month' => $m,
                    'year' => 2026
                ]);

                Payment::create([
                    'house_id' => $house->id,
                    'resident_id' => $resident->id,
                    'fee_type' => 'kebersihan',
                    'amount' => 15000,
                    'payment_date' => now()->subMonths(5-$m),
                    'month' => $m,
                    'year' => 2026
                ]);
            }
        }

        // 5. Create Expenses
        $expenses = [
            ['description' => 'Gaji Satpam Januari', 'amount' => 2500000, 'expense_date' => '2026-01-28'],
            ['description' => 'Perbaikan Lampu Jalan', 'amount' => 450000, 'expense_date' => '2026-02-15'],
            ['description' => 'Gaji Satpam Februari', 'amount' => 2500000, 'expense_date' => '2026-02-28'],
            ['description' => 'Pembelian Alat Kebersihan', 'amount' => 300000, 'expense_date' => '2026-03-10'],
        ];

        foreach ($expenses as $e) {
            Expense::create($e);
        }
    }
}
