<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['description', 'category', 'amount', 'expense_date', 'is_recurring'];
}
