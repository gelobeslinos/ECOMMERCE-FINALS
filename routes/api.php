<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\NotificationController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {

    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Notifications
    Route::get('/notifications', function (Request $request) {
        return $request->user()->notifications;
    });
    Route::post('/notifications/{id}/accept', [NotificationController::class, 'accept']);
    Route::post('/notifications/{id}/decline', [NotificationController::class, 'decline']);
    Route::get('/notifications', function () {
        return auth()->user()->notifications;
    });
    // Orders
    Route::post('/buy-item', [OrderController::class, 'store']);
    Route::get('/my-orders', [OrderController::class, 'myOrders']);
    Route::post('/orders/{order}/accept', [OrderController::class, 'accept']);
    Route::post('/orders/{order}/decline', [OrderController::class, 'decline']);
    Route::get('/orders/accepted', [OrderController::class, 'acceptedOrders']);
    Route::get('/notifications', [OrderController::class, 'notifications']);
    Route::middleware('auth:sanctum')->post('/mark-received/{id}', [OrderController::class, 'markAsReceived']);

    // Items
    Route::get('/items', [ItemController::class, 'index']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/items-for-sale', [ItemController::class, 'getItemsForSale']);
    Route::put('/items/{id}', [ItemController::class, 'update']);
    Route::delete('/items/{id}', [ItemController::class, 'destroy']);
});
