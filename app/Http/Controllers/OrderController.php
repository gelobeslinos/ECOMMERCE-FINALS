<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Notifications\NewOrderNotification;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'item_id' => 'required|exists:items,id',
                'quantity' => 'required|integer|min:1',
            ]);

            $item = Item::findOrFail($validated['item_id']);

            Log::info('Processing order request', ['item_id' => $item->id, 'requested_quantity' => $validated['quantity']]);

            if (!$item->employee_id) {
                Log::error('Item has no assigned employee', ['item' => $item]);
                return response()->json(['message' => 'Item does not have an associated employee.'], 400);
            }

            if ($item->quantity < $validated['quantity']) {
                Log::error('Insufficient stock', ['available_quantity' => $item->quantity, 'requested' => $validated['quantity']]);
                return response()->json(['message' => 'Not enough quantity available.'], 400);
            }

            $item->decrement('quantity', $validated['quantity']);

            $order = Order::create([
                'customer_id' => Auth::id(),
                'employee_id' => $item->employee_id,
                'item_id' => $item->id,
                'quantity' => $validated['quantity'],
                'status' => 'pending',
            ]);

            $order->load(['customer', 'item']);

            $employee = User::find($item->employee_id);
            if ($employee) {
                $employee->notify(new NewOrderNotification($order));
                Log::info('Notification sent to employee', ['employee_id' => $employee->id]);
            }

            return response()->json(['message' => 'Order placed and employee notified!']);
        } catch (\Exception $e) {
            Log::error('Error placing order', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to place order. Please try again later.'], 500);
        }
    }

    public function accept(Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed.'], 400);
        }

        $order->update(['status' => 'accepted']);
        return response()->json(['message' => 'Order accepted.']);
    }

    public function decline(Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed.'], 400);
        }

        $order->update(['status' => 'declined']);
        return response()->json(['message' => 'Order declined.']);
    }

    public function myOrders()
    {
        $orders = Order::with(['item', 'employee'])
            ->where('customer_id', Auth::id())
            ->latest()
            ->get()
            ->map(fn($order) => [
                'id' => $order->id,
                'quantity' => $order->quantity,
                'status' => $order->status,
                'created_at' => $order->created_at->toDateTimeString(),
                'item' => [
                    'name' => $order->item->name ?? 'Unknown',
                    'price' => $order->item->price ?? null,
                ],
                'employee_name' => $order->employee->name ?? 'Unknown',
            ]);

        return response()->json($orders);
    }


    public function acceptedOrders(Request $request)
    {
        $orders = Order::with(['item', 'customer']) // Include both item and customer
            ->where('employee_id', $request->user()->id) // Get orders assigned to this employee
            ->where('status', 'accepted')
            ->latest()
            ->get()
            ->map(fn($order) => [
                'id' => $order->id,
                'item_name' => $order->item->name ?? 'Unknown',
                'quantity' => $order->quantity,
                'status' => $order->status,
                'created_at' => $order->created_at->toDateTimeString(),
                'customer_name' => $order->customer->name ?? 'Unknown' 
            ]);

        return response()->json($orders);
        
    }
    public function notifications(Request $request)
    {
        $orders = Order::with(['item', 'customer'])
            ->where('employee_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn($order) => [
                'data' => [
                    'order_id' => $order->id,
                    'item_name' => $order->item->name ?? 'Unknown',
                    'quantity' => $order->quantity,
                    'status' => $order->status,
                    'customer_id' => $order->customer_id,
                    'customer_name' => $order->customer->name ?? 'Unknown',
                ]
            ]);

        return response()->json($orders);
    }
    public function markAsReceived($id)
    {
        $order = Order::where('id', $id)
            ->where('customer_id', Auth::id())
            ->firstOrFail();
    
        if ($order->status !== 'accepted') {
            return response()->json(['message' => 'Only accepted orders can be marked as received.'], 400);
        }
    
        $order->status = 'completed';
        $order->save();
    
        return response()->json(['message' => 'Order marked as received.']);
    }
    
}
