<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function accept($id)
    {
        DB::beginTransaction();
        
        try {
            $notification = auth()->user()->notifications()->findOrFail($id);
            $data = $notification->data;

            $order = Order::findOrFail($data['order_id']);
            $order->status = 'accepted';
            $order->save();

            Transaction::create([
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'item_id' => $order->item_id,
                'quantity' => $order->quantity,
                'status' => 'accepted',
            ]);

            $notification->delete();

            DB::commit();

            return response()->json(['message' => 'Order accepted successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to accept the order.'], 500);
        }
    }

    public function decline($id)
    {
        DB::beginTransaction();

        try {
            $notification = auth()->user()->notifications()->findOrFail($id);
            $data = $notification->data;

            $order = Order::findOrFail($data['order_id']);
            $order->status = 'declined';
            $order->save();

            Transaction::create([
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'item_id' => $order->item_id,
                'quantity' => $order->quantity,
                'status' => 'declined',
            ]);

            $notification->delete();

            DB::commit();

            return response()->json(['message' => 'Order declined and recorded.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to decline the order.'], 500);
        }
    }
}
