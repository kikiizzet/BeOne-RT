<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resident extends Model
{
    protected $fillable = ['full_name', 'photo_path', 'ktp_image_path', 'status', 'phone_number', 'is_married'];

    public function houses()
    {
        return $this->belongsToMany(House::class, 'house_residents')
                    ->withPivot('start_date', 'end_date', 'is_current')
                    ->withTimestamps();
    }
}
