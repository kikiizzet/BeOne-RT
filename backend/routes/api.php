<?php

use App\Http\Controllers\ResidentController;
use App\Http\Controllers\HouseController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::apiResource('residents', ResidentController::class);

Route::apiResource('houses', HouseController::class);
Route::post('houses/{house}/assign', [HouseController::class, 'assignResident']);
Route::post('houses/{house}/checkout', [HouseController::class, 'checkoutResident']);

Route::get('payments', [PaymentController::class, 'index']);
Route::get('payments/billing-status', [PaymentController::class, 'billingStatus']);
Route::post('payments', [PaymentController::class, 'store']);
Route::post('payments/bulk', [PaymentController::class, 'bulkStore']);
Route::post('payments/bulk-confirm', [PaymentController::class, 'bulkConfirm']);
Route::post('payments/bulk-confirm-selected', [PaymentController::class, 'bulkConfirmSelected']);
Route::put('payments/{payment}/confirm', [PaymentController::class, 'confirm']);
Route::delete('payments/bulk-delete', [PaymentController::class, 'destroyAll']);
Route::delete('payments/{payment}', [PaymentController::class, 'destroy']);

Route::apiResource('expenses', ExpenseController::class);

Route::prefix('dashboard')->group(function () {
    Route::get('summary', [DashboardController::class, 'summary']);
    Route::get('charts', [DashboardController::class, 'chartData']);
    Route::get('report', [DashboardController::class, 'detailedReport']);
});
