<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\House;
use App\Models\Resident;
use App\Models\HouseResident;

$currentCount = Resident::count();
$toAdd = 15 - $currentCount;

if ($toAdd > 0) {
    for ($i = 0; $i < $toAdd; $i++) {
        $houseNumber = 'R' . uniqid() . $i;
        $house = House::create(['house_number' => $houseNumber, 'status' => 'dihuni']);
        
        $resident = Resident::create([
            'full_name' => 'Warga ' . ($currentCount + $i + 1),
            'ktp_number' => rand(1000000000000000, 9999999999999999),
            'status' => 'tetap',
            'phone_number' => rand(8000000000, 8999999999),
            'is_married' => rand(0, 1)
        ]);

        HouseResident::create([
            'house_id' => $house->id,
            'resident_id' => $resident->id,
            'start_date' => now()->toDateString()
        ]);
    }
    echo "Added $toAdd residents.\n";
} else {
    echo "Already have 15 or more residents.\n";
}
