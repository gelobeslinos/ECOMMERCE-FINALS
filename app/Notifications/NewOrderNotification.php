<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class NewOrderNotification extends Notification
{
    use Queueable;

    protected $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return new DatabaseMessage([
            'message' => 'New order placed by ' . $this->order->customer->name . ' for item ' . $this->order->item->name,
            'order_id' => $this->order->id,
            'item_name' => $this->order->item->name ?? 'Unknown',
            'quantity' => $this->order->quantity,
            'status' => $this->order->status,
            'customer_name' => $this->order->customer->name ?? 'Unknown',
            'customer_email' => $this->order->customer->email ?? 'Unknown',
        ]);
    }
}
