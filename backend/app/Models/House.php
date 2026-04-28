<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class House extends Model
{
    protected $fillable = ['house_number', 'status'];

    public function residents()
    {
        return $this->belongsToMany(Resident::class, 'house_residents')
                    ->withPivot('start_date', 'end_date', 'is_current')
                    ->withTimestamps();
    }
}
